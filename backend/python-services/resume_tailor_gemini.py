"""
Resume Tailoring Tool (Gemini — google-genai SDK)
Integrated with Flask API for web service
"""

import argparse
import copy
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from io import BytesIO

from docx import Document
from docx.oxml import OxmlElement
from dotenv import load_dotenv
from google import genai
from google.genai import types
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

# Gemini model
GEMINI_MODEL = "gemma-4-31b-it"
# GEMINI_MODEL = "gemini-2.5-flash"
# GEMINI_MODEL = "gemma-4-26b-a4b-it"

# ──────────────────────────────────────────────────────────────────────────────
# 1. PARSER
# ──────────────────────────────────────────────────────────────────────────────
def parse_resume(doc: Document) -> dict:
    """Parse DOCX document into structured sections"""
    sections = []
    idx = 0
    
    def runs_detail(para):
        return [{
            "text":      r.text,
            "bold":      r.bold,
            "italic":    r.italic,
            "underline": r.underline,
            "font_size": r.font.size.pt if r.font.size else None,
        } for r in para.runs]
    
    # Parse body paragraphs
    for para in doc.paragraphs:
        sections.append({
            "type":     "paragraph",
            "index":    idx,
            "style":    para.style.name,
            "text":     "".join(r.text for r in para.runs).strip(),
            "runs":     runs_detail(para),
            "_xml_ref": para._element,
        })
        idx += 1
    
    # Parse table cells
    for t_idx, table in enumerate(doc.tables):
        for r_idx, row in enumerate(table.rows):
            for c_idx, cell in enumerate(row.cells):
                for para in cell.paragraphs:
                    sections.append({
                        "type":     "table_cell",
                        "index":    idx,
                        "table":    t_idx,
                        "row":      r_idx,
                        "col":      c_idx,
                        "style":    para.style.name,
                        "text":     "".join(r.text for r in para.runs).strip(),
                        "runs":     runs_detail(para),
                        "_xml_ref": para._element,
                    })
                    idx += 1
    
    print(f"📋 [PARSE] Parsed {idx} blocks ({len(doc.paragraphs)} body paras + table cells)")
    return {"doc": doc, "sections": sections}


def build_llm_payload(parsed: dict) -> str:
    """Convert parsed sections to JSON for LLM"""
    clean = [{k: v for k, v in s.items() if not k.startswith("_")}
             for s in parsed["sections"]]
    return json.dumps(clean, ensure_ascii=False, indent=2)


# ──────────────────────────────────────────────────────────────────────────────
# 2. GEMINI TAILORING
# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert resume consultant and ATS optimization specialist.

You will receive:
- resume_sections: JSON array of every text block in a resume (index, style, text).
- job_description: full text of a job posting.

Return a JSON patch list that tailors the resume to the job.

=== RULES ===
1. ONLY change text content — never touch styles, fonts, or layout.
2. NEVER delete real experience or achievements.
3. SKILLS SECTION: Append missing hard skills from the JD to the skills section.
   Use the EXACT same separator already in the resume (comma, pipe, bullet, etc.).
4. PROJECTS — be smart:
   - Add a technology ONLY if the project domain genuinely supports it.
   - NEVER add backend tech to a frontend project or vice versa.
5. SUMMARY: Add 1-2 soft-skill keywords from the JD if a summary/objective exists.
6. Do NOT invent certifications, education, companies, or years of experience.
7. Match the tone, tense, and style of surrounding text exactly.

=== OUTPUT ===
Return ONLY a valid JSON array. No prose. No markdown fences.

[
  {
    "index": <integer>,
    "new_text": "<full replacement text>",
    "reason": "<one sentence>"
  }
]

Return [] if nothing needs to change."""


def tailor_with_gemini(resume_json: str, job_description: str) -> list[dict]:
    """Call Gemini API to get tailoring patches"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version="v1beta"),
    )
    
    user_msg = (
        f"<resume_sections>\n{resume_json}\n</resume_sections>\n\n"
        f"<job_description>\n{job_description}\n</job_description>"
    )
    
    print(f"🤖 [GEMINI] Calling {GEMINI_MODEL}...")
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_msg,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    
    raw = response.text.strip()
    print(f"✅ [GEMINI] Response received ({len(raw)} chars)")
    
    # Parse response
    try:
        result = json.loads(raw)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            for v in result.values():
                if isinstance(v, list):
                    return v
        return []
    except json.JSONDecodeError as e:
        # Try removing markdown code fences
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            print(f"❌ [GEMINI] Could not parse JSON response: {e}")
            print(f"Raw output:\n{raw[:500]}")
            return []


# ──────────────────────────────────────────────────────────────────────────────
# 3. PATCH APPLICATION
# ──────────────────────────────────────────────────────────────────────────────
def _replace_para_text(para_el, new_text: str, highlight_words=None):
    """Replace text while preserving ALL XML formatting and optionally highlighting words"""
    W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    
    existing_runs = para_el.findall(f"{{{W}}}r")
    template_rpr = None
    
    if existing_runs:
        rpr = existing_runs[0].find(f"{{{W}}}rPr")
        if rpr is not None:
            template_rpr = copy.deepcopy(rpr)
    
    # Remove all existing runs
    for r in existing_runs:
        para_el.remove(r)
    
    # If no highlighting needed, just add text normally
    if not highlight_words:
        new_r = OxmlElement("w:r")
        if template_rpr is not None:
            new_r.append(template_rpr)
        
        t_el = OxmlElement("w:t")
        t_el.text = new_text
        if new_text and (new_text[0] == " " or new_text[-1] == " "):
            t_el.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        
        new_r.append(t_el)
        para_el.append(new_r)
        return
    
    # Split text into words and highlight specified ones
    words = new_text.split()
    for i, word in enumerate(words):
        # Check if this word should be highlighted (case-insensitive)
        should_highlight = any(hw.lower() in word.lower() for hw in highlight_words)
        
        new_r = OxmlElement("w:r")
        
        # Create rPr with or without highlight
        if should_highlight:
            rpr = copy.deepcopy(template_rpr) if template_rpr is not None else OxmlElement("w:rPr")
            highlight = OxmlElement("w:highlight")
            highlight.set(f"{{{W}}}val", "yellow")
            rpr.append(highlight)
            new_r.append(rpr)
        else:
            if template_rpr is not None:
                new_r.append(copy.deepcopy(template_rpr))
        
        # Add the word with space
        t_el = OxmlElement("w:t")
        t_el.text = word + (" " if i < len(words) - 1 else "")
        t_el.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        
        new_r.append(t_el)
        para_el.append(new_r)


def apply_patches(parsed: dict, patches: list[dict]) -> int:
    """Apply Gemini's suggested patches to the document with yellow highlighting for changes"""
    index_map = {s["index"]: s for s in parsed["sections"]}
    applied = 0
    
    for patch in patches:
        idx      = patch.get("index")
        new_text = patch.get("new_text", "")
        reason   = patch.get("reason", "")
        
        section = index_map.get(idx)
        if section is None:
            print(f"  ⚠️  [SKIP] index {idx} not found")
            continue
        
        old_text = section["text"]
        if old_text.strip() == new_text.strip():
            continue
        
        # Find what was added/modified (word-level diff)
        old_words = set(old_text.lower().replace(',', '').split())
        new_words_list = new_text.replace(',', '').split()
        # Find words that are new (not in original) and longer than 1 char
        added_words = [w for w in new_words_list if w.lower() not in old_words and len(w) > 1]
        
        # Replace text and highlight added words in yellow
        _replace_para_text(section["_xml_ref"], new_text, added_words if added_words else None)
        
        print(f"\n  ✏️  Block #{idx}  |  {reason}")
        print(f"  OLD: {old_text[:90]}")
        print(f"  NEW: {new_text[:90]}")
        if added_words:
            print(f"  💛 Highlighting: {', '.join(added_words[:10])}")
        
        applied += 1
    
    return applied


# ──────────────────────────────────────────────────────────────────────────────
# 4. FLASK API
# ──────────────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "resume-tailor-gemini", "model": GEMINI_MODEL})


@app.route("/tailor", methods=["POST"])
def tailor():
    print("\n" + "="*80)
    print("🎯 [TAILOR-GEMINI] New tailoring request received")
    print("="*80)
    
    if "file" not in request.files:
        print("❌ [TAILOR-GEMINI] No file provided")
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if not file.filename.endswith(".docx"):
        print(f"❌ [TAILOR-GEMINI] Invalid file type: {file.filename}")
        return jsonify({"error": "Only DOCX files are supported"}), 400
    
    # Get job description from form
    job_description = request.form.get("jobDescription", "")
    job_title       = request.form.get("jobTitle", "")
    company         = request.form.get("company", "")
    
    # Build full JD text
    jd_text = f"Job Title: {job_title}\nCompany: {company}\n\n{job_description}"
    
    print(f"📄 [TAILOR-GEMINI] File: {file.filename}")
    print(f"💼 [TAILOR-GEMINI] Job: {job_title} at {company}")
    print(f"📝 [TAILOR-GEMINI] JD length: {len(job_description)} chars")
    
    try:
        # Load document
        doc = Document(file)
        print(f"📦 [TAILOR-GEMINI] Loaded DOCX with {len(doc.paragraphs)} paragraphs")
        
        # Parse resume
        print("\n[1/3] Parsing resume...")
        parsed = parse_resume(doc)
        
        # Tailor with Gemini
        print("\n[2/3] Tailoring with Gemini...")
        resume_json = build_llm_payload(parsed)
        patches = tailor_with_gemini(resume_json, jd_text)
        print(f"  📊 Gemini suggested {len(patches)} patch(es)")
        
        # Apply patches
        print("\n[3/3] Applying patches...")
        applied = apply_patches(parsed, patches)
        print(f"\n  ✅ {applied} change(s) applied")
        
        # Save to bytes
        output = BytesIO()
        parsed["doc"].save(output)
        output.seek(0)
        
        safe_name = f"{company}_{job_title}_Resume.docx".replace(" ", "_").replace("/", "_")
        print(f"✅ [TAILOR-GEMINI] Success! Returning {len(output.getvalue())} bytes")
        print("="*80 + "\n")
        
        return send_file(
            output,
            as_attachment=True,
            download_name=safe_name,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    
    except Exception as e:
        import traceback
        print(f"❌ [TAILOR-GEMINI] FATAL ERROR:")
        print(traceback.format_exc())
        print("="*80 + "\n")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5004))
    print("="*80)
    print(f"🚀 Starting Resume Tailor Service (Gemini)")
    print(f"📍 Port: {port}")
    print(f"🤖 Model: {GEMINI_MODEL}")
    print("="*80)
    app.run(host="0.0.0.0", port=port, debug=True)
