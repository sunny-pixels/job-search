const { extractTextFromPDF } = require("../services/pdfService");
const { analyzeResumeWithGroq } = require("../services/groqService");
const { fetchAllJobs } = require("../services/jobMatchingService");
const { scoreAndSortJobs } = require("../services/jobScoringService");
const { saveFile } = require("../services/fileStorageService");
const Resume = require("../models/Resume");
const crypto = require("crypto");

// In-memory store
let lastAnalyzedResume = null;
let cachedScoredJobs = null; // cache all scored jobs — cleared on new upload
let jobFetchProgress = { status: 'idle', message: '', progress: 0 }; // progress tracking

const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Generate file hash to check for duplicates
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    console.log("🔑 File hash:", fileHash);

    // Check if this file already exists in database
    const existingResume = await Resume.findOne({ fileHash });
    if (existingResume) {
      console.log("⚠️ Duplicate file detected, returning existing resume");
      
      // Update in-memory store with existing resume
      lastAnalyzedResume = {
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
          projects: [],
          internships: []
        },
        extractedTextPreview: existingResume.extractedData.summary?.substring(0, 200) || "",
        _id: existingResume._id
      };

      // Clear job cache for new analysis
      cachedScoredJobs = null;

      return res.json({
        message: "Resume already exists (duplicate detected)",
        _id: existingResume._id,
        analysis: lastAnalyzedResume.analysis,
        extracted_text_preview: lastAnalyzedResume.extractedTextPreview,
        duplicate: true
      });
    }

    console.log("📄 Extracting text from PDF...");
    const resumeText = await extractTextFromPDF(req.file.buffer);

    console.log("🤖 Analyzing resume with Groq...");
    const analysisData = await analyzeResumeWithGroq(resumeText);

    console.log("=== GROQ ANALYSIS ===");
    console.log(JSON.stringify(analysisData, null, 2));
    console.log("=====================");

    // Save PDF file to disk
    console.log("💾 Saving PDF file...");
    const { fileUrl, fileName } = await saveFile(req.file.buffer, req.file.originalname);

    // Extract name, email, phone from resume text
    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    // Extract name - typically the first line or first few words before contact info
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let extractedName = "Unknown";
    
    // Try to find name in first few lines (before email/phone)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Skip lines with email or phone
      if (line.includes('@') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) continue;
      // Skip common headers
      if (/resume|curriculum|vitae|cv/i.test(line)) continue;
      // If line looks like a name (2-4 words, mostly letters, capitalized)
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/.test(line)) {
        extractedName = line;
        break;
      }
    }
    
    // Parse education from Groq's education array
    const education = analysisData.education.map(edu => {
      const parts = edu.split(',').map(p => p.trim());
      return {
        degree: parts[0] || "",
        college: parts[1] || "",
        year: parts[2] || ""
      };
    });

    // Create resume document in MongoDB
    console.log("💾 Saving to MongoDB...");
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
        experience: [], // Can be populated if Groq returns experience data
        // Additional Groq analysis fields
        primary_roles: analysisData.primary_roles,
        programming_languages: analysisData.programming_languages,
        frameworks: analysisData.frameworks,
        tools: analysisData.tools,
        experience_level: analysisData.experience_level,
        experience_years: analysisData.experience_years,
        summary: analysisData.summary,
        job_keywords: analysisData.job_keywords
      }
    });

    await resumeDoc.save();
    console.log("✅ Resume saved to MongoDB with ID:", resumeDoc._id);

    // Clear job cache on new resume upload
    cachedScoredJobs = null;

    // Keep in-memory store for backward compatibility
    lastAnalyzedResume = {
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      analysis: analysisData,
      extractedTextPreview: resumeText.substring(0, 200),
      _id: resumeDoc._id
    };

    res.json({
      message: "Resume uploaded successfully",
      _id: resumeDoc._id,
      analysis: analysisData,
      extracted_text_preview: resumeText.substring(0, 200)
    });

  } catch (error) {
    console.error("Upload error:", error.message);
    
    // If it's a MongoDB duplicate key error, try to continue without saving
    if (error.code === 11000) {
      console.log("⚠️ MongoDB duplicate key error, continuing without DB save...");
      
      // Still return success with analysis data
      if (lastAnalyzedResume) {
        return res.json({
          message: "Resume uploaded successfully (not saved to DB due to duplicate)",
          analysis: lastAnalyzedResume.analysis,
          extracted_text_preview: lastAnalyzedResume.extractedTextPreview
        });
      }
    }
    
    res.status(500).json({ message: "Error analyzing resume", error: error.message });
  }
};

const getResumeData = async (req, res) => {
  try {
    // Try to get from database first
    const resumeDoc = await Resume.findOne().sort({ uploadedAt: -1 });
    
    if (!resumeDoc && !lastAnalyzedResume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    // Return database data if available, otherwise fall back to memory
    if (resumeDoc) {
      return res.json({ 
        message: "Resume data retrieved", 
        data: {
          _id: resumeDoc._id,
          filename: resumeDoc.fileName,
          uploadedAt: resumeDoc.uploadedAt,
          extractedData: resumeDoc.extractedData,
          fileUrl: resumeDoc.fileUrl
        }
      });
    }

    res.json({ message: "Resume data retrieved", data: lastAnalyzedResume });
  } catch (error) {
    console.error("Get resume error:", error.message);
    res.status(500).json({ message: "Error retrieving resume", error: error.message });
  }
};

const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ uploadedAt: -1 });
    
    res.json({
      message: "All resumes retrieved",
      count: resumes.length,
      resumes: resumes.map(r => ({
        _id: r._id,
        filename: r.fileName,
        uploadedAt: r.uploadedAt,
        extractedData: r.extractedData,
        fileUrl: r.fileUrl
      }))
    });
  } catch (error) {
    console.error("Get all resumes error:", error.message);
    res.status(500).json({ message: "Error retrieving resumes", error: error.message });
  }
};

const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resumeDoc = await Resume.findById(id);
    
    if (!resumeDoc) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({ 
      message: "Resume retrieved successfully", 
      data: {
        _id: resumeDoc._id,
        filename: resumeDoc.fileName,
        uploadedAt: resumeDoc.uploadedAt,
        extractedData: resumeDoc.extractedData,
        fileUrl: resumeDoc.fileUrl
      }
    });
  } catch (error) {
    console.error("Get resume by ID error:", error.message);
    res.status(500).json({ message: "Error retrieving resume", error: error.message });
  }
};

const getMatchingJobs = async (req, res) => {
  try {
    if (!lastAnalyzedResume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const { job_keywords, primary_roles } = lastAnalyzedResume.analysis;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // Serve from cache if available — instant response
    if (cachedScoredJobs) {
      console.log(`⚡ Serving page ${page} from cache (${cachedScoredJobs.length} jobs)`);
      return sendPaginatedResponse(res, cachedScoredJobs, page, limit, job_keywords, primary_roles);
    }

    // Update progress
    jobFetchProgress = { status: 'fetching', message: 'Searching jobs...', progress: 20 };
    
    console.log("🔍 Fetching jobs from JobSpy + Greenhouse...");
    const allJobs = await fetchAllJobs(job_keywords, primary_roles);
    console.log(`📊 Found ${allJobs.length} total jobs, scoring...`);

    // Update progress
    jobFetchProgress = { status: 'scoring', message: 'Scoring matches...', progress: 60 };
    
    const scoredJobs = scoreAndSortJobs(allJobs, lastAnalyzedResume.analysis);
    
    // Limit to top 100 jobs for performance
    const limitedJobs = scoredJobs.slice(0, 100);
    console.log(`✂️ Limited to top ${limitedJobs.length} jobs (from ${scoredJobs.length})`);

    // Store in cache for all subsequent page requests
    cachedScoredJobs = limitedJobs;
    console.log(`💾 Cached ${limitedJobs.length} scored jobs`);

    // Update progress
    jobFetchProgress = { status: 'complete', message: 'Complete', progress: 100 };

    return sendPaginatedResponse(res, limitedJobs, page, limit, job_keywords, primary_roles);

  } catch (error) {
    console.error("Jobs error:", error.message);
    jobFetchProgress = { status: 'error', message: error.message, progress: 0 };
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

const getJobProgress = (req, res) => {
  res.json(jobFetchProgress);
};

const sendPaginatedResponse = (res, scoredJobs, page, limit, job_keywords, primary_roles) => {
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
    search_criteria: { job_keywords, primary_roles }
  });
};

module.exports = { uploadResume, getResumeData, getAllResumes, getResumeById, getMatchingJobs, getJobProgress };
