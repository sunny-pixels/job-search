/**
 * Embedding-Based Resume Controller
 * NEW controller for embedding-based job matching (does not modify existing aiResumeController.js)
 */

const { extractTextFromPDF, extractTextFromFile } = require("../services/pdfService");
const { analyzeResumeWithGroq } = require("../services/groqService");
const { searchMultipleQueries, buildSearchQueries, enrichJobsWithDetails } = require("../services/jsearchService");
const { matchJobsWithEmbeddings } = require("../services/embeddingMatcherService");
const { checkServiceHealth } = require("../services/embeddingClient");
const { saveFile } = require("../services/fileStorageService");
const Resume = require("../models/Resume");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;

// ✅ SESSION-BASED STORAGE (supports concurrent users)
const sessionStore = new Map();

// Session configuration
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create session
 */
const getSession = (sessionId) => {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      lastAnalyzedResume: null,
      cachedScoredJobs: null,
      jobFetchProgress: { status: 'idle', message: '', progress: 0 },
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    });
  }
  
  const session = sessionStore.get(sessionId);
  session.lastAccessedAt = Date.now();
  return session;
};

/**
 * Clear session data
 */
const clearSession = (sessionId) => {
  sessionStore.delete(sessionId);
  console.log(`🗑️ [Session] Cleared session: ${sessionId}`);
};

/**
 * Cleanup expired sessions
 */
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastAccessedAt > SESSION_TTL) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 [Session] Cleaned ${cleaned} expired sessions`);
  }
};

// Start cleanup interval
setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

/**
 * Get session ID from request
 */
const getSessionId = (req) => {
  return req.headers['x-session-id'] || req.query.sessionId || 'default';
};

/**
 * Upload resume and get embedding-based job matches
 */
const uploadResumeEmbedding = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    
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
    console.log(`🔑 [Embedding] File hash: ${fileHash} (Session: ${sessionId})`);

    // Check for duplicate
    const existingResume = await Resume.findOne({ fileHash });
    if (existingResume) {
      console.log(`⚠️ [Embedding] Duplicate detected: ${existingResume._id} (Session: ${sessionId})`);
      
      // Determine new file type
      const newFileType = req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'pdf';
      
      // Extract text from the NEW upload
      console.log(`📄 [Embedding] Extracting text from new ${newFileType.toUpperCase()} upload...`);
      const resumeText = await extractTextFromFile(req.file.buffer, newFileType);
      
      // ALWAYS re-analyze with Groq to get latest parsing logic
      console.log("🔄 [Embedding] Re-analyzing resume with latest Groq logic...");
      const analysisData = await analyzeResumeWithGroq(resumeText);
      
      // If uploading DOCX (regardless of what existed before), save it
      if (newFileType === 'docx') {
        console.log("📄 [Embedding] Saving DOCX file for format preservation...");
        const { fileUrl, fileName, fileType } = await saveFile(req.file.buffer, req.file.originalname);
        
        // Update database with new file info AND new analysis
        existingResume.fileUrl = fileUrl;
        existingResume.fileName = fileName;
        existingResume.fileType = fileType;
        existingResume.extractedData.resumeFullText = resumeText;
        existingResume.extractedData.primary_roles = analysisData.primary_roles;
        existingResume.extractedData.skills = analysisData.skills;
        existingResume.extractedData.job_keywords = analysisData.job_keywords;
        existingResume.extractedData.experience_level = analysisData.experience_level;
        existingResume.extractedData.experience_years = analysisData.experience_years;
        existingResume.extractedData.programming_languages = analysisData.programming_languages;
        existingResume.extractedData.frameworks = analysisData.frameworks;
        existingResume.extractedData.tools = analysisData.tools;
        existingResume.extractedData.summary = analysisData.summary;
        await existingResume.save();
        console.log("✅ [Embedding] Updated to DOCX file with fresh analysis");
      } else if (!existingResume.extractedData.resumeFullText || existingResume.extractedData.resumeFullText.trim().length === 0) {
        // For PDF, update text and analysis if missing
        existingResume.extractedData.resumeFullText = resumeText;
        existingResume.extractedData.primary_roles = analysisData.primary_roles;
        existingResume.extractedData.skills = analysisData.skills;
        existingResume.extractedData.job_keywords = analysisData.job_keywords;
        existingResume.extractedData.experience_level = analysisData.experience_level;
        existingResume.extractedData.experience_years = analysisData.experience_years;
        existingResume.extractedData.programming_languages = analysisData.programming_languages;
        existingResume.extractedData.frameworks = analysisData.frameworks;
        existingResume.extractedData.tools = analysisData.tools;
        existingResume.extractedData.summary = analysisData.summary;
        await existingResume.save();
        console.log("✅ [Embedding] Updated resume text with fresh analysis");
      } else {
        // Just update the analysis data (keep existing file)
        existingResume.extractedData.primary_roles = analysisData.primary_roles;
        existingResume.extractedData.skills = analysisData.skills;
        existingResume.extractedData.job_keywords = analysisData.job_keywords;
        existingResume.extractedData.experience_level = analysisData.experience_level;
        existingResume.extractedData.experience_years = analysisData.experience_years;
        existingResume.extractedData.programming_languages = analysisData.programming_languages;
        existingResume.extractedData.frameworks = analysisData.frameworks;
        existingResume.extractedData.tools = analysisData.tools;
        existingResume.extractedData.summary = analysisData.summary;
        await existingResume.save();
        console.log("✅ [Embedding] Updated analysis with latest Groq logic");
      }
      
      session.lastAnalyzedResume = {
        filename: existingResume.fileName,
        uploadedAt: existingResume.uploadedAt.toISOString(),
        analysis: analysisData,
        resumeFullText: resumeText,
        _id: existingResume._id
      };

      session.cachedScoredJobs = null;

      return res.json({
        message: "Resume already exists (duplicate detected)",
        _id: existingResume._id,
        analysis: session.lastAnalyzedResume.analysis,
        duplicate: true,
        matching_method: "embedding",
        sessionId: sessionId
      });
    }

    console.log("📄 [Embedding] Extracting text from file...");
    
    // Determine file type from mimetype
    const detectedFileType = req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'pdf';
    console.log(`📄 [Embedding] File type detected: ${detectedFileType.toUpperCase()}`);
    
    const resumeText = await extractTextFromFile(req.file.buffer, detectedFileType);

    console.log("🤖 [Embedding] Analyzing resume with Groq...");
    const analysisData = await analyzeResumeWithGroq(resumeText);

    console.log("💾 [Embedding] Saving file...");
    const { fileUrl, fileName, fileType } = await saveFile(req.file.buffer, req.file.originalname);

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
      fileType,
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
        resumeFullText: resumeText
      }
    });

    await resumeDoc.save();
    console.log(`✅ [Embedding] Resume saved with ID: ${resumeDoc._id} (Session: ${sessionId})`);

    session.cachedScoredJobs = null;

    session.lastAnalyzedResume = {
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
      matching_method: "embedding",
      sessionId: sessionId
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
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    
    if (!session.lastAnalyzedResume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Serve from cache if available
    if (session.cachedScoredJobs) {
      console.log(`⚡ [Embedding] Serving page ${page} from cache (${session.cachedScoredJobs.length} jobs) - Session: ${sessionId}`);
      return sendPaginatedResponseEmbedding(res, session.cachedScoredJobs, page, limit, sessionId);
    }

    // Check if embedding service is available
    const serviceAvailable = await checkServiceHealth();
    if (!serviceAvailable) {
      return res.status(503).json({ 
        message: "Embedding service is unavailable. Please try again later.",
        error: "EMBEDDING_SERVICE_DOWN"
      });
    }

    session.jobFetchProgress = { status: 'fetching', message: 'Searching jobs with JSearch API...', progress: 20 };

    console.log(`🔍 [Embedding] Fetching jobs from JSearch API... (Session: ${sessionId})`);
    const searchData = buildSearchQueries(session.lastAnalyzedResume.analysis);
    
    let allJobs;
    try {
      allJobs = await searchMultipleQueries(searchData.queries, {
        num_pages: 2,
        date_posted: 'week',
        country: 'us',
        job_requirements: searchData.requirements,
        filterByPlatform: true  // ← Search ALL platforms for EACH job title
      });
    } catch (error) {
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        session.jobFetchProgress = { status: 'error', message: 'Rate limit exceeded', progress: 0 };
        return res.status(429).json({ 
          message: "RapidAPI rate limit exceeded. Please try again later.",
          error: "RATE_LIMIT_EXCEEDED",
          sessionId: sessionId
        });
      }
      throw error;
    }

    console.log(`📊 [Embedding] Found ${allJobs.length} jobs from JSearch (Session: ${sessionId})`);

    if (allJobs.length === 0) {
      return res.json({
        message: "No jobs found",
        jobs: [],
        pagination: { current_page: 1, total_pages: 0, total_jobs: 0 },
        matching_method: "embedding",
        sessionId: sessionId
      });
    }

    session.jobFetchProgress = { status: 'enriching', message: 'Enriching jobs with detailed information...', progress: 40 };

    console.log("📋 [Embedding] Enriching jobs with detailed highlights...");
    const enrichedJobs = await enrichJobsWithDetails(allJobs, {
      batchSize: 5,      // Reduced from 20 to match 5 req/sec rate limit
      delayMs: 1000      // Increased from 200ms to 1000ms (1 second between batches)
    });

    session.jobFetchProgress = { status: 'matching', message: 'Computing embedding similarities...', progress: 70 };

    console.log("🧠 [Embedding] Matching jobs with embeddings...");
    const scoredJobs = await matchJobsWithEmbeddings(
      session.lastAnalyzedResume.resumeFullText,
      enrichedJobs,
      session.lastAnalyzedResume.analysis,
      {
        topN: 120,
        threshold: 40,
        batchSize: 40
      }
    );

    console.log(`✂️ [Embedding] Matched ${scoredJobs.length} jobs (Session: ${sessionId})`);

    session.cachedScoredJobs = scoredJobs;
    console.log(`💾 [Embedding] Cached ${scoredJobs.length} scored jobs (Session: ${sessionId})`);

    session.jobFetchProgress = { status: 'complete', message: 'Complete', progress: 100 };

    return sendPaginatedResponseEmbedding(res, scoredJobs, page, limit, sessionId);

  } catch (error) {
    const sessionId = getSessionId(req);
    const session = getSession(sessionId);
    console.error("[Embedding] Jobs error:", error.message);
    session.jobFetchProgress = { status: 'error', message: error.message, progress: 0 };
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

/**
 * Get job fetch progress
 */
const getJobProgressEmbedding = (req, res) => {
  const sessionId = getSessionId(req);
  const session = getSession(sessionId);
  res.json(session.jobFetchProgress);
};

/**
 * Clear session data
 */
const clearSessionData = (req, res) => {
  const sessionId = getSessionId(req);
  clearSession(sessionId);
  res.json({ message: "Session cleared successfully", sessionId });
};

/**
 * Send paginated response
 */
const sendPaginatedResponseEmbedding = (res, scoredJobs, page, limit, sessionId) => {
  const totalJobs = scoredJobs.length;
  const totalPages = Math.ceil(totalJobs / limit);
  const startIndex = (page - 1) * limit;
  const paginatedJobs = scoredJobs.slice(startIndex, startIndex + limit);

  console.log(`📄 [Pagination] Page ${page}, Limit ${limit}, Start ${startIndex}, End ${startIndex + limit}`);
  console.log(`📄 [Pagination] Total jobs: ${totalJobs}, Returning: ${paginatedJobs.length} jobs`);

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
    jobs: paginatedJobs,
    sessionId: sessionId
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

/**
 * Download original resume file
 * GET /api/embedding-matcher/download/:id
 */
const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 [Download] Request for original resume:', id);

    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const filePath = path.join(__dirname, '../../', resume.fileUrl);
    console.log('📥 [Download] File path:', filePath);

    // Check if file exists
    await fs.access(filePath);

    // Set headers for download
    res.setHeader('Content-Type', resume.fileType === 'docx' 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Send file
    res.sendFile(filePath);
    console.log('✅ [Download] File sent successfully');

  } catch (error) {
    console.error('❌ [Download] Error:', error);
    res.status(500).json({ 
      message: "Error downloading resume", 
      error: error.message 
    });
  }
};

module.exports = {
  uploadResumeEmbedding,
  getMatchingJobsEmbedding,
  getJobProgressEmbedding,
  clearSessionData,
  getAllResumes,
  downloadResume
};
