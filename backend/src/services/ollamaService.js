const axios = require("axios");
const config = require("../config/config");

const getEmbedding = async (text) => {
  const response = await axios.post(`${config.OLLAMA_URL}/api/embeddings`, {
    model: "nomic-embed-text",
    prompt: text.substring(0, 1000)
  });
  return response.data.embedding;
};

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildResumeEmbedText = (analysis) => {
  return [
    analysis.primary_roles?.join(", "),
    analysis.skills?.join(", "),
    analysis.programming_languages?.join(", "),
    analysis.frameworks?.join(", "),
    analysis.tools?.join(", "),
    analysis.summary,
    `Experience: ${analysis.experience_level}, ${analysis.experience_years} years`
  ].filter(Boolean).join(". ");
};

const buildJobEmbedText = (job) => {
  if (job.description && job.description.length > 100) {
    const header = [job.title, job.department, job.company].filter(Boolean).join(", ");
    return `${header}. ${job.description.substring(0, 1000)}`;
  }
  return [job.title, job.department, job.company, job.location].filter(Boolean).join(", ");
};

/** Extract minimum YOE required from job title + description */
const extractRequiredYOE = (job) => {
  const text = `${job.title} ${job.description || ""}`.toLowerCase();

  const patterns = [
    /(\d+)\s*\+\s*(?:yoe|years?(?:\s+of)?\s+(?:experience|exp))/i,
    /(\d+)\s*[-–]\s*\d+\s*(?:yoe|years?(?:\s+of)?\s+(?:experience|exp))/i,
    /(?:minimum|at\s+least|requires?)\s+(\d+)\s*\+?\s*years?/i,
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1]);
  }

  const title = job.title.toLowerCase();
  if (title.includes('staff') || title.includes('principal')) return 7;
  if (title.includes('senior') || title.includes('lead')) return 4;
  if (title.includes(' ii') || title.includes('ii ') || title.includes('mid-level')) return 2;
  if (title.includes('junior') || title.includes('associate') || title.includes('entry')) return 0;
  if (title.includes('intern')) return 0;

  return null;
};

/**
 * AND GATE — all conditions must pass for a job to be shown.
 * Returns { pass: bool, reasons: string[] }
 */
const andGateCheck = (job, resumeAnalysis) => {
  const jobTitle = job.title.toLowerCase();
  const jobDesc = (job.description || "").toLowerCase();
  const jobText = `${jobTitle} ${jobDesc}`;

  const expYears = resumeAnalysis.experience_years || 0;
  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => r.toLowerCase());
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => k.toLowerCase());
  const languages = (resumeAnalysis.programming_languages || []).map(l => l.toLowerCase());
  const frameworks = (resumeAnalysis.frameworks || []).map(f => f.toLowerCase());
  const tools = (resumeAnalysis.tools || []).map(t => t.toLowerCase());
  const skills = (resumeAnalysis.skills || []).map(s => s.toLowerCase());

  // CONDITION 1: Experience gate — candidate must meet minimum YOE
  const requiredYOE = extractRequiredYOE(job);
  if (requiredYOE !== null && expYears + 1 < requiredYOE) {
    return { pass: false, reason: `requires ${requiredYOE} YOE, candidate has ${expYears}` };
  }

  // CONDITION 2: Primary role must match job title — strict domain check
  // Extract meaningful domain words from primary roles and keywords
  // Filter out generic words that match too broadly
  const stopWords = new Set([
    'intern', 'senior', 'junior', 'lead', 'manager', 'associate', 'staff',
    'principal', 'entry', 'level', 'role', 'position', 'job', 'and', 'the',
    'with', 'for', 'new', 'grad', 'graduate'
  ]);

  const getDomainWords = (terms) => {
    const words = new Set();
    terms.forEach(term => {
      term.split(/[\s\-&\/]/).forEach(w => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length > 3 && !stopWords.has(clean)) {
          words.add(clean);
        }
      });
    });
    return words;
  };

  const domainWords = getDomainWords([...primaryRoles, ...jobKeywords]);

  // Job title must contain at least one domain word from the candidate's profile
  const titleMatchesDomain = [...domainWords].some(word => jobTitle.includes(word));

  if (!titleMatchesDomain) {
    return { pass: false, reason: `job title "${job.title}" doesn't match candidate domain` };
  }

  // CONDITION 3: At least one tech term (language/framework/tool/skill) must appear in JD
  const allTech = [...new Set([...languages, ...frameworks, ...tools, ...skills])];
  const techMatch = allTech.some(tech => {
    const words = tech.split(/[\s\-\.]/);
    return words.some(w => w.length > 2 && jobText.includes(w));
  });
  if (!techMatch && allTech.length > 0) {
    return { pass: false, reason: "no tech stack match in JD" };
  }

  return { pass: true };
};

const scoreAndSortJobsWithEmbeddings = async (jobs, resumeAnalysis) => {
  console.log(`🔍 Applying AND gate to ${jobs.length} jobs...`);

  // Apply AND gate — hard filter before any scoring
  const eligibleJobs = jobs.filter(job => {
    const result = andGateCheck(job, resumeAnalysis);
    return result.pass;
  });

  console.log(`✅ AND gate: ${jobs.length} → ${eligibleJobs.length} eligible jobs`);

  if (eligibleJobs.length === 0) {
    console.log("⚠️  No jobs passed AND gate");
    return [];
  }

  // Get resume embedding once
  let resumeEmbedding = null;
  let useEmbeddings = true;
  try {
    resumeEmbedding = await getEmbedding(buildResumeEmbedText(resumeAnalysis));
  } catch (err) {
    console.warn("⚠️  Ollama unavailable, using rule-based only:", err.message);
    useEmbeddings = false;
  }

  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => r.toLowerCase());
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => k.toLowerCase());
  const languages = (resumeAnalysis.programming_languages || []).map(l => l.toLowerCase());
  const frameworks = (resumeAnalysis.frameworks || []).map(f => f.toLowerCase());
  const tools = (resumeAnalysis.tools || []).map(t => t.toLowerCase());
  const skills = (resumeAnalysis.skills || []).map(s => s.toLowerCase());
  const techTermsAll = [...new Set([...languages, ...frameworks, ...tools, ...skills])];
  const expYears = resumeAnalysis.experience_years || 0;

  const scoredJobs = await Promise.all(eligibleJobs.map(async (job) => {
    const jobTitle = job.title.toLowerCase();
    const jobDept = (job.department || "").toLowerCase();
    const jobDesc = (job.description || "").toLowerCase();

    // Semantic score (0-55) — resume vs full JD embedding
    let semanticScore = 0;
    if (useEmbeddings && resumeEmbedding) {
      try {
        const jobEmbedding = await getEmbedding(buildJobEmbedText(job));
        semanticScore = Math.round(cosineSimilarity(resumeEmbedding, jobEmbedding) * 55);
      } catch {
        useEmbeddings = false;
      }
    }

    // Rule-based boost (0-45)
    let boost = 0;

    // Title match depth (0-20) — based on domain word overlap
    const stopWordsScore = new Set([
      'intern', 'senior', 'junior', 'lead', 'manager', 'associate', 'staff',
      'principal', 'entry', 'level', 'and', 'the', 'with', 'for', 'new', 'grad'
    ]);
    const getDomainWordsScore = (terms) => {
      const words = new Set();
      terms.forEach(term => {
        term.split(/[\s\-&\/]/).forEach(w => {
          const clean = w.toLowerCase().replace(/[^a-z]/g, '');
          if (clean.length > 3 && !stopWordsScore.has(clean)) words.add(clean);
        });
      });
      return words;
    };
    const candidateDomainWords = getDomainWordsScore([...primaryRoles, ...jobKeywords]);
    const jobTitleWords = jobTitle.split(/[\s\-&\/]/).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 3);
    const domainMatches = jobTitleWords.filter(w => candidateDomainWords.has(w)).length;
    const titleScore = domainMatches >= 2 ? 20 : domainMatches === 1 ? 12 : 0;
    boost += titleScore;

    // Tech stack depth in JD (0-15)
    let techHits = 0;
    for (const tech of techTermsAll) {
      const words = tech.split(/[\s\-\.]/);
      if (words.some(w => w.length > 2 && (jobTitle.includes(w) || jobDept.includes(w) || jobDesc.includes(w)))) {
        techHits++;
      }
    }
    boost += techTermsAll.length > 0
      ? Math.min(15, Math.round((techHits / techTermsAll.length) * 15))
      : 7;

    // Experience alignment (0-10)
    const requiredYOE = extractRequiredYOE(job);
    if (requiredYOE === null) {
      boost += 7;
    } else if (expYears >= requiredYOE) {
      boost += 10;
    } else if (expYears + 1 >= requiredYOE) {
      boost += 6;
    } else {
      boost += 2;
    }

    const finalScore = useEmbeddings
      ? Math.min(100, semanticScore + boost)
      : Math.min(100, Math.round((boost / 45) * 100));

    return { ...job, match_score: finalScore };
  }));

  // Sort: source first (jobspy before greenhouse), then by score desc within each group
  scoredJobs.sort((a, b) => {
    const aIsJobSpy = a.source_type === 'jobspy' ? 0 : 1;
    const bIsJobSpy = b.source_type === 'jobspy' ? 0 : 1;
    if (aIsJobSpy !== bIsJobSpy) return aIsJobSpy - bIsJobSpy;
    return b.match_score - a.match_score;
  });
  const result = scoredJobs.filter(j => j.match_score >= 35).slice(0, 100);

  console.log(`🎯 Final: ${result.length} jobs. Top score: ${result[0]?.match_score}%`);
  return result;
};

module.exports = { scoreAndSortJobsWithEmbeddings };
