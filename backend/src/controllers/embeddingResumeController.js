/**
 * Embedding-Based Resume Controller
 * NEW controller for embedding-based job matching (does not modify existing aiResumeController.js)
 */

const { extractTextFromPDF } = require("../services/pdfService");
const { analyzeResumeWithGroq } = require("../services/groqService");
const { searchMultipleQueries, buildSearchQueries, enrichJobsWithDetails } = require("../services/jsearchService");
const { matchJobsWithEmbeddings } = require("../services/embeddingMatcherService");
const { checkServiceHealth } = require("../services/embeddingClient");
const { saveFile } = require("../services/fileStorageService");
const Resume = require("../models/Resume");
const crypto = require("crypto");

// In-memory store for embedding-based system
let lastAnalyzedResumeEmbedding = null;
let cachedScoredJobsEmbedding = null;
let jobFetchProgressEmbedding = { status: 'idle', message: '', progress: 0 };

/**
 * Upload resume and get embedding-based job matches
 */
const uploadResumeEmbedding = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Check if embedding service is available
    const serviceAvailable = await checkServiceHealth();
    if (!serviceAvailable) {
      return res.status(503).json({ 
        message: "Embedding service is unavailable. Please try again later or use AI-based matching.",
        error: "EMBEDDING_SERVICE_DOWN"
      });
    }

    // Generate file hash
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    console.log("🔑 [Embedding] File hash:", fileHash);

    // Check for duplicate
    const existingResume = await Resume.findOne({ fileHash });
    if (existingResume) {
      console.log("⚠️ [Embedding] Duplicate detected");
      
      // Check if resumeFullText exists, if not, re-extract it
      let resumeFullText = existingResume.extractedData.resumeFullText;
      
      if (!resumeFullText || resumeFullText.trim().length === 0) {
        console.log("📄 [Embedding] Resume text missing, re-extracting from PDF...");
        try {
          resumeFullText = await extractTextFromPDF(req.file.buffer);
          
          // Update the database with the full text
          existingResume.extractedData.resumeFullText = resumeFullText;
          await existingResume.save();
          console.log("✅ [Embedding] Resume text updated in database");
        } catch (error) {
          console.error("❌ [Embedding] Failed to extract text:", error.message);
          return res.status(500).json({ 
            message: "Failed to process resume text",
            error: error.message 
          });
        }
      }
      
      lastAnalyzedResumeEmbedding = {
        filename: existingResume.fileName,
        uploadedAt: existingResume.uploadedAt.toISOString(),
        analysis: {
          primary_roles: existingResume.extractedData.primary_roles,
          skills: existingResume.extractedData.skills,
          job_keywords: existingResume.extractedData.job_keywords,
          experience_level: existingResume.extractedData.experience_level,
          experience_years: existingResume.extractedData.experience_years,
          programming_languages: existingResume.extractedData.programming_languages,
          frameworks: existingResume.extractedData.frameworks,
          tools: existingResume.extractedData.tools,
          summary: existingResume.extractedData.summary,
          education: existingResume.extractedData.education.map(e => `${e.degree}, ${e.college}, ${e.year}`),
        },
        resumeFullText: resumeFullText,
        _id: existingResume._id
      };

      cachedScoredJobsEmbedding = null;

      return res.json({
        message: "Resume already exists (duplicate detected)",
        _id: existingResume._id,
        analysis: lastAnalyzedResumeEmbedding.analysis,
        duplicate: true,
        matching_method: "embedding"
      });
    }

    console.log("📄 [Embedding] Extracting text from PDF...");
    const resumeText = await extractTextFromPDF(req.file.buffer);

    console.log("🤖 [Embedding] Analyzing resume with Groq...");
    const analysisData = await analyzeResumeWithGroq(resumeText);

    console.log("💾 [Embedding] Saving PDF file...");
    const { fileUrl, fileName } = await saveFile(req.file.buffer, req.file.originalname);

    // Extract name, email, phone
    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let extractedName = "Unknown";
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.includes('@') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) continue;
      if (/resume|curriculum|vitae|cv/i.test(line)) continue;
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/.test(line)) {
        extractedName = line;
        break;
      }
    }
    
    const education = analysisData.education.map(edu => {
      const parts = edu.split(',').map(p => p.trim());
      return {
        degree: parts[0] || "",
        college: parts[1] || "",
        year: parts[2] || ""
      };
    });

    console.log("💾 [Embedding] Saving to MongoDB...");
    const resumeDoc = new Resume({
      fileUrl,
      fileName,
      fileHash,
      extractedData: {
        name: extractedName,
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        skills: analysisData.skills,
        education,
        experience: [],
        primary_roles: analysisData.primary_roles,
        programming_languages: analysisData.programming_languages,
        frameworks: analysisData.frameworks,
        tools: analysisData.tools,
        experience_level: analysisData.experience_level,
        experience_years: analysisData.experience_years,
        summary: analysisData.summary,
        job_keywords: analysisData.job_keywords,
        resumeFullText: resumeText // Store full text for embedding matching
      }
    });

    await resumeDoc.save();
    console.log("✅ [Embedding] Resume saved with ID:", resumeDoc._id);

    cachedScoredJobsEmbedding = null;

    lastAnalyzedResumeEmbedding = {
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      analysis: analysisData,
      resumeFullText: resumeText,
      _id: resumeDoc._id
    };

    res.json({
      message: "Resume uploaded successfully (Embedding mode)",
      _id: resumeDoc._id,
      analysis: analysisData,
      matching_method: "embedding"
    });

  } catch (error) {
    console.error("[Embedding] Upload error:", error.message);
    res.status(500).json({ message: "Error analyzing resume", error: error.message });
  }
};

/**
 * Get embedding-based job matches
 */
const getMatchingJobsEmbedding = async (req, res) => {
  try {
    if (!lastAnalyzedResumeEmbedding) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Serve from cache if available
    if (cachedScoredJobsEmbedding) {
      console.log(`⚡ [Embedding] Serving page ${page} from cache (${cachedScoredJobsEmbedding.length} jobs)`);
      return sendPaginatedResponseEmbedding(res, cachedScoredJobsEmbedding, page, limit);
    }

    // Check if embedding service is available
    const serviceAvailable = await checkServiceHealth();
    if (!serviceAvailable) {
      return res.status(503).json({ 
        message: "Embedding service is unavailable. Please try again later.",
        error: "EMBEDDING_SERVICE_DOWN"
      });
    }

    jobFetchProgressEmbedding = { status: 'fetching', message: 'Searching jobs with JSearch API...', progress: 20 };

    console.log("🔍 [Embedding] Fetching jobs from JSearch API...");
    const searchData = buildSearchQueries(lastAnalyzedResumeEmbedding.analysis);
    
    const allJobs = await searchMultipleQueries(searchData.queries, {
      num_pages: 5, // 1 page = 10 jobs per query - reduced to avoid rate limits
      date_posted: 'month',
      country: 'us',
      job_requirements: searchData.requirements // Filter by experience level
    });

    console.log(`📊 [Embedding] Found ${allJobs.length} jobs from JSearch`);

    if (allJobs.length === 0) {
      return res.json({
        message: "No jobs found",
        jobs: [],
        pagination: { current_page: 1, total_pages: 0, total_jobs: 0 },
        matching_method: "embedding"
      });
    }

    jobFetchProgressEmbedding = { status: 'enriching', message: 'Enriching jobs with detailed information...', progress: 40 };

    console.log("📋 [Embedding] Enriching jobs with detailed highlights...");
    const enrichedJobs = await enrichJobsWithDetails(allJobs, {
      batchSize: 10,
      delayMs: 200
    });

    jobFetchProgressEmbedding = { status: 'matching', message: 'Computing embedding similarities...', progress: 70 };

    console.log("🧠 [Embedding] Matching jobs with embeddings...");
    const scoredJobs = await matchJobsWithEmbeddings(
      lastAnalyzedResumeEmbedding.resumeFullText,
      enrichedJobs, // Use enriched jobs instead of allJobs
      lastAnalyzedResumeEmbedding.analysis, // Pass resume analysis for skills & experience filtering
      {
        topN: 120,
        threshold: 40, // Minimum final score threshold (40% = reasonable match)
        batchSize: 20
      }
    );

    console.log(`✂️ [Embedding] Matched ${scoredJobs.length} jobs`);

    cachedScoredJobsEmbedding = scoredJobs;
    console.log(`💾 [Embedding] Cached ${scoredJobs.length} scored jobs`);

    jobFetchProgressEmbedding = { status: 'complete', message: 'Complete', progress: 100 };

    return sendPaginatedResponseEmbedding(res, scoredJobs, page, limit);

  } catch (error) {
    console.error("[Embedding] Jobs error:", error.message);
    jobFetchProgressEmbedding = { status: 'error', message: error.message, progress: 0 };
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

/**
 * Get job fetch progress
 */
const getJobProgressEmbedding = (req, res) => {
  res.json(jobFetchProgressEmbedding);
};

/**
 * Send paginated response
 */
const sendPaginatedResponseEmbedding = (res, scoredJobs, page, limit) => {
  const totalJobs = scoredJobs.length;
  const totalPages = Math.ceil(totalJobs / limit);
  const startIndex = (page - 1) * limit;
  const paginatedJobs = scoredJobs.slice(startIndex, startIndex + limit);

  const scoreRanges = {
    excellent: scoredJobs.filter(j => j.embedding_match_score >= 90).length,
    great: scoredJobs.filter(j => j.embedding_match_score >= 80 && j.embedding_match_score < 90).length,
    good: scoredJobs.filter(j => j.embedding_match_score >= 70 && j.embedding_match_score < 80).length,
    fair: scoredJobs.filter(j => j.embedding_match_score >= 60 && j.embedding_match_score < 70).length,
    low: scoredJobs.filter(j => j.embedding_match_score < 60).length
  };

  res.json({
    message: "Jobs retrieved successfully (Embedding-based)",
    matching_method: "embedding",
    cached: true,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_jobs: totalJobs,
      jobs_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1
    },
    score_distribution: scoreRanges,
    jobs: paginatedJobs
  });
};

/**
 * Get all resumes from database
 */
const getAllResumes = async (req, res) => {
  try {
    // Get all resumes, sorted by upload date (newest first)
    // Group by fileHash to avoid duplicates
    const resumes = await Resume.aggregate([
      {
        $sort: { uploadedAt: -1 }
      },
      {
        $group: {
          _id: "$fileHash",
          doc: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$doc" }
      },
      {
        $project: {
          fileHash: 0,
          "extractedData.resumeFullText": 0
        }
      },
      {
        $sort: { uploadedAt: -1 }
      }
    ]);
    
    res.json({
      message: "Resumes retrieved successfully",
      count: resumes.length,
      resumes
    });
  } catch (error) {
    console.error("Get all resumes error:", error.message);
    res.status(500).json({ message: "Error retrieving resumes", error: error.message });
  }
};

module.exports = {
  uploadResumeEmbedding,
  getMatchingJobsEmbedding,
  getJobProgressEmbedding,
  getAllResumes
};
