"""
Resume Tailoring Tool (Gemini — google-genai SDK)
Integrated with Flask API for web service

Patch actions supported:
  - "replace"       : rewrite existing block text (default)
  - "insert_after"  : insert a brand-new bullet/paragraph AFTER block at index
  - "insert_before" : insert a brand-new bullet/paragraph BEFORE block at index
  - "delete"        : remove a block entirely (use sparingly)
"""

import copy
import json
import os
import re
from io import BytesIO
from lxml import etree

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
# GEMINI_MODEL = "gemma-4-31b-it"
GEMINI_MODEL = "gemini-2.5-flash"


# ──────────────────────────────────────────────────────────────────────────────
# 1. PARSER
# ──────────────────────────────────────────────────────────────────────────────

def parse_resume(doc: Document) -> dict:
    """
    Parse DOCX into a flat list of sections, each with:
      index, type, style, text, runs, _xml_ref, _parent_ref

    _parent_ref is the XML parent element (body or cell) — required for insertions.
    """
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

    # Body paragraphs — parent is the document body element
    body = doc.element.body
    for para in doc.paragraphs:
        sections.append({
            "type":        "paragraph",
            "index":       idx,
            "style":       para.style.name,
            "text":        "".join(r.text for r in para.runs).strip(),
            "runs":        runs_detail(para),
            "_xml_ref":    para._element,
            "_parent_ref": body,
        })
        idx += 1

    # Table cell paragraphs — parent is the cell element
    for t_idx, table in enumerate(doc.tables):
        for r_idx, row in enumerate(table.rows):
            for c_idx, cell in enumerate(row.cells):
                for para in cell.paragraphs:
                    sections.append({
                        "type":        "table_cell",
                        "index":       idx,
                        "table":       t_idx,
                        "row":         r_idx,
                        "col":         c_idx,
                        "style":       para.style.name,
                        "text":        "".join(r.text for r in para.runs).strip(),
                        "runs":        runs_detail(para),
                        "_xml_ref":    para._element,
                        "_parent_ref": cell._element,
                    })
                    idx += 1

    print(f"📋 [PARSE] Parsed {idx} blocks ({len(doc.paragraphs)} body paras + table cells)")
    return {"doc": doc, "sections": sections}


def build_llm_payload(parsed: dict) -> str:
    """Convert parsed sections to clean JSON for LLM (strip internal _ keys)."""
    clean = [{k: v for k, v in s.items() if not k.startswith("_")}
             for s in parsed["sections"]]
    return json.dumps(clean, ensure_ascii=False, indent=2)


# ──────────────────────────────────────────────────────────────────────────────
# 2. KEYWORD EXTRACTION  (Pre-pass Gemini call)
# ──────────────────────────────────────────────────────────────────────────────

KEYWORD_EXTRACTION_PROMPT = """You are an expert ATS (Applicant Tracking System) analyst.

Analyze the job description and extract ALL important keywords grouped by type.

Return ONLY valid JSON. No prose, no markdown fences.

{
  "hard_skills": ["React", "Node.js", "PostgreSQL", ...],
  "soft_skills": ["cross-functional collaboration", "stakeholder management", ...],
  "domain_keywords": ["SaaS", "B2B", "agile", "CI/CD", ...],
  "action_verbs": ["architected", "optimized", "led", "deployed", ...],
  "industry_terms": ["microservices", "distributed systems", "ML pipelines", ...],
  "role_responsibilities": ["own product roadmap", "mentor junior engineers", ...]
}

Rules:
- hard_skills: specific technologies, languages, frameworks, tools, platforms
- soft_skills: interpersonal and leadership qualities the JD emphasizes
- domain_keywords: methodologies, environments, buzzwords (agile, scrum, OKRs, etc.)
- action_verbs: strong verbs from JD that describe what the role does
- industry_terms: technical concepts and jargon specific to the field
- role_responsibilities: 3-6 core things this role must do (short phrases)

Be exhaustive. Include everything that an ATS would scan for."""


def extract_jd_keywords(job_description: str) -> dict:
    """Pre-pass: extract all important keywords from the JD."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")

    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version="v1beta"),
    )

    print("🔍 [KEYWORDS] Extracting keywords from JD...")

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=f"<job_description>\n{job_description}\n</job_description>",
        config=types.GenerateContentConfig(
            system_instruction=KEYWORD_EXTRACTION_PROMPT,
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    try:
        keywords = json.loads(raw)
        total = sum(len(v) for v in keywords.values() if isinstance(v, list))
        print(f"  ✅ Extracted {total} keywords across {len(keywords)} categories")
        for cat, items in keywords.items():
            if isinstance(items, list) and items:
                print(f"     {cat}: {', '.join(items[:5])}{'...' if len(items) > 5 else ''}")
        return keywords
    except json.JSONDecodeError as e:
        print(f"  ⚠️ Could not parse keyword JSON: {e}")
        return {}


# ──────────────────────────────────────────────────────────────────────────────
# 3. GEMINI TAILORING  — supports replace / insert_after / insert_before / delete
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an elite resume strategist and ATS optimization expert.

You will receive:
- resume_sections: JSON array of every text block in the resume (index, style, text).
- job_description: the full job posting.
- jd_keywords: a structured JSON object with all important keywords extracted from the JD.

Your job is to AGGRESSIVELY transform the resume to maximize ATS score and recruiter impact.

════════════════════════════════════════════════════════
PATCH ACTIONS — you have FOUR tools
════════════════════════════════════════════════════════

Each patch must include an "action" field:

1. "replace"       — Rewrite an existing block.
                     Required fields: index, new_text.

2. "insert_after"  — Insert a brand-new bullet/paragraph AFTER the block at index.
                     Required fields: index, new_text, style.
                     Set style to the same style value as the surrounding bullets
                     (copy exactly from the nearby block's "style" field in resume_sections).

3. "insert_before" — Insert a brand-new bullet/paragraph BEFORE the block at index.
                     Required fields: index, new_text, style.

4. "delete"        — Remove a block entirely.
                     Use ONLY for truly duplicate or irrelevant content.
                     Required fields: index.

All patches also require a "reason" field (one sentence).

════════════════════════════════════════════════════════
WHAT YOU MUST DO
════════════════════════════════════════════════════════

1. EXPERIENCE BULLETS — Rewrite existing AND insert new ones:

   REWRITE (action: replace):
   - Incorporate hard_skills, action_verbs, domain_keywords, industry_terms naturally.
   - Start every bullet with a strong action verb (use JD action_verbs or synonyms).
   - Expand bullets that mention a JD-relevant technology to show HOW it was used.
   - Add measurable impact (e.g., "improved X by 30% through Y methodology").
   - Rewrite up to 80% of existing bullets.

   INSERT NEW BULLETS (action: insert_after):
   - Add 1-3 new bullets per job when a key JD responsibility is ENTIRELY absent.
   - Examples of when to insert:
       * JD requires RAG / LangChain but no RAG bullet exists → insert one.
       * JD requires system design / architecture but no such bullet → insert one.
       * JD requires mentoring/leadership but no leadership bullet → insert one.
       * JD requires a specific tool (Kafka, Spark, etc.) that's in skills but
         not demonstrated in experience → insert a bullet showing real usage.
   - Always insert AFTER the last bullet of the relevant job section.
   - New bullets must be indistinguishable from existing ones in tone, tense, length.
   - Do NOT invent specific metrics unless surrounding bullets already use them.
   - Use the SAME style name as the surrounding bullets (copy from nearby block's style).

2. PROJECTS — Enhance and expand:
   - Rewrite descriptions using role_responsibilities language from the JD.
   - Insert a new bullet for each major missing technology that fits the project domain.
   - Strengthen verb choices with JD action_verbs.
   - Add context about impact, scale, or outcomes when reasonable.

3. SUMMARY / OBJECTIVE (if present):
   - REPLACE it entirely: mirror the job title, key responsibilities, and top 4-5 keywords.
   - Must read like this candidate was purpose-built for this exact role.
   - Write 3-4 confident, specific sentences.

4. SKILLS SECTION:
   - REPLACE each skill-line that is missing JD keywords to append the missing ones.
   - Maintain existing separator style exactly (commas, pipes, bullets — match perfectly).
   - Group new skills logically with existing ones.

5. KEYWORDS — Natural injection everywhere:
   - Weave domain_keywords and industry_terms throughout bullets, summary, and projects.
   - Do NOT create a standalone "Keywords" section.

════════════════════════════════════════════════════════
STRICT RULES — NEVER VIOLATE
════════════════════════════════════════════════════════
- NEVER change styles, fonts, or formatting.
- NEVER fabricate employers, education, certifications, or dates.
- NEVER add backend tech to frontend projects or vice versa.
- NEVER change section headers (Experience, Projects, Education, Skills, etc.).
- NEVER insert bullets outside the relevant job/project section.
- NEVER delete real experience — only replace or expand it.
- ALWAYS match the grammatical tense of surrounding bullets.
- ALWAYS preserve proper nouns exactly (company names, product names, tools).
- ALWAYS set style in insert patches to exactly match a nearby bullet's style value.

════════════════════════════════════════════════════════
OUTPUT FORMAT — CRITICAL
════════════════════════════════════════════════════════
Return ONLY a valid JSON array. No prose. No markdown fences.

[
  {
    "action": "replace",
    "index": 5,
    "new_text": "<full replacement text>",
    "reason": "<one sentence>"
  },
  {
    "action": "insert_after",
    "index": 12,
    "new_text": "<complete new bullet point text>",
    "style": "List Paragraph",
    "reason": "<one sentence: why this bullet is being added>"
  },
  {
    "action": "insert_before",
    "index": 20,
    "new_text": "<complete new bullet point text>",
    "style": "List Paragraph",
    "reason": "<one sentence>"
  },
  {
    "action": "delete",
    "index": 33,
    "reason": "<one sentence: why removed>"
  }
]

Return [] ONLY if absolutely nothing needs to change (extremely rare).
Target: 40% ATS match → 80%+. Be aggressive."""


def tailor_with_gemini(resume_json: str, job_description: str, jd_keywords: dict) -> list[dict]:
    """Call Gemini to get a patch list (replace / insert_after / insert_before / delete)."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")

    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version="v1beta"),
    )

    user_msg = (
        f"<resume_sections>\n{resume_json}\n</resume_sections>\n\n"
        f"<job_description>\n{job_description}\n</job_description>\n\n"
        f"<jd_keywords>\n{json.dumps(jd_keywords, indent=2)}\n</jd_keywords>"
    )

    print(f"🤖 [GEMINI] Calling {GEMINI_MODEL} (replace + insert + delete mode)...")

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_msg,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.3,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    print(f"✅ [GEMINI] Received {len(raw)} chars")

    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

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
        print(f"❌ [GEMINI] JSON parse failed: {e}")
        print(f"Raw (first 500 chars):\n{raw[:500]}")
        return []


# ──────────────────────────────────────────────────────────────────────────────
# 4. XML HELPERS
# ──────────────────────────────────────────────────────────────────────────────

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def _get_template_rpr(ref_el):
    """Extract the run-properties element from the first run of ref_el, or None."""
    runs = ref_el.findall(f"{{{W}}}r")
    if runs:
        rpr = runs[0].find(f"{{{W}}}rPr")
        if rpr is not None:
            return copy.deepcopy(rpr)
    return None


def _make_run(text: str, template_rpr, highlighted: bool = False) -> etree._Element:
    """Build a single <w:r> element with optional yellow highlight."""
    new_r = OxmlElement("w:r")

    if highlighted:
        rpr = copy.deepcopy(template_rpr) if template_rpr is not None else OxmlElement("w:rPr")
        hl = OxmlElement("w:highlight")
        hl.set(f"{{{W}}}val", "yellow")
        rpr.append(hl)
        new_r.append(rpr)
    elif template_rpr is not None:
        new_r.append(copy.deepcopy(template_rpr))

    t_el = OxmlElement("w:t")
    t_el.text = text
    if text and (text[0] == " " or text[-1] == " "):
        t_el.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    new_r.append(t_el)
    return new_r


def _build_runs(para_el, full_text: str, highlight_words: list[str], template_rpr):
    """Append word-level runs to para_el, highlighting words that match highlight_words."""
    if not highlight_words:
        para_el.append(_make_run(full_text, template_rpr, highlighted=False))
        return

    words = full_text.split()
    for i, word in enumerate(words):
        clean = re.sub(r'[^\w]', '', word).lower()
        should_hl = any(
            re.sub(r'[^\w]', '', hw).lower() in clean
            or clean in re.sub(r'[^\w]', '', hw).lower()
            for hw in highlight_words
            if len(re.sub(r'[^\w]', '', hw)) > 2
        )
        token = word + (" " if i < len(words) - 1 else "")
        run = _make_run(token, template_rpr, highlighted=should_hl)
        # preserve space attribute on multi-token runs
        t = run.find(f"{{{W}}}t")
        if t is not None and (token.startswith(" ") or token.endswith(" ")):
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        para_el.append(run)


def _replace_para_text(para_el, new_text: str, highlight_words: list[str] | None = None):
    """Rewrite all runs in para_el with new_text, optionally highlighting words."""
    for r in para_el.findall(f"{{{W}}}r"):
        para_el.remove(r)
    template_rpr = _get_template_rpr(para_el)
    _build_runs(para_el, new_text, highlight_words or [], template_rpr)


def _build_new_paragraph(ref_section: dict, new_text: str,
                          style_name: str | None,
                          highlight_words: list[str] | None = None):
    """
    Create a new <w:p> element by deep-copying the reference paragraph's
    structure (paragraph properties: indentation, bullet numbering, spacing),
    then writing new_text into it as runs.

    style_name overrides the pStyle if provided.
    """
    ref_el = ref_section["_xml_ref"]

    # Deep-copy preserves pPr (bullet/numbering/indentation)
    new_para_el = copy.deepcopy(ref_el)

    # Clear existing runs and stray elements (bookmarks, hyperlinks, etc.)
    for r in new_para_el.findall(f"{{{W}}}r"):
        new_para_el.remove(r)
    for child in list(new_para_el):
        local = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if local not in ("pPr", "r"):
            new_para_el.remove(child)

    # Override style if requested
    if style_name:
        pPr = new_para_el.find(f"{{{W}}}pPr")
        if pPr is None:
            pPr = OxmlElement("w:pPr")
            new_para_el.insert(0, pPr)
        pStyle = pPr.find(f"{{{W}}}pStyle")
        if pStyle is None:
            pStyle = OxmlElement("w:pStyle")
            pPr.insert(0, pStyle)
        pStyle.set(f"{{{W}}}val", style_name.replace(" ", ""))

    # Build runs using the ref element's run formatting as template
    template_rpr = _get_template_rpr(ref_el)
    _build_runs(new_para_el, new_text, highlight_words or [], template_rpr)

    return new_para_el


# ──────────────────────────────────────────────────────────────────────────────
# 5. KEYWORD HIGHLIGHT HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _flatten_jd_words(jd_keywords: dict) -> set[str]:
    """Flatten all JD keyword lists into a set of cleaned lowercase words."""
    words = set()
    for kw_list in jd_keywords.values():
        if isinstance(kw_list, list):
            for kw in kw_list:
                for w in kw.lower().split():
                    clean = re.sub(r'[^\w]', '', w)
                    if len(clean) > 2:
                        words.add(clean)
    return words


def _compute_added_words(old_text: str, new_text: str, jd_words: set[str]) -> list[str]:
    """Words that are new (not in old_text) AND present in JD keywords."""
    old_clean = set(re.sub(r'[^\w\s]', '', old_text.lower()).split())
    result = []
    for w in new_text.split():
        c = re.sub(r'[^\w]', '', w).lower()
        if c not in old_clean and c in jd_words and len(c) > 2:
            result.append(w)
    return result


def _all_jd_words_in_text(new_text: str, jd_words: set[str]) -> list[str]:
    """All words in new_text that match any JD keyword (for inserted paragraphs)."""
    result = []
    for w in new_text.split():
        c = re.sub(r'[^\w]', '', w).lower()
        if c in jd_words and len(c) > 2:
            result.append(w)
    return result


# ──────────────────────────────────────────────────────────────────────────────
# 6. PATCH APPLICATION
# ──────────────────────────────────────────────────────────────────────────────

def apply_patches(parsed: dict, patches: list[dict], jd_keywords: dict) -> dict:
    """
    Apply all Gemini patches in a single, order-safe pass.

    Processing order per anchor index:
      replace → insert_before → insert_after → delete

    Multiple insert_after patches on the same anchor are appended
    in order so they don't clobber each other.
    """
    index_map = {s["index"]: s for s in parsed["sections"]}
    jd_words  = _flatten_jd_words(jd_keywords)
    counts    = {"replace": 0, "insert_after": 0, "insert_before": 0,
                 "delete": 0, "skipped": 0}

    # Sort: process replace first, then inserts, then deletes
    action_order = {"replace": 0, "insert_before": 1, "insert_after": 2, "delete": 3}

    def sort_key(p):
        return (p.get("index", 0), action_order.get(p.get("action", "replace"), 0))

    patches_sorted = sorted(patches, key=sort_key)

    # Track the last inserted element per anchor so sequential
    # insert_after calls stack correctly (each inserts after the previous)
    last_inserted_after: dict[int, object] = {}

    for patch in patches_sorted:
        action   = patch.get("action", "replace")
        idx      = patch.get("index")
        new_text = patch.get("new_text", "").strip()
        style    = patch.get("style")
        reason   = patch.get("reason", "")

        section = index_map.get(idx)
        if section is None:
            print(f"  ⚠️  [SKIP] index {idx} not found")
            counts["skipped"] += 1
            continue

        # ── REPLACE ──────────────────────────────────────────────────────────
        if action == "replace":
            old_text = section["text"]
            if old_text.strip() == new_text:
                counts["skipped"] += 1
                continue

            added_kw = _compute_added_words(old_text, new_text, jd_words)
            _replace_para_text(section["_xml_ref"], new_text, added_kw or None)

            print(f"\n  ✏️  [REPLACE] #{idx}  {reason}")
            print(f"     OLD: {old_text[:80]}")
            print(f"     NEW: {new_text[:80]}")
            if added_kw:
                print(f"     💛 {', '.join(added_kw[:8])}")
            counts["replace"] += 1

        # ── INSERT AFTER ─────────────────────────────────────────────────────
        elif action == "insert_after":
            if not new_text:
                counts["skipped"] += 1
                continue

            parent_el = section["_parent_ref"]

            # Determine the current anchor: original paragraph, or last inserted
            anchor_el = last_inserted_after.get(idx, section["_xml_ref"])

            highlight_words = _all_jd_words_in_text(new_text, jd_words)
            new_para_el = _build_new_paragraph(section, new_text, style, highlight_words or None)

            try:
                pos = list(parent_el).index(anchor_el)
                parent_el.insert(pos + 1, new_para_el)
                last_inserted_after[idx] = new_para_el  # next insert stacks after this one

                print(f"\n  ➕ [INSERT_AFTER] after #{idx}  {reason}")
                print(f"     NEW: {new_text[:80]}")
                if highlight_words:
                    print(f"     💛 {', '.join(highlight_words[:8])}")
                counts["insert_after"] += 1
            except ValueError:
                print(f"  ⚠️  [INSERT_AFTER FAILED] anchor for #{idx} not found in parent")
                counts["skipped"] += 1

        # ── INSERT BEFORE ────────────────────────────────────────────────────
        elif action == "insert_before":
            if not new_text:
                counts["skipped"] += 1
                continue

            parent_el = section["_parent_ref"]
            anchor_el = section["_xml_ref"]

            highlight_words = _all_jd_words_in_text(new_text, jd_words)
            new_para_el = _build_new_paragraph(section, new_text, style, highlight_words or None)

            try:
                pos = list(parent_el).index(anchor_el)
                parent_el.insert(pos, new_para_el)

                print(f"\n  ➕ [INSERT_BEFORE] before #{idx}  {reason}")
                print(f"     NEW: {new_text[:80]}")
                if highlight_words:
                    print(f"     💛 {', '.join(highlight_words[:8])}")
                counts["insert_before"] += 1
            except ValueError:
                print(f"  ⚠️  [INSERT_BEFORE FAILED] anchor for #{idx} not found in parent")
                counts["skipped"] += 1

        # ── DELETE ───────────────────────────────────────────────────────────
        elif action == "delete":
            parent_el = section["_parent_ref"]
            target_el = section["_xml_ref"]
            try:
                parent_el.remove(target_el)
                print(f"\n  🗑️  [DELETE] #{idx}  {reason}")
                counts["delete"] += 1
            except ValueError:
                print(f"  ⚠️  [DELETE FAILED] #{idx} already removed or not in parent")
                counts["skipped"] += 1

        else:
            print(f"  ⚠️  [UNKNOWN ACTION] '{action}' on #{idx} — skipping")
            counts["skipped"] += 1

    return counts


# ──────────────────────────────────────────────────────────────────────────────
# 7. FLASK API
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":        "ok",
        "service":       "resume-tailor-gemini",
        "model":         GEMINI_MODEL,
        "patch_actions": ["replace", "insert_after", "insert_before", "delete"],
    })


@app.route("/tailor", methods=["POST"])
def tailor():
    print("\n" + "=" * 80)
    print("🎯 [TAILOR] New request received")
    print("=" * 80)

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".docx"):
        return jsonify({"error": "Only DOCX files are supported"}), 400

    job_description = request.form.get("jobDescription", "")
    job_title       = request.form.get("jobTitle", "")
    company         = request.form.get("company", "")
    jd_text         = f"Job Title: {job_title}\nCompany: {company}\n\n{job_description}"

    print(f"📄 File   : {file.filename}")
    print(f"💼 Role   : {job_title} at {company}")
    print(f"📝 JD len : {len(job_description)} chars")

    try:
        doc = Document(file)
        print(f"📦 DOCX   : {len(doc.paragraphs)} body paragraphs")

        # ── Step 1: Parse ────────────────────────────────────────────────────
        print("\n[1/4] Parsing resume...")
        parsed = parse_resume(doc)

        # ── Step 2: Extract JD keywords ─────────────────────────────────────
        print("\n[2/4] Extracting JD keywords (pre-pass)...")
        jd_keywords = extract_jd_keywords(jd_text)

        # ── Step 3: Gemini tailoring ─────────────────────────────────────────
        print("\n[3/4] Tailoring with Gemini...")
        resume_json = build_llm_payload(parsed)
        patches     = tailor_with_gemini(resume_json, jd_text, jd_keywords)

        # Count by action type for logging
        action_summary: dict[str, int] = {}
        for p in patches:
            a = p.get("action", "replace")
            action_summary[a] = action_summary.get(a, 0) + 1
        print(f"  📊 {len(patches)} patches: {action_summary}")

        # ── Step 4: Apply patches ────────────────────────────────────────────
        print("\n[4/4] Applying patches...")
        counts = apply_patches(parsed, patches, jd_keywords)
        print(f"\n  ✅ Applied: {counts}")

        # ── Save & return ────────────────────────────────────────────────────
        output = BytesIO()
        parsed["doc"].save(output)
        output.seek(0)

        safe_name = (
            f"{company}_{job_title}_Resume.docx"
            .replace(" ", "_")
            .replace("/", "_")
        )
        print(f"✅ Returning {len(output.getvalue())} bytes as '{safe_name}'")
        print("=" * 80 + "\n")

        return send_file(
            output,
            as_attachment=True,
            download_name=safe_name,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception:
        import traceback
        tb = traceback.format_exc()
        print("❌ FATAL ERROR:\n" + tb)
        print("=" * 80 + "\n")
        return jsonify({"error": tb}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5004))
    print("=" * 80)
    print(f"🚀 Resume Tailor  |  model: {GEMINI_MODEL}  |  port: {port}")
    print(f"   Actions: replace / insert_after / insert_before / delete")
    print("=" * 80)
    app.run(host="0.0.0.0", port=port, debug=True)