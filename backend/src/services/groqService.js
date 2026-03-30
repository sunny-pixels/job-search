const Groq = require("groq-sdk");
const config = require("../config/config");

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const analyzeResumeWithGroq = async (resumeText) => {
  const prompt = `You are a strict resume parser. Extract ONLY what is explicitly written in the resume. Do NOT infer or assume. Return ONLY a valid JSON object, no markdown, no explanation.

{
  "primary_roles": ["exact job titles this person is targeting or has held"],
  "skills": ["skills explicitly listed in the resume"],
  "job_keywords": ["5-8 job titles to search on job boards that match this person's actual domain. Examples: if HR resume → HR Manager, Recruiter, Talent Acquisition Specialist; if sales → Sales Executive, Account Manager, Business Development; if logistics → Supply Chain Analyst, Logistics Coordinator; if security → SOC Analyst, Security Engineer; if software → Software Engineer, Full-Stack Developer. ONLY job titles, never technology or tool names."],
  "experience_level": "Intern or Junior or Mid or Senior",
  "experience_years": <number>,
  "programming_languages": ["only if explicitly listed in resume, else empty array"],
  "frameworks": ["only if explicitly listed in resume, else empty array"],
  "tools": ["tools explicitly mentioned in resume"],
  "summary": "2-3 sentence summary based only on resume content",
  "education": ["Degree, Institution as a single string per entry"],
  "projects": ["project names or types mentioned"],
  "internships": ["internship company or role if explicitly mentioned"]
}

RULES:
- job_keywords: reflect the ACTUAL domain. Never cross domains. A logistics resume must never have software titles.
- experience_years: ONLY paid full-time/part-time work. Internships = 0.5 per 6 months. Education and personal projects = 0. No work experience = 0.
- experience_level: Intern = 0 yrs, Junior = 0-2 yrs, Mid = 3-5 yrs, Senior = 5+ yrs
- primary_roles: what this person actually is, not what they aspire to be unless stated

Resume:
${resumeText.substring(0, 4000)}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 800,
    top_p: 0.9,
    frequency_penalty: 0.1,
  });

  const raw = response.choices[0].message.content.trim();
  console.log("=== GROQ RESPONSE ===\n", raw, "\n====================");

  let parsed = null;
  try {
    // Remove any comments from JSON before parsing
    const cleanedJson = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    parsed = JSON.parse(cleanedJson);
  } catch {
    const block = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (block) {
      const cleanedJson = block[1].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      parsed = JSON.parse(cleanedJson);
    } else {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const cleanedJson = match[0].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        parsed = JSON.parse(cleanedJson);
      }
    }
  }

  if (!parsed) throw new Error("Could not parse JSON from Groq response");

  const expYears = parseInt(parsed.experience_years);
  const safeExpYears = isNaN(expYears) || expYears < 0 ? 0 : expYears;

  // Always derive level from years — don't trust AI's level if years says otherwise
  let expLevel;
  if (safeExpYears === 0) expLevel = "Intern";
  else if (safeExpYears <= 2) expLevel = "Junior";
  else if (safeExpYears <= 5) expLevel = "Mid";
  else expLevel = "Senior";

  // Validate job_keywords — only keep strings, no empty entries
  const rawKeywords = Array.isArray(parsed.job_keywords)
    ? parsed.job_keywords.filter(k => typeof k === 'string' && k.trim().length > 2)
    : [];

  // Fallback: if Groq returned too few, use primary_roles directly
  const jobKeywords = rawKeywords.length >= 2
    ? rawKeywords
    : [...rawKeywords, ...(Array.isArray(parsed.primary_roles) ? parsed.primary_roles : [])].slice(0, 8);

  return {
    primary_roles: Array.isArray(parsed.primary_roles) && parsed.primary_roles.length > 0
      ? parsed.primary_roles : ["Professional"],
    skills: Array.isArray(parsed.skills) ? parsed.skills.filter(s => typeof s === 'string') : [],
    job_keywords: jobKeywords,
    experience_level: expLevel,
    experience_years: safeExpYears,
    programming_languages: Array.isArray(parsed.programming_languages) ? parsed.programming_languages.filter(l => typeof l === 'string') : [],
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks.filter(f => typeof f === 'string') : [],
    tools: Array.isArray(parsed.tools) ? parsed.tools.filter(t => typeof t === 'string') : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : "",
    education: Array.isArray(parsed.education) ? parsed.education.map(e => String(e)) : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects.filter(p => typeof p === 'string') : [],
    internships: Array.isArray(parsed.internships) ? parsed.internships.filter(i => typeof i === 'string') : []
  };
};

module.exports = { analyzeResumeWithGroq };
