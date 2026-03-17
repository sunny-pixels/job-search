const Groq = require("groq-sdk");
const config = require("../config/config");

const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const techTerms = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'express',
  'mongodb', 'postgresql', 'mysql', 'git', 'docker', 'aws', 'azure', 'gcp',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'vue', 'angular', 'next.js',
  'mern', 'mean', 'api', 'rest', 'graphql', 'sql', 'nosql', 'redis', 'webpack',
  'vite', 'babel', 'eslint', 'jest', 'cypress', 'nginx', 'linux', 'kubernetes'
];

const filterJobKeywords = (keywords) => {
  if (!Array.isArray(keywords)) return [];
  return keywords.filter(kw => {
    const lower = kw.toLowerCase();
    const isTech = techTerms.some(t => lower.includes(t));
    const isTitle = lower.includes('developer') || lower.includes('engineer') ||
      lower.includes('analyst') || lower.includes('manager') ||
      lower.includes('architect') || lower.includes('lead') ||
      lower.includes('senior') || lower.includes('junior') ||
      lower.includes('intern') || lower.includes('specialist') ||
      lower.includes('designer') || lower.includes('scientist');
    return !isTech && isTitle;
  });
};

const analyzeResumeWithGroq = async (resumeText) => {
  const prompt = `You are a professional resume parser. Extract structured data from the resume below and return ONLY a valid JSON object. No explanation, no markdown, no extra text.

Return this exact structure:
{
  "primary_roles": ["most relevant job titles this person qualifies for"],
  "skills": ["technical and soft skills"],
  "job_keywords": ["job titles to search for, e.g. Full-Stack Developer, Software Engineer"],
  "experience_level": "Intern or Junior or Mid or Senior",
  "experience_years": <number>,
  "programming_languages": ["only language names"],
  "frameworks": ["only framework names"],
  "tools": ["only tool names"],
  "summary": "2-3 sentence professional summary",
  "education": ["Degree, Institution as a single string per entry"],
  "projects": ["project names or types"],
  "internships": ["company or role name"]
}

Rules:
- job_keywords must be job titles ONLY (no tech names)
- education entries must be plain strings
- experience_years must be a number (0 if student/fresher)
- Be specific and accurate based on actual resume content

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
    parsed = JSON.parse(raw);
  } catch {
    const block = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (block) parsed = JSON.parse(block[1]);
    else {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
  }

  if (!parsed) throw new Error("Could not parse JSON from Groq response");

  const validated = {
    primary_roles: Array.isArray(parsed.primary_roles) && parsed.primary_roles.length > 0
      ? parsed.primary_roles : ["Software Developer"],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    job_keywords: filterJobKeywords(parsed.job_keywords),
    experience_level: ["Intern", "Junior", "Mid", "Senior"].includes(parsed.experience_level)
      ? parsed.experience_level : "Junior",
    experience_years: parseInt(parsed.experience_years) || 0,
    programming_languages: Array.isArray(parsed.programming_languages) ? parsed.programming_languages : [],
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
    tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : "",
    education: Array.isArray(parsed.education) ? parsed.education.map(e => String(e)) : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    internships: Array.isArray(parsed.internships) ? parsed.internships : []
  };

  // Fallback job keywords if too few
  if (validated.job_keywords.length < 3) {
    const titles = new Set(validated.job_keywords);
    validated.primary_roles.forEach(role => {
      const r = role.toLowerCase();
      if (r.includes('full')) {
        titles.add("Full-Stack Developer"); titles.add("Software Engineer"); titles.add("Web Developer");
      } else if (r.includes('backend') || r.includes('back-end')) {
        titles.add("Backend Developer"); titles.add("Software Engineer");
      } else if (r.includes('frontend') || r.includes('front-end')) {
        titles.add("Frontend Developer"); titles.add("Web Developer");
      } else if (r.includes('data')) {
        titles.add("Data Engineer"); titles.add("Data Analyst");
      } else if (r.includes('mobile')) {
        titles.add("Mobile Developer"); titles.add("iOS Developer"); titles.add("Android Developer");
      } else {
        titles.add(role);
      }
    });
    titles.add("Software Developer");
    validated.job_keywords = Array.from(titles).slice(0, 8);
  }

  return validated;
};

module.exports = { analyzeResumeWithGroq };
