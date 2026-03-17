const axios = require("axios");
const config = require("../config/config");

const techTerms = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'express',
  'mongodb', 'postgresql', 'mysql', 'git', 'docker', 'aws', 'azure', 'gcp',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'vue', 'angular', 'next.js',
  'mern', 'mean', 'lamp', 'api', 'rest', 'graphql', 'jwt', 'oauth', 'sql',
  'nosql', 'redis', 'nginx', 'apache', 'linux', 'ubuntu', 'centos', 'webpack',
  'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'selenium'
];

const filterJobKeywords = (keywords) => {
  if (!Array.isArray(keywords)) return [];
  return keywords.filter(keyword => {
    const lower = keyword.toLowerCase();
    const isTechTerm = techTerms.some(tech => lower.includes(tech));
    const isJobTitle = lower.includes('developer') || lower.includes('engineer') ||
      lower.includes('analyst') || lower.includes('manager') ||
      lower.includes('architect') || lower.includes('lead') ||
      lower.includes('senior') || lower.includes('junior') ||
      lower.includes('intern') || lower.includes('specialist');
    return !isTechTerm && isJobTitle;
  });
};

const analyzeResumeWithOllama = async (resumeText) => {
  const prompt = `Extract from this resume and return ONLY JSON:

{
  "primary_roles": ["actual job titles only"],
  "skills": ["technical skills"],
  "job_keywords": ["job titles for job searching"],
  "experience_level": "Junior/Mid/Senior/Intern",
  "experience_years": 0,
  "programming_languages": ["languages only"],
  "frameworks": ["frameworks only"],
  "tools": ["tools only"],
  "summary": "brief professional summary",
  "education": ["degrees and institutions"],
  "projects": ["key project names or types"],
  "internships": ["internship companies or roles"]
}

CRITICAL RULES:
- job_keywords: ONLY job titles like "Full-Stack Developer", "Software Engineer" - NO technologies
- skills: Technical abilities like "API Development", "Database Design"
- programming_languages: ONLY languages like "JavaScript", "Python"
- frameworks: ONLY frameworks like "React", "Express", "Node.js"
- tools: ONLY tools like "Git", "Docker", "MongoDB"
- education: must be strings (e.g. "B.Tech Computer Science, XYZ University")

Resume:
${resumeText.substring(0, 3000)}

JSON:`;

  try {
    const response = await axios.post(`${config.OLLAMA_URL}/api/generate`, {
      model: config.OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 500,
        top_k: 10,
        top_p: 0.9
      }
    });

    let aiResponse = response.data.response.trim();

    console.log("=== RAW OLLAMA RESPONSE ===");
    console.log(aiResponse);
    console.log("===========================");

    let parsedData = null;
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (e) {
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        parsedData = JSON.parse(codeBlockMatch[1]);
      } else {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    if (!parsedData) throw new Error("Could not extract JSON from Ollama response");

    const validatedData = {
      primary_roles: Array.isArray(parsedData.primary_roles) && parsedData.primary_roles.length > 0
        ? parsedData.primary_roles : ["Full-Stack Developer"],
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      job_keywords: filterJobKeywords(parsedData.job_keywords),
      experience_level: ["Intern", "Junior", "Mid", "Senior"].includes(parsedData.experience_level)
        ? parsedData.experience_level : "Junior",
      experience_years: parseInt(parsedData.experience_years) || 0,
      programming_languages: Array.isArray(parsedData.programming_languages) ? parsedData.programming_languages : [],
      frameworks: Array.isArray(parsedData.frameworks) ? parsedData.frameworks : [],
      tools: Array.isArray(parsedData.tools) ? parsedData.tools : [],
      summary: typeof parsedData.summary === 'string' ? parsedData.summary : "",
      education: Array.isArray(parsedData.education) ? parsedData.education.map(e => String(e)) : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      internships: Array.isArray(parsedData.internships) ? parsedData.internships : []
    };

    if (validatedData.job_keywords.length < 3) {
      const jobTitles = new Set(validatedData.job_keywords);
      validatedData.primary_roles.forEach(role => {
        const r = role.toLowerCase();
        if (r.includes('full')) {
          jobTitles.add("Full-Stack Developer");
          jobTitles.add("Software Engineer");
          jobTitles.add("Web Developer");
        } else if (r.includes('backend') || r.includes('back-end')) {
          jobTitles.add("Backend Developer");
          jobTitles.add("Software Engineer");
        } else if (r.includes('frontend') || r.includes('front-end')) {
          jobTitles.add("Frontend Developer");
          jobTitles.add("Web Developer");
        } else {
          jobTitles.add(role);
        }
      });
      jobTitles.add("Software Developer");
      jobTitles.add("Application Developer");
      validatedData.job_keywords = Array.from(jobTitles).slice(0, 8);
    }

    return validatedData;

  } catch (error) {
    console.error("Error analyzing resume with Ollama:", error.message);
    throw error;
  }
};

module.exports = { analyzeResumeWithOllama };
