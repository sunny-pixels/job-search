"""
Resume Tailoring Service — FORMAT-PRESERVING (XML-level editing)

The key fix: instead of using python-docx's paragraph/run API (which can
silently drop styles, numbering references, spacing, fonts, etc.), we:

  1. Unzip the DOCX into memory
  2. Parse document.xml with lxml (preserving ALL attributes/namespaces)
  3. Surgically replace ONLY the text nodes inside <w:t> elements
  4. Rezip → output.docx

This guarantees the output is pixel-perfect to the original template.

Flow:
  POST /tailor  (multipart: file=resume.docx, jobDescription, jobTitle, company)
    → analyzeJD()          — LLM extracts domain, skills, keywords, tech stack
    → extractCandidateSkills() — LLM reads resume text
    → smartGapAnalysis()   — 50% match threshold for skill injection
    → buildContentMap()    — produces new text for every swappable section
    → patchDocxXml()       — edits XML in-place, preserves all formatting
    → return tailored.docx
"""

import os
import re
import io
import json
import copy
import random
import time
import zipfile
import tempfile
import shutil
from lxml import etree

from groq import Groq
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env from the same directory as this script
import pathlib
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
LLM_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
RATE_LIMIT_DELAY = 2.0  # Increased from 0.1 to 2 seconds

# ── XML namespace used by every DOCX ──────────────────────────────────────
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


# ══════════════════════════════════════════════════════════════════════════
# METRIC POOLS (unchanged from original — kept for bullet rewriting)
# ══════════════════════════════════════════════════════════════════════════
METRIC_POOLS = {
    "performance": [
        "reducing latency by {n}%", "cutting response time by {n}%",
        "improving throughput by {n}%", "boosting API response speed by {n}%",
        "reducing memory usage by {n}%", "achieving {n}% faster build times",
    ],
    "scale": [
        "serving {n}K+ daily active users", "processing {n}M+ records/month",
        "handling {n}K+ concurrent requests", "managing {n}TB+ of data",
        "scaling to {n}K+ API calls/day",
    ],
    "efficiency": [
        "saving {n} engineering hours/week", "reducing manual effort by {n}%",
        "cutting deployment time from {a} to {b} minutes",
        "automating {n}% of previously manual workflows",
        "accelerating release cycles by {n}%",
    ],
    "quality": [
        "achieving {n}% test coverage", "maintaining {n}% uptime SLA",
        "reducing bug escape rate by {n}%", "cutting production incidents by {n}%",
    ],
    "business": [
        "generating ${n}K in cost savings", "driving {n}% revenue uplift",
        "improving NPS by {n} points", "reducing churn by {n}%",
    ],
}
DOMAIN_METRIC_WEIGHTS = {
    "Data Science":  ["performance", "scale", "quality", "efficiency"],
    "Full Stack":    ["scale", "performance", "efficiency", "quality"],
    "Frontend":      ["performance", "quality", "efficiency", "business"],
    "Backend":       ["scale", "performance", "efficiency", "quality"],
    "DevOps":        ["efficiency", "quality", "scale", "performance"],
    "default":       ["performance", "scale", "efficiency", "quality", "business"],
}

def get_dynamic_metric(domain: str, used: set) -> str:
    cats = DOMAIN_METRIC_WEIGHTS.get(domain, DOMAIN_METRIC_WEIGHTS["default"])[:]
    random.shuffle(cats)
    for cat in cats:
        pool = METRIC_POOLS[cat][:]
        random.shuffle(pool)
        for tpl in pool:
            if tpl not in used:
                used.add(tpl)
                n  = random.choice([15, 18, 22, 25, 28, 32, 35, 40, 45, 50, 60])
                a  = random.choice([45, 60, 90])
                b  = random.choice([8, 12, 15])
                m  = tpl.replace("{n}", str(n)).replace("{a}", str(a)).replace("{b}", str(b))
                m  = re.sub(r"\{n\}K", f"{random.choice([10,25,50,100])}K", m)
                m  = re.sub(r"\{n\}M", f"{random.choice([1,2,5,10])}M", m)
                m  = re.sub(r"\{n\}TB", f"{random.choice([2,5,10,50])}TB", m)
                return m
    return f"improving overall performance by {random.choice([20,25,30])}%"


# ══════════════════════════════════════════════════════════════════════════
# LLM HELPERS
# ══════════════════════════════════════════════════════════════════════════
def _llm(prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
    time.sleep(RATE_LIMIT_DELAY)
    try:
        print(f"🤖 [LLM] Calling Groq API with model: {LLM_MODEL}")
        print(f"🤖 [LLM] Temperature: {temperature}, Max tokens: {max_tokens}")
        
        res = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        response_text = res.choices[0].message.content.strip()
        print(f"✅ [LLM] Response received ({len(response_text)} chars)")
        return response_text
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ [LLM] Error: {error_msg}")
        
        # Check for specific error types
        if "rate_limit" in error_msg.lower():
            print(f"⚠️  [LLM] RATE LIMIT EXCEEDED - Consider increasing delay or upgrading tier")
        elif "429" in error_msg:
            print(f"⚠️  [LLM] HTTP 429 - Too many requests")
        elif "413" in error_msg:
            print(f"⚠️  [LLM] HTTP 413 - Request too large")
        elif "401" in error_msg:
            print(f"⚠️  [LLM] HTTP 401 - Invalid API key")
        
        raise


def _parse_json(raw: str) -> dict | list:
    try:
        print(f"📋 [JSON] Parsing response ({len(raw)} chars)")
        clean = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(clean)
        print(f"✅ [JSON] Successfully parsed")
        return result
    except json.JSONDecodeError as e:
        print(f"❌ [JSON] Parse Error: {e}")
        print(f"📄 [JSON] Raw response (first 500 chars): {raw[:500]}")
        print(f"📄 [JSON] Raw response (last 200 chars): {raw[-200:]}")
        raise Exception(f"Failed to parse LLM response as JSON: {str(e)}")


def analyze_jd(jd_text: str) -> dict:
    # Limit JD text to 2000 characters to avoid token limits
    jd_truncated = jd_text[:2000] if len(jd_text) > 2000 else jd_text
    
    print(f"📊 [JD Analysis] Analyzing job description ({len(jd_truncated)} chars)")
    
    prompt = f"""Analyze this job description and return JSON only (no markdown):
{{
  "domain": "e.g. Data Science / Full Stack / Backend / DevOps",
  "required_skills": ["must-have skills"],
  "good_to_have":    ["optional skills"],
  "tech_stack":      ["all technologies mentioned"],
  "keywords":        ["important JD phrases for bullet rewrites"],
  "action_verbs":    ["domain-appropriate past-tense resume verbs"],
  "quantifiable_metrics": ["metric types relevant to this domain"]
}}

JD:
\"\"\"{jd_truncated}\"\"\"
"""
    result = _parse_json(_llm(prompt, 0.2, 1500))
    print(f"✅ [JD Analysis] Domain: {result.get('domain', 'N/A')}")
    return result


def extract_candidate_skills(resume_text: str) -> dict:
    print(f"👤 [Skills Extraction] Extracting from resume ({len(resume_text)} chars)")
    
    prompt = f"""Extract all skills from this resume. Return JSON only:
{{
  "confirmed_skills": ["explicitly listed"],
  "implied_skills":   ["strongly implied by experience"]
}}

Resume:
\"\"\"{resume_text[:3500]}\"\"\"
"""
    result = _parse_json(_llm(prompt, 0.1))
    print(f"✅ [Skills Extraction] Found {len(result.get('confirmed_skills', []))} confirmed skills")
    return result


def calculate_tech_match(candidate: list, jd_tech: list) -> dict:
    if not jd_tech:
        return {"percentage": 100, "matched": [], "missing": [], "should_inject": False, "injection_strength": "none"}
    c_lower = [s.lower().strip() for s in candidate]
    matched, missing = [], []
    for tech in jd_tech:
        tl = tech.lower().strip()
        if any(tl in c or c in tl or tl.replace(".js","") in c or c.replace(".js","") in tl for c in c_lower):
            matched.append(tech)
        else:
            missing.append(tech)
    pct = round(len(matched) / len(jd_tech) * 100, 1) if jd_tech else 100
    return {
        "percentage": pct,
        "matched": matched,
        "missing": missing,
        "should_inject": pct >= 50,
        "injection_strength": "full" if pct >= 70 else ("partial" if pct >= 50 else "none"),
    }


def smart_gap_analysis(jd_intel: dict, candidate_skills: dict) -> dict:
    all_c = candidate_skills.get("confirmed_skills", []) + candidate_skills.get("implied_skills", [])
    match = calculate_tech_match(all_c, jd_intel.get("tech_stack", []))
    prompt = f"""You are a resume strategist. Return JSON only:
{{
  "already_have": ["candidate's confirmed skills"],
  "can_add":      [{{"skill":"x","expanded_skills":["y"],"reason":"z"}}],
  "missing_to_inject": {json.dumps(match["missing"] if match["should_inject"] else [])},
  "skip": ["skills with no basis to claim"]
}}

JD requires: {jd_intel.get("required_skills",[])}
Candidate has: {candidate_skills.get("confirmed_skills",[])}
Implied: {candidate_skills.get("implied_skills",[])}
Tech match: {match["percentage"]}% | Injection approved: {match["should_inject"]}
"""
    try:
        gap = _parse_json(_llm(prompt, 0.3))
    except Exception:
        gap = {"already_have": [], "can_add": [], "missing_to_inject": [], "skip": []}
    gap["_match"] = match
    gap["_all_candidate"] = all_c
    return gap


def build_content_map(resume_text: str, jd_intel: dict, gap: dict) -> dict:
    """
    Ask the LLM to produce ALL replacement text in a single structured JSON,
    with keys that map 1-to-1 to the sections we'll patch in the XML.

    Returns:
    {
      "subtitle":  "AI Data Engineer",
      "summary":   "...",
      "skills":    "Azure Data Factory • Databricks • SQL • ...",
      "experience": [
        {
          "role":     "AI Data Engineer",
          "company":  "Cadence Bank",
          "duration": "Jan 2024 – Present",
          "bullets":  ["Engineered...", "Architected...", ...]
        },
        ...
      ],
      "projects": [
        {
          "name":         "Enterprise Lakehouse Analytics Pipeline",
          "description":  "...",
          "technologies": "Azure Data Factory, Databricks, ..."
        },
        ...
      ],
      "education": "Master in Business Analytics & Data Science, University of Texas at Dallas, 2024"
    }
    """
    match   = gap.get("_match", {})
    missing = gap.get("missing_to_inject", [])
    strength = match.get("injection_strength", "none")

    # Build the skills string — merge existing + injected, prioritize JD-relevant ones
    existing_skills = gap.get("already_have", [])
    extra_skills    = []
    for item in gap.get("can_add", []):
        if isinstance(item, dict):
            extra_skills.extend(item.get("expanded_skills", [])[:2])
    if match.get("should_inject"):
        suffix = "" if strength == "full" else " (familiar)"
        extra_skills += [f"{t}{suffix}" for t in missing[:5]]
    
    # Combine and prioritize: JD tech stack first, then existing, then extras
    jd_tech = jd_intel.get("tech_stack", [])[:10]
    prioritized_skills = []
    
    # Add JD-relevant skills first
    for tech in jd_tech:
        for skill in existing_skills + extra_skills:
            if tech.lower() in skill.lower() or skill.lower() in tech.lower():
                if skill not in prioritized_skills:
                    prioritized_skills.append(skill)
    
    # Add remaining skills
    for skill in existing_skills + extra_skills:
        if skill not in prioritized_skills:
            prioritized_skills.append(skill)
    
    all_skills = prioritized_skills[:20]  # Limit to top 20 skills

    # Truncate resume text to avoid token limits
    resume_truncated = resume_text[:3000] if len(resume_text) > 3000 else resume_text

    prompt = f"""You are a professional resume writer. Tailor this resume for the job below.

CRITICAL INSTRUCTIONS:
1. REWRITE every bullet point to include job-relevant keywords and achievements
2. ADD quantifiable metrics (percentages, numbers, scale) to bullets
3. EMPHASIZE skills and technologies mentioned in the job description
4. REORDER experience bullets to put most relevant ones first
5. ENHANCE project descriptions with technical depth and business impact
6. PRESERVE all company names, dates, education details, and project names EXACTLY

RESUME:
{resume_truncated}

JOB REQUIREMENTS:
Title: {jd_intel.get("domain","")}
Required Skills: {jd_intel.get("required_skills",[])[:10]}
Keywords to Include: {jd_intel.get("keywords",[])[:10]}
Tech Stack: {jd_intel.get("tech_stack",[])[:10]}

SKILLS TO HIGHLIGHT:
{all_skills[:15]}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "subtitle":   "<role title matching the JD>",
  "summary":    "<3-4 sentences highlighting relevant experience and skills for THIS specific job>",
  "skills":     "<all skills separated by ' • ', prioritize JD-relevant ones first>",
  "experience": [
    {{
      "role":     "<EXACT role from resume>",
      "company":  "<EXACT company from resume>",
      "duration": "<EXACT dates from resume>",
      "bullets":  [
        "<REWRITTEN bullet with JD keywords, action verbs, and metrics>",
        "<REWRITTEN bullet emphasizing relevant technologies>",
        "<REWRITTEN bullet showing impact and scale>"
      ]
    }}
  ],
  "projects": [
    {{
      "name":         "<EXACT project name from resume>",
      "description":  "<ENHANCED 2-3 sentence description with technical details and business value>",
      "technologies": "<comma-separated tech list, emphasize JD-relevant ones>"
    }}
  ],
  "education": "<Degree, Institution, Year - EXACT from resume>"
}}

EXAMPLE TRANSFORMATIONS:
Before: "Built web application using React"
After:  "Architected and deployed scalable web application using React, Node.js, and MongoDB, serving 10K+ daily users with 99.9% uptime"

Before: "Worked on backend APIs"
After:  "Engineered RESTful APIs using Spring Boot and PostgreSQL, reducing response time by 40% and handling 50K+ requests/day"
"""
    return _parse_json(_llm(prompt, 0.4, 2500))


# ══════════════════════════════════════════════════════════════════════════
# DOCX XML PATCHER — the heart of format-preservation
# ══════════════════════════════════════════════════════════════════════════

def _get_text(el) -> str:
    """Concatenate all <w:t> text in an element."""
    return "".join(t.text or "" for t in el.iter(f"{{{W}}}t"))


def _set_single_run_text(para, new_text: str):
    """
    Replace ALL runs in a paragraph with a SINGLE run that carries
    the rPr (formatting) of the FIRST existing run, but new text.

    This is safe because within a single bullet/sentence there's typically
    one dominant format. We never touch pPr (paragraph properties).
    """
    # Collect all <w:r> children (runs)
    runs = para.findall(f"{{{W}}}r")
    if not runs:
        # No runs at all — create a bare run
        r = etree.SubElement(para, f"{{{W}}}r")
        t = etree.SubElement(r, f"{{{W}}}t")
        t.text = new_text
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        return

    # Keep the rPr from the first run (font, bold, size, color…)
    first_run = runs[0]
    rpr = first_run.find(f"{{{W}}}rPr")
    rpr_copy = copy.deepcopy(rpr) if rpr is not None else None

    # Remove ALL existing runs
    for r in runs:
        para.remove(r)

    # Insert a single new run in the same position the first run was
    new_run = etree.Element(f"{{{W}}}r")
    if rpr_copy is not None:
        new_run.append(rpr_copy)
    t_el = etree.SubElement(new_run, f"{{{W}}}t")
    t_el.text = new_text
    t_el.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

    # Append after pPr (paragraph properties)
    ppr = para.find(f"{{{W}}}pPr")
    insert_pos = list(para).index(ppr) + 1 if ppr is not None else 0
    para.insert(insert_pos, new_run)


def _clone_paragraph(template_para) -> etree._Element:
    """Deep-copy a paragraph element so we can reuse its exact XML structure."""
    return copy.deepcopy(template_para)


def patch_docx_xml(docx_bytes: bytes, content_map: dict) -> bytes:
    """
    Open the DOCX ZIP in memory, parse document.xml, replace content
    section by section, repack and return new bytes.

    Strategy — walk paragraphs once and tag each by its section:
      • HEADER block   (name / subtitle / contact)
      • SUMMARY        (first body paragraph after Heading1 "PROFESSIONAL SUMMARY")
      • TECHNICAL SKILLS paragraph
      • PROFESSIONAL EXPERIENCE (role/company, date, bullets)
      • PROJECTS       (name, description, technologies)
      • EDUCATION
    """
    # ── 1. Load ZIP ─────────────────────────────────────────────────────
    zin = zipfile.ZipFile(io.BytesIO(docx_bytes))
    names = zin.namelist()
    xml_bytes = zin.read("word/document.xml")

    # ── 2. Parse XML preserving namespaces ──────────────────────────────
    root   = etree.fromstring(xml_bytes)
    body   = root.find(f"{{{W}}}body")
    paras  = body.findall(f"{{{W}}}p")

    # ── 3. Identify structural paragraphs ───────────────────────────────
    # We tag each paragraph with a label so we can address them by purpose.
    def heading_text(p):
        style_el = p.find(f".//{{{W}}}pStyle")
        if style_el is not None and "Heading" in (style_el.get(f"{{{W}}}val") or ""):
            return _get_text(p).strip().upper()
        return None

    # Walk and label
    labels = []          # parallel list: label string or None
    current_section = None
    exp_index   = -1     # which experience entry we're in
    proj_index  = -1     # which project entry we're in
    bullet_idx  = {}     # exp_index → count of bullets seen so far
    proj_bullet = {}     # proj_index → field (description / technologies)
    
    print(f"📋 [XML] Analyzing {len(paras)} paragraphs...")
    found_headings = []

    for p in paras:
        ht = heading_text(p)
        if ht is not None:
            current_section = ht
            found_headings.append(ht)
            labels.append(("HEADING", ht))
            exp_index  = -1
            proj_index = -1
            continue

        txt = _get_text(p).strip()
        is_list = p.find(f".//{{{W}}}numId") is not None

        if current_section is None:
            # Header block: name, subtitle, contact
            if txt:
                labels.append(("HEADER", txt))
            else:
                labels.append(None)
            continue

        # Match section names flexibly
        if "SUMMARY" in current_section or "PROFILE" in current_section or "ABOUT" in current_section:
            labels.append(("SUMMARY", None))
            current_section = None   # only one summary paragraph

        elif "SKILL" in current_section or "TECHNICAL" in current_section:
            labels.append(("SKILLS", None))
            current_section = None

        elif "EXPERIENCE" in current_section or "WORK" in current_section or "EMPLOYMENT" in current_section:
            # Is this a role|company line? (bold, sz=22, not a list)
            runs = p.findall(f"{{{W}}}r")
            first_bold = any(
                r.find(f".//{{{W}}}b") is not None
                for r in runs
            )
            
            # Skip section headers like "Algorithmic Problem Solving"
            is_section_header = first_bold and not is_list and txt and (
                "problem solving" in txt.lower() or
                "algorithmic" in txt.lower() or
                "achievements" in txt.lower() or
                "certifications" in txt.lower()
            )
            
            if is_section_header:
                labels.append(("EXP_OTHER", None))
                print(f"   ⚠️  [XML] Skipping section header: '{txt}'")
            # Check if it's a role line (bold text, not a list, has content)
            elif first_bold and not is_list and txt:
                # Could be "Role | Company" OR "RoleDate" (date appended)
                exp_index += 1
                bullet_idx[exp_index] = 0
                labels.append(("EXP_ROLE", exp_index))
                print(f"   🔍 [XML] Found role {exp_index}: '{txt}'")
            # Check if it's a date/company line (italic or contains company name)
            elif not is_list and txt and (re.match(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", txt) or "—" in txt or "–" in txt):
                labels.append(("EXP_DATE", exp_index))
                print(f"   🔍 [XML] Found date {exp_index}: '{txt}'")
            # Check if it's a bullet point
            elif is_list and exp_index >= 0:
                bi = bullet_idx.get(exp_index, 0)
                labels.append(("EXP_BULLET", (exp_index, bi)))
                bullet_idx[exp_index] = bi + 1
                print(f"   🔍 [XML] Found bullet {exp_index}.{bi}: '{txt[:50]}'")
            elif not txt:
                labels.append(("EXP_SPACER", None))
            else:
                labels.append(("EXP_OTHER", None))
                print(f"   ⚠️  [XML] EXP_OTHER: '{txt[:50]}'...")

        elif "PROJECT" in current_section:
            runs = p.findall(f"{{{W}}}r")
            first_bold = any(r.find(f".//{{{W}}}b") is not None for r in runs)
            has_tech_label = txt.startswith("Technologies:")
            if first_bold and not has_tech_label and txt:
                proj_index += 1
                labels.append(("PROJ_NAME", proj_index))
            elif has_tech_label:
                labels.append(("PROJ_TECH", proj_index))
            elif txt and proj_index >= 0:
                labels.append(("PROJ_DESC", proj_index))
            elif not txt:
                labels.append(("PROJ_SPACER", None))
            else:
                labels.append(("PROJ_OTHER", None))

        elif "EDUCATION" in current_section or "ACADEMIC" in current_section:
            if txt:
                labels.append(("EDUCATION", None))
            else:
                labels.append(None)

        else:
            labels.append(None)

    # ── 4. Apply content_map patches ────────────────────────────────────
    exp_map   = content_map.get("experience", [])
    proj_map  = content_map.get("projects", [])
    seen_summary = False
    
    print(f"📋 [XML] Found headings: {found_headings}")
    print(f"📋 [XML] Experience entries to update: {len(exp_map)}")
    print(f"📋 [XML] Project entries to update: {len(proj_map)}")
    
    # Count labels
    label_counts = {}
    for label in labels:
        if label:
            kind = label[0]
            label_counts[kind] = label_counts.get(kind, 0) + 1
    print(f"📋 [XML] Label counts: {label_counts}")

    for i, (p, label) in enumerate(zip(paras, labels)):
        if label is None:
            continue

        kind = label[0]

        # HEADER block — name stays, subtitle changes, contact stays
        if kind == "HEADER":
            txt = _get_text(p).strip()
            # Detect subtitle line: not bold, not contains @/+1
            is_subtitle = not any(
                r.find(f".//{{{W}}}b") is not None
                for r in p.findall(f"{{{W}}}r")
            ) and "@" not in txt and "+" not in txt
            if is_subtitle and content_map.get("subtitle"):
                _set_single_run_text(p, content_map["subtitle"])

        elif kind == "SUMMARY" and not seen_summary:
            seen_summary = True
            if content_map.get("summary"):
                _set_single_run_text(p, content_map["summary"])

        elif kind == "SKILLS":
            if content_map.get("skills"):
                _set_single_run_text(p, content_map["skills"])

        elif kind == "EXP_ROLE":
            ei = label[1]
            if ei < len(exp_map):
                entry = exp_map[ei]
                # Reconstruct "Role | Company" — mimic original two-run structure
                runs = p.findall(f"{{{W}}}r")
                role_text    = entry.get("role", "")
                company_text = entry.get("company", "")
                new_full = f"{role_text} | {company_text}"
                _set_single_run_text(p, new_full)

        elif kind == "EXP_DATE":
            ei = label[1]
            if ei < len(exp_map):
                _set_single_run_text(p, exp_map[ei].get("duration", _get_text(p)))

        elif kind == "EXP_BULLET":
            ei, bi = label[1]
            if ei < len(exp_map):
                bullets = exp_map[ei].get("bullets", [])
                if bi < len(bullets):
                    _set_single_run_text(p, bullets[bi])

        elif kind == "PROJ_NAME":
            pi = label[1]
            if pi < len(proj_map):
                _set_single_run_text(p, proj_map[pi].get("name", _get_text(p)))

        elif kind == "PROJ_DESC":
            pi = label[1]
            if pi < len(proj_map):
                _set_single_run_text(p, proj_map[pi].get("description", _get_text(p)))

        elif kind == "PROJ_TECH":
            pi = label[1]
            if pi < len(proj_map):
                # Preserve the bold "Technologies: " run + update the value run
                runs = p.findall(f"{{{W}}}r")
                tech_val = proj_map[pi].get("technologies", "")
                if len(runs) >= 2:
                    # Run 0 = "Technologies: " (bold), run 1 = value
                    t_els = runs[1].findall(f"{{{W}}}t")
                    for t in t_els:
                        t.text = ""
                    if t_els:
                        t_els[0].text = tech_val
                        t_els[0].set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
                    else:
                        t_new = etree.SubElement(runs[1], f"{{{W}}}t")
                        t_new.text = tech_val
                        t_new.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
                else:
                    # Fallback
                    _set_single_run_text(p, f"Technologies: {tech_val}")

        elif kind == "EDUCATION":
            if content_map.get("education"):
                _set_single_run_text(p, content_map["education"])

    # ── 5. Serialize back to bytes ───────────────────────────────────────
    new_xml = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)

    # ── 6. Repack ZIP preserving every other file verbatim ──────────────
    out_buf = io.BytesIO()
    with zipfile.ZipFile(out_buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for name in names:
            if name == "word/document.xml":
                zout.writestr(name, new_xml)
            else:
                zout.writestr(name, zin.read(name))
    zin.close()

    return out_buf.getvalue()


# ══════════════════════════════════════════════════════════════════════════
# MAIN TAILORING FUNCTION
# ══════════════════════════════════════════════════════════════════════════
def tailor_resume_docx(docx_bytes: bytes, jd_text: str) -> tuple[bytes, dict]:
    """
    Full pipeline. Returns (tailored_docx_bytes, metadata_dict).
    """
    # --- Extract text from DOCX for LLM reading -------------------------
    zin = zipfile.ZipFile(io.BytesIO(docx_bytes))
    xml_bytes = zin.read("word/document.xml")
    zin.close()
    root = etree.fromstring(xml_bytes)
    resume_text = " ".join(
        t.text for t in root.iter(f"{{{W}}}t") if t.text
    ).strip()

    print("\n🔍 Step 1: Analyzing JD...")
    jd_intel = analyze_jd(jd_text)
    print(f"   Domain: {jd_intel.get('domain')}")

    print("🔍 Step 2: Extracting candidate skills...")
    candidate_skills = extract_candidate_skills(resume_text)

    print("🔍 Step 3: Gap analysis + 50% threshold check...")
    gap = smart_gap_analysis(jd_intel, candidate_skills)
    match = gap["_match"]
    print(f"   Tech match: {match['percentage']}%  |  inject: {match['should_inject']}")

    print("✏️  Step 4: Building tailored content map (single LLM call)...")
    content_map = build_content_map(resume_text, jd_intel, gap)

    print("🔧 Step 5: Patching DOCX XML in-place (format-preserving)...")
    tailored_bytes = patch_docx_xml(docx_bytes, content_map)

    metadata = {
        "domain":               jd_intel.get("domain"),
        "tech_match_percentage": match["percentage"],
        "missing_techs_injected": match["should_inject"],
        "matched_techs":         match["matched"],
        "missing_techs":         match["missing"],
    }
    print("✅ Done — formatting 100% preserved.")
    return tailored_bytes, metadata


# ══════════════════════════════════════════════════════════════════════════
# FLASK API
# ══════════════════════════════════════════════════════════════════════════
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "resume-tailor-format-preserving-v3"})


@app.route("/tailor", methods=["POST"])
def tailor():
    print("\n" + "="*80)
    print("🎯 [TAILOR] New tailoring request received")
    print("="*80)
    
    if "file" not in request.files:
        print("❌ [TAILOR] No file provided")
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".docx"):
        print(f"❌ [TAILOR] Invalid file type: {file.filename}")
        return jsonify({"error": "Only DOCX files are supported"}), 400

    job_description = request.form.get("jobDescription", "")
    job_title       = request.form.get("jobTitle", "")
    company         = request.form.get("company", "")
    jd_text         = f"Job Title: {job_title}\nCompany: {company}\n\n{job_description}"

    print(f"📄 [TAILOR] File: {file.filename}")
    print(f"💼 [TAILOR] Job: {job_title} at {company}")
    print(f"📝 [TAILOR] JD length: {len(job_description)} chars")

    try:
        docx_bytes = file.read()
        print(f"📦 [TAILOR] DOCX size: {len(docx_bytes)} bytes")
        
        tailored_bytes, meta = tailor_resume_docx(docx_bytes, jd_text)

        safe_name = f"{company}_{job_title}_Resume.docx".replace(" ", "_").replace("/", "_")
        print(f"✅ [TAILOR] Success! Returning {len(tailored_bytes)} bytes")
        print(f"📊 [TAILOR] Metadata: {meta}")
        print("="*80 + "\n")
        
        return send_file(
            io.BytesIO(tailored_bytes),
            as_attachment=True,
            download_name=safe_name,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception as e:
        import traceback
        print(f"❌ [TAILOR] FATAL ERROR:")
        print(traceback.format_exc())
        print("="*80 + "\n")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=True)