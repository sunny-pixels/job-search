const { extractTextFromPDF } = require("../services/pdfService");
const { analyzeResumeWithGroq } = require("../services/groqService");
const { fetchAllJobs } = require("../services/jobMatchingService");
const { scoreAndSortJobsWithEmbeddings } = require("../services/ollamaService");

// In-memory store (replace with DB in production)
let lastAnalyzedResume = null;

const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    console.log("📄 Extracting text from PDF...");
    const resumeText = await extractTextFromPDF(req.file.buffer);

    console.log("🤖 Analyzing resume with Groq...");
    const analysisData = await analyzeResumeWithGroq(resumeText);

    console.log("=== GROQ ANALYSIS ===");
    console.log(JSON.stringify(analysisData, null, 2));
    console.log("=====================");

    lastAnalyzedResume = {
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      analysis: analysisData,
      extractedTextPreview: resumeText.substring(0, 200)
    };

    res.json({
      message: "Resume uploaded successfully",
      analysis: analysisData,
      extracted_text_preview: resumeText.substring(0, 200)
    });

  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Error analyzing resume", error: error.message });
  }
};

const getResumeData = (req, res) => {
  if (!lastAnalyzedResume) {
    return res.status(404).json({ message: "No resume uploaded yet." });
  }
  res.json({ message: "Resume data retrieved", data: lastAnalyzedResume });
};

const getMatchingJobs = async (req, res) => {
  try {
    if (!lastAnalyzedResume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const { job_keywords, primary_roles } = lastAnalyzedResume.analysis;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    console.log("🔍 Fetching jobs from JobSpy + Greenhouse...");

    // Fetch from both sources in parallel — JobSpy first priority
    const allJobs = await fetchAllJobs(job_keywords, primary_roles);
    console.log(`📊 Found ${allJobs.length} total jobs, scoring...`);

    // Score with embeddings (falls back to rule-based if Ollama unavailable)
    const scoredJobs = await scoreAndSortJobsWithEmbeddings(allJobs, lastAnalyzedResume.analysis);

    // Paginate
    const totalJobs = scoredJobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const startIndex = (page - 1) * limit;
    const paginatedJobs = scoredJobs.slice(startIndex, startIndex + limit);

    const scoreRanges = {
      excellent: scoredJobs.filter(j => j.match_score >= 90).length,
      great: scoredJobs.filter(j => j.match_score >= 80 && j.match_score < 90).length,
      good: scoredJobs.filter(j => j.match_score >= 70 && j.match_score < 80).length,
      fair: scoredJobs.filter(j => j.match_score >= 60 && j.match_score < 70).length,
      low: scoredJobs.filter(j => j.match_score < 60).length
    };

    res.json({
      message: "Jobs retrieved successfully",
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_jobs: totalJobs,
        jobs_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      score_distribution: scoreRanges,
      jobs: paginatedJobs,
      search_criteria: { job_keywords, primary_roles }
    });

  } catch (error) {
    console.error("Jobs error:", error.message);
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

module.exports = { uploadResume, getResumeData, getMatchingJobs };
