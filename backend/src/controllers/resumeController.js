const { extractTextFromPDF } = require("../services/pdfService");
const { analyzeResumeWithOllama } = require("../services/ollamaService");
const { searchGreenhouseJobs } = require("../services/jobMatchingService");

// Store last analyzed resume data (in production, use database)
let lastAnalyzedResume = null;

const uploadResume = async (req, res) => {
  try {
    console.log("POST /api/resume/upload called");

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(req.file.buffer);
    console.log("Resume text extracted");
    console.log("=== EXTRACTED TEXT ===");
    console.log(resumeText.substring(0, 500));
    console.log("======================");

    // Analyze with Ollama
    console.log("Sending to Ollama for analysis...");
    const analysisData = await analyzeResumeWithOllama(resumeText);

    console.log("=== AI ANALYSIS (JSON) ===");
    console.log(JSON.stringify(analysisData, null, 2));
    console.log("==========================");

    // Store the analyzed data
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
    console.error("Error details:", error.message);
    res.status(500).json({
      message: "Error analyzing resume",
      error: error.message
    });
  }
};

const getResumeData = (req, res) => {
  if (!lastAnalyzedResume) {
    return res.status(404).json({ 
      message: "No resume uploaded yet. Please upload a resume first." 
    });
  }

  res.json({
    message: "Resume data retrieved successfully",
    data: lastAnalyzedResume
  });
};

const getMatchingJobs = async (req, res) => {
  try {
    if (!lastAnalyzedResume) {
      return res.status(404).json({ 
        message: "No resume uploaded yet. Please upload a resume first." 
      });
    }

    const { job_keywords, primary_roles } = lastAnalyzedResume.analysis;

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 12 jobs per page for nice grid layout

    console.log("🔍 Searching for matching jobs...");
    console.log("Job Keywords:", job_keywords);
    console.log("Primary Roles:", primary_roles);
    console.log(`📄 Page: ${page}, Limit: ${limit}`);

    // Search for jobs using greenhouse matcher (gets all jobs)
    const allJobs = await searchGreenhouseJobs(job_keywords, primary_roles);

    // Calculate pagination
    const totalJobs = allJobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = allJobs.slice(startIndex, endIndex);

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
      jobs: paginatedJobs,
      search_criteria: {
        job_keywords,
        primary_roles
      }
    });

  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({
      message: "Error fetching matching jobs",
      error: error.message
    });
  }
};

module.exports = {
  uploadResume,
  getResumeData,
  getMatchingJobs
};