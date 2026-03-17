const axios = require("axios");
const config = require("../config/config");

/**
 * Get embedding vector for a text using Ollama nomic-embed-text
 */
const getEmbedding = async (text) => {
  const response = await axios.post(`${config.OLLAMA_URL}/api/embeddings`, {
    model: "nomic-embed-text",
    prompt: text.substring(0, 1000)
  });
  return response.data.embedding;
};

/**
 * Cosine similarity between two vectors
 */
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Build a compact resume text for embedding
 */
const buildResumeEmbedText = (analysis) => {
  const parts = [
    analysis.primary_roles?.join(", "),
    analysis.skills?.join(", "),
    analysis.programming_languages?.join(", "),
    analysis.frameworks?.join(", "),
    analysis.tools?.join(", "),
    analysis.summary,
    `Experience: ${analysis.experience_level}, ${analysis.experience_years} years`
  ].filter(Boolean);
  return parts.join(". ");
};

/**
 * Build a compact job text for embedding
 */
const buildJobEmbedText = (job) => {
  return [job.title, job.department, job.company, job.location]
    .filter(Boolean).join(", ");
};

/**
 * Score and sort jobs using semantic embeddings + rule-based boost
 * Returns top 50-100 jobs sorted by score descending
 */
const scoreAndSortJobsWithEmbeddings = async (jobs, resumeAnalysis) => {
  console.log(`🧠 Embedding-based scoring for ${jobs.length} jobs...`);

  let resumeEmbedding = null;
  let useEmbeddings = true;

  try {
    const resumeText = buildResumeEmbedText(resumeAnalysis);
    resumeEmbedding = await getEmbedding(resumeText);
  } catch (err) {
    console.warn("⚠️  Ollama embedding unavailable, falling back to rule-based scoring:", err.message);
    useEmbeddings = false;
  }

  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => String(r).toLowerCase());
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => String(k).toLowerCase());
  const skills = (resumeAnalysis.skills || []).map(s => String(s).toLowerCase());
  const languages = (resumeAnalysis.programming_languages || []).map(l => String(l).toLowerCase());
  const frameworks = (resumeAnalysis.frameworks || []).map(f => String(f).toLowerCase());
  const tools = (resumeAnalysis.tools || []).map(t => String(t).toLowerCase());
  const allTerms = [...primaryRoles, ...jobKeywords, ...skills, ...languages, ...frameworks, ...tools];

  // Score all jobs
  const scoredJobs = await Promise.all(jobs.map(async (job) => {
    const jobTitle = job.title.toLowerCase();
    const jobDept = (job.department || "").toLowerCase();

    // --- Semantic score (0-60) ---
    let semanticScore = 0;
    if (useEmbeddings && resumeEmbedding) {
      try {
        const jobText = buildJobEmbedText(job);
        const jobEmbedding = await getEmbedding(jobText);
        const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
        semanticScore = Math.round(similarity * 60); // scale to 0-60
      } catch {
        useEmbeddings = false; // stop trying if it keeps failing
      }
    }

    // --- Rule-based boost (0-40) ---
    let boost = 0;

    // Title match (0-20)
    let titleMatch = 0;
    for (const term of [...primaryRoles, ...jobKeywords]) {
      const words = term.split(/[\s\-]/);
      const matched = words.filter(w => w.length > 3 && jobTitle.includes(w)).length;
      const ratio = matched / words.length;
      if (ratio >= 0.8) { titleMatch = 20; break; }
      else if (ratio >= 0.5) titleMatch = Math.max(titleMatch, 14);
      else if (ratio > 0) titleMatch = Math.max(titleMatch, 7);
    }
    boost += titleMatch;

    // Tech stack match (0-12)
    const techTermsLocal = [...skills, ...languages, ...frameworks, ...tools];
    let techHits = 0;
    for (const tech of techTermsLocal) {
      const words = tech.split(/[\s\-\.]/);
      if (words.some(w => w.length > 2 && (jobTitle.includes(w) || jobDept.includes(w)))) {
        techHits++;
      }
    }
    boost += techTermsLocal.length > 0 ? Math.min(12, Math.round((techHits / techTermsLocal.length) * 12)) : 6;

    // Experience level match (0-8)
    const expLevel = (resumeAnalysis.experience_level || "").toLowerCase();
    const expYears = resumeAnalysis.experience_years || 0;
    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal')) {
      boost += (expLevel === 'senior' || expYears >= 5) ? 8 : expYears >= 3 ? 5 : 2;
    } else if (jobTitle.includes('junior') || jobTitle.includes('associate') || jobTitle.includes('entry')) {
      boost += (expLevel === 'junior' || expYears <= 2) ? 8 : 5;
    } else if (jobTitle.includes('intern')) {
      boost += (expLevel === 'intern' || expYears === 0) ? 8 : 3;
    } else {
      boost += expYears >= 2 ? 7 : 5;
    }

    // If embeddings not available, use rule-based only (scale to 100)
    const finalScore = useEmbeddings
      ? Math.min(100, semanticScore + boost)
      : Math.min(100, Math.round((boost / 40) * 100));

    return { ...job, match_score: finalScore };
  }));

  // Sort descending by score
  scoredJobs.sort((a, b) => b.match_score - a.match_score);

  // Return top 100, but only jobs with score >= 30 (filter noise)
  const filtered = scoredJobs.filter(j => j.match_score >= 30).slice(0, 100);

  console.log(`✅ Scoring done. Returning ${filtered.length} jobs. Top: ${filtered[0]?.match_score}%`);
  return filtered;
};

module.exports = { scoreAndSortJobsWithEmbeddings };
