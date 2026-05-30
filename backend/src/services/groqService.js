const Groq = require("groq-sdk");
const config = require("../config/config");

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKLIST: titles the model hallucinates for BA/PO/PM profiles.
// Add more here as you discover new patterns.
// ─────────────────────────────────────────────────────────────────────────────
const FORBIDDEN_KEYWORDS = [
  "agile coach",
  "scrum master",
  "requirements engineer",
  "digital transformation lead",
  "change manager",
  "delivery lead",
  "transformation consultant",
  "process improvement specialist",
  "rpa developer",
  "lean six sigma",
];

const isForbidden = (title) => {
  const lower = title.toLowerCase().trim();
  return FORBIDDEN_KEYWORDS.some((blocked) => lower === blocked);
};

// ─────────────────────────────────────────────────────────────────────────────
// Fallback keywords per domain — used only if Groq returns <2 clean titles
// ─────────────────────────────────────────────────────────────────────────────
const DOMAIN_FALLBACKS = {
  "business analysis": ["Business Analyst", "IT Business Analyst", "Business Systems Analyst", "Product Analyst"],
  "product owner":     ["Product Owner", "Business Analyst", "Business Systems Analyst", "IT Business Analyst"],
  "software":          ["Software Engineer", "Backend Engineer", "Full Stack Developer", "Application Developer"],
  "data":              ["Data Analyst", "Business Intelligence Analyst", "Reporting Analyst", "Analytics Specialist"],
  "devops":            ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Infrastructure Engineer"],
  "ml":                ["Machine Learning Engineer", "AI Engineer", "Data Scientist", "ML Engineer"],
  "ux":                ["UI/UX Designer", "Product Designer", "UX Researcher", "Interaction Designer"],
  "hr":                ["HR Generalist", "Human Resources Specialist", "Talent Acquisition Specialist", "HR Coordinator"],
  "finance":           ["Financial Analyst", "Investment Analyst", "Finance Associate", "Budget Analyst"],
  "marketing":         ["Digital Marketing Specialist", "Marketing Analyst", "Growth Marketing Specialist", "SEO Specialist"],
  "sales":             ["Sales Executive", "Account Executive", "Business Development Executive", "Sales Consultant"],
  "project":           ["Project Manager", "Program Manager", "Delivery Manager", "Technical Project Manager"],
  "healthcare":        ["Registered Nurse", "Clinical Nurse", "Patient Care Nurse", "Staff Nurse"],
};

const getFallbackForRoles = (primaryRoles) => {
  const combined = primaryRoles.join(" ").toLowerCase();
  if (combined.includes("product owner"))    return DOMAIN_FALLBACKS["product owner"];
  if (combined.includes("business analyst")) return DOMAIN_FALLBACKS["business analysis"];
  if (combined.includes("software") || combined.includes("developer") || combined.includes("engineer"))
    return DOMAIN_FALLBACKS["software"];
  if (combined.includes("data") || combined.includes("analyst") || combined.includes("bi"))
    return DOMAIN_FALLBACKS["data"];
  if (combined.includes("devops") || combined.includes("cloud") || combined.includes("sre"))
    return DOMAIN_FALLBACKS["devops"];
  if (combined.includes("machine learning") || combined.includes("ml") || combined.includes("ai"))
    return DOMAIN_FALLBACKS["ml"];
  if (combined.includes("ux") || combined.includes("ui") || combined.includes("design"))
    return DOMAIN_FALLBACKS["ux"];
  if (combined.includes("hr") || combined.includes("human resource") || combined.includes("talent"))
    return DOMAIN_FALLBACKS["hr"];
  if (combined.includes("financ") || combined.includes("account"))
    return DOMAIN_FALLBACKS["finance"];
  if (combined.includes("market") || combined.includes("seo") || combined.includes("growth"))
    return DOMAIN_FALLBACKS["marketing"];
  if (combined.includes("sales") || combined.includes("account executive"))
    return DOMAIN_FALLBACKS["sales"];
  if (combined.includes("project manager") || combined.includes("program manager"))
    return DOMAIN_FALLBACKS["project"];
  if (combined.includes("nurse") || combined.includes("clinical") || combined.includes("patient"))
    return DOMAIN_FALLBACKS["healthcare"];
  // last resort: return primary roles themselves
  return primaryRoles.slice(0, 4);
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const buildPrompt = (resumeText) => `
You are a highly accurate ATS-style resume parser and job search keyword generator.

Your task is to extract ONLY information explicitly present in the resume and generate highly relevant job-search titles.

IMPORTANT:
- Return ONLY valid JSON.
- No markdown, no explanations, no comments, no extra text.
- Never hallucinate technologies, tools, skills, companies, or job titles.

Return this exact JSON structure:

{
  "primary_roles": [],
  "skills": [],
  "job_keywords": [],
  "experience_level": "",
  "experience_years": 0,
  "programming_languages": [],
  "frameworks": [],
  "tools": [],
  "soft_skills": [],
  "domains": [],
  "certifications": [],
  "summary": "",
  "education": [],
  "projects": [],
  "internships": []
}

==================================================
RULES
==================================================

1. primary_roles
   - Extract ONLY exact job titles explicitly written in the resume.
   - Include current and previous roles. Do NOT infer or generate new titles.

2. skills
   - Extract only explicitly mentioned skills (technical, business, domain, analytical).
   - Do NOT include generic filler words.

3. job_keywords  ← MOST IMPORTANT — FOLLOW ALL 4 STEPS
   Generate EXACTLY 4 job titles for job-board searching.

   STEP 1 — IDENTIFY CORE DOMAIN from this list:
     Software Engineering / Development | Data / Analytics / BI | Machine Learning / AI
     DevOps / Cloud / Infrastructure | Business Analysis / Product Ownership
     UI/UX / Product Design | Project / Program Management | Healthcare / Clinical
     Finance / Accounting | Marketing / Growth | Sales / Business Development
     Human Resources / Talent | Construction / Engineering | Other

   STEP 2 — ANCHOR: First entry MUST be the strongest title explicitly in the resume.
     For hybrid roles (e.g. "BA / Product Owner") pick the dominant one by responsibilities.

   STEP 3 — ADD 3 MORE within the SAME domain. Use this reference:

     Business Analysis / Product:
       ["Business Analyst", "IT Business Analyst", "Business Systems Analyst", "Product Analyst"]
     Business Analysis leaning Product Owner:
       ["Business Analyst", "Product Owner", "Business Systems Analyst", "IT Business Analyst"]
     Software Engineering:
       ["Software Engineer", "Backend Engineer", "Full Stack Developer", "Application Developer"]
     Machine Learning / AI:
       ["Machine Learning Engineer", "AI Engineer", "Data Scientist", "ML Engineer"]
     DevOps / Cloud:
       ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Infrastructure Engineer"]
     Data / BI / Analytics:
       ["Data Analyst", "Business Intelligence Analyst", "Reporting Analyst", "Analytics Specialist"]
     Healthcare:
       ["Registered Nurse", "Clinical Nurse", "Patient Care Nurse", "Staff Nurse"]
     Finance:
       ["Financial Analyst", "Investment Analyst", "Finance Associate", "Budget Analyst"]
     Marketing:
       ["Digital Marketing Specialist", "Marketing Analyst", "Growth Marketing Specialist", "SEO Specialist"]
     Sales:
       ["Sales Executive", "Account Executive", "Business Development Executive", "Sales Consultant"]
     UI/UX:
       ["UI/UX Designer", "Product Designer", "UX Researcher", "Interaction Designer"]
     Human Resources:
       ["HR Generalist", "Human Resources Specialist", "Talent Acquisition Specialist", "HR Coordinator"]
     Project / Program Management:
       ["Project Manager", "Program Manager", "Delivery Manager", "Technical Project Manager"]
     Construction / Field Engineering:
       ["Project Engineer", "Construction Coordinator", "Site Engineer", "Field Engineer"]

   STEP 4 — SELF-CHECK each title before outputting:
     ✓ Is it a real title a recruiter would post?
     ✓ Is it in the same domain as the candidate?
     ✓ Does the resume actually support this title?
     ✓ Is it a TITLE, not a methodology/tool/certification?
     If any answer is NO → replace it.

   NEVER OUTPUT THESE (unless explicitly listed as a resume job title):
     Agile Coach, Scrum Master, Requirements Engineer, Digital Transformation Lead,
     Change Manager, Delivery Lead, Transformation Consultant, RPA Developer

4. experience_years
   COUNT: full-time, part-time, contract roles.
   PARTIAL: internship 6 months = 0.5 years.
   DO NOT COUNT: education, academic projects, certifications.

5. experience_level
   Intern: 0 | Junior: 0–2 | Mid: 3–5 | Senior: 5+

6. programming_languages — only explicitly mentioned. If none: []

7. frameworks — only explicitly mentioned. If none: []

8. tools — only explicitly mentioned tools/platforms/software.

9. soft_skills — only explicitly mentioned.

10. domains — only explicitly mentioned industry domains.

11. certifications — only explicitly listed.

12. summary — 2–3 sentences, based ONLY on resume content. No exaggeration.

13. education — format: "Degree - Institution"

14. projects — explicitly mentioned project names or types.

15. internships — explicitly mentioned internship companies or titles.

FINAL: Output MUST be valid parsable JSON. No trailing commas. No markdown. No code fences.

Resume:
${resumeText.substring(0, 20000)}`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
const analyzeResumeWithGroq = async (resumeText) => {
  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: buildPrompt(resumeText) }],
    model: "llama-3.3-70b-versatile",   // ← upgraded from 8b-instant
    temperature: 0.1,
    max_tokens: 1200,                   // ← bumped to fit full JSON
    top_p: 0.9,
    frequency_penalty: 0.1,
  });

  const raw = response.choices[0].message.content.trim();
  console.log("=== GROQ RESPONSE ===\n", raw, "\n====================");

  // ── Parse JSON (with fallback strategies) ────────────────────────────────
  let parsed = null;
  try {
    const clean = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    parsed = JSON.parse(clean);
  } catch {
    const block = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (block) {
      parsed = JSON.parse(block[1].replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
    } else {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0].replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
      }
    }
  }

  if (!parsed) throw new Error("Could not parse JSON from Groq response");

  // ── Experience ────────────────────────────────────────────────────────────
  const expYears = parseInt(parsed.experience_years);
  const safeExpYears = isNaN(expYears) || expYears < 0 ? 0 : expYears;

  let expLevel;
  if (safeExpYears === 0)      expLevel = "Intern";
  else if (safeExpYears <= 2)  expLevel = "Junior";
  else if (safeExpYears <= 5)  expLevel = "Mid";
  else                         expLevel = "Senior";

  // ── Primary roles: strip intern if non-intern roles exist ─────────────────
  let primaryRoles = Array.isArray(parsed.primary_roles) && parsed.primary_roles.length > 0
    ? parsed.primary_roles
    : ["Professional"];

  const internRoles    = primaryRoles.filter(r => /intern/i.test(r));
  const nonInternRoles = primaryRoles.filter(r => !/intern/i.test(r));

  if (nonInternRoles.length > 0) {
    if (internRoles.length > 0) {
      console.log(`   ℹ️  Filtered intern roles: [${internRoles.join(", ")}]`);
      console.log(`   ✅ Using: [${nonInternRoles.join(", ")}]`);
    }
    primaryRoles = nonInternRoles;
  } else {
    primaryRoles = internRoles;
  }

  // ── job_keywords: filter forbidden titles, then cap at 4 ─────────────────
  const rawKeywords = Array.isArray(parsed.job_keywords)
    ? parsed.job_keywords.filter(k => typeof k === "string" && k.trim().length > 2)
    : [];

  const cleanKeywords = rawKeywords.filter(k => !isForbidden(k));

  const removedCount = rawKeywords.length - cleanKeywords.length;
  if (removedCount > 0) {
    const removed = rawKeywords.filter(isForbidden);
    console.log(`   ⚠️  Removed ${removedCount} forbidden keyword(s): [${removed.join(", ")}]`);
  }

  // If after filtering we have <2 good keywords, fall back to domain defaults
  let jobKeywords;
  if (cleanKeywords.length >= 2) {
    jobKeywords = cleanKeywords.slice(0, 4);   // ← always take from index 0
  } else {
    jobKeywords = getFallbackForRoles(primaryRoles).slice(0, 4);
    console.log(`   🔄 Using domain fallback keywords: [${jobKeywords.join(", ")}]`);
  }

  console.log(`   🔍 Final job_keywords: [${jobKeywords.join(", ")}]`);

  // ── Return clean result ───────────────────────────────────────────────────
  return {
    primary_roles:        primaryRoles,
    skills:               Array.isArray(parsed.skills) ? parsed.skills.filter(s => typeof s === "string") : [],
    job_keywords:         jobKeywords,
    experience_level:     expLevel,
    experience_years:     safeExpYears,
    programming_languages: Array.isArray(parsed.programming_languages) ? parsed.programming_languages.filter(l => typeof l === "string") : [],
    frameworks:           Array.isArray(parsed.frameworks) ? parsed.frameworks.filter(f => typeof f === "string") : [],
    tools:                Array.isArray(parsed.tools) ? parsed.tools.filter(t => typeof t === "string") : [],
    soft_skills:          Array.isArray(parsed.soft_skills) ? parsed.soft_skills.filter(s => typeof s === "string") : [],
    domains:              Array.isArray(parsed.domains) ? parsed.domains.filter(d => typeof d === "string") : [],
    certifications:       Array.isArray(parsed.certifications) ? parsed.certifications.filter(c => typeof c === "string") : [],
    summary:              typeof parsed.summary === "string" ? parsed.summary : "",
    education:            Array.isArray(parsed.education) ? parsed.education.map(e => String(e)) : [],
    projects:             Array.isArray(parsed.projects) ? parsed.projects.filter(p => typeof p === "string") : [],
    internships:          Array.isArray(parsed.internships) ? parsed.internships.filter(i => typeof i === "string") : [],
  };
};

module.exports = { analyzeResumeWithGroq };