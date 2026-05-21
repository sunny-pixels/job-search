const Groq = require("groq-sdk");
const config = require("../config/config");

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const analyzeResumeWithGroq = async (resumeText) => {
  const prompt = `You are a strict resume parser. Extract ONLY what is explicitly written in the resume. Do NOT infer or assume. Return ONLY a valid JSON object, no markdown, no explanation.

{
  "primary_roles": ["exact job titles this person is targeting or has held"],
  "skills": ["skills explicitly listed in the resume"],
  "job_keywords": ["3-4 job title VARIATIONS for job board searching based on the candidate's domain"],
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

CRITICAL RULES:

1. primary_roles:
   - Extract ONLY the exact job titles written in the resume.
   - Do NOT generate variations here.

2. job_keywords (MOST IMPORTANT FIELD):
   - Generate exactly 3-4 ALTERNATIVE job titles for job board searching.
   - These must be in the SAME domain as the candidate's primary role.
   - Always include the primary role itself as the first entry.
   - Then add 2-3 closely related titles a hiring manager would use for the same role.
   - Domain examples:
     * Full Stack Developer → ["Full Stack Developer", "Software Engineer", "Backend Developer", "Frontend Developer"]
     * DevOps Engineer      → ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Infrastructure Engineer"]
     * Machine Learning Engineer → ["Machine Learning Engineer", "AI Engineer", "Data Scientist", "ML Engineer"]
     * Data Analyst         → ["Data Analyst", "Business Analyst", "Data Engineer", "Reporting Analyst"]
     * Network Engineer     → ["Network Engineer", "Network Administrator", "Systems Engineer", "Infrastructure Engineer"]
     * Android Developer    → ["Android Developer", "Mobile Developer", "Software Engineer", "Kotlin Developer"]
     * UI/UX Designer       → ["UI/UX Designer", "Product Designer", "UX Researcher", "Interaction Designer"]
   - NEVER mix domains. A DevOps resume must never have ML or design titles.
   - ONLY job titles — never tools, frameworks, or technologies.

3. experience_years:
   - Count ONLY paid full-time or part-time work experience.
   - Internships = 0.5 per 6 months.
   - Education, personal projects, freelance (unless stated) = 0.
   - No work experience at all = 0.

4. experience_level:
   - Intern  = 0 years
   - Junior  = 0–2 years
   - Mid     = 3–5 years
   - Senior  = 5+ years

Resume:
${resumeText.substring(0, 15000)}`;

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

  // ── FILTER PRIMARY ROLES: Remove intern positions if non-intern roles exist ──
  let primaryRoles = Array.isArray(parsed.primary_roles) && parsed.primary_roles.length > 0
    ? parsed.primary_roles
    : ["Professional"];

  // Check if there are any intern roles
  const internRoles = primaryRoles.filter(role => {
    const roleLower = role.toLowerCase();
    return roleLower.includes('intern') || roleLower.includes('internship');
  });

  // Check if there are any non-intern roles
  const nonInternRoles = primaryRoles.filter(role => {
    const roleLower = role.toLowerCase();
    return !roleLower.includes('intern') && !roleLower.includes('internship');
  });

  // PRIORITIZATION LOGIC:
  // If both intern and non-intern roles exist → use only non-intern roles
  // If only intern roles exist → use intern roles
  // If only non-intern roles exist → use non-intern roles
  if (nonInternRoles.length > 0) {
    primaryRoles = nonInternRoles;
    if (internRoles.length > 0) {
      console.log(`   ℹ️  Filtered out ${internRoles.length} intern role(s): [${internRoles.join(', ')}]`);
      console.log(`   ✅ Using ${nonInternRoles.length} non-intern role(s): [${nonInternRoles.join(', ')}]`);
    }
  } else if (internRoles.length > 0) {
    primaryRoles = internRoles;
    console.log(`   ℹ️  Only intern roles found, using: [${internRoles.join(', ')}]`);
  }

  // Validate job_keywords — only keep strings, no empty entries
  const rawKeywords = Array.isArray(parsed.job_keywords)
    ? parsed.job_keywords.filter(k => typeof k === 'string' && k.trim().length > 2)
    : [];

  // Fallback: if Groq returned too few, use primary_roles directly
  const jobKeywords = rawKeywords.length >= 2
    ? rawKeywords
    : [...rawKeywords, ...primaryRoles].slice(0, 8);

  return {
    primary_roles: primaryRoles,
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
