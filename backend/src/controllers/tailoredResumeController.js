/**
 * Tailored Resume Controller
 * Handles AI-powered resume tailoring for specific jobs
 */

const TailoredResume = require("../models/TailoredResume");
const Resume = require("../models/Resume");
const {
  tailorResumeContent,
  generateDocx,
  saveDocxFile,
  estimateImprovedScore
} = require("../services/resumeTailoringService");
const { checkPythonServiceHealth, tailorDocxWithPython } = require("../services/pythonTailorService");
const { checkGeminiServiceHealth, tailorDocxWithGemini } = require("../services/geminiTailorService");
const path = require("path");
const fs = require("fs").promises;

/**
 * Create a tailored resume for a specific job
 * POST /api/tailored-resume/create
 */
const createTailoredResume = async (req, res) => {
  try {
    const { resumeId, jobData, originalScore } = req.body;

    if (!resumeId || !jobData) {
      return res.status(400).json({ 
        message: "Missing required fields: resumeId and jobData" 
      });
    }

    console.log('🎨 [Tailored] Creating tailored resume for job:', jobData.job_title);

    // Get original resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Check if we have a DOCX file for this resume
    const isDocx = resume.fileType === 'docx';
    
    if (isDocx) {
      console.log('📄 [Tailored] DOCX file detected - checking Gemini service...');
      
      // Check if Gemini service is available (preferred)
      const geminiAvailable = await checkGeminiServiceHealth();
      
      if (geminiAvailable) {
        console.log('🤖 [Tailored] Using Gemini service for intelligent tailoring');
        
        try {
          // Get original DOCX file path
          const docxPath = path.join(__dirname, '../../', resume.fileUrl);
          
          // Tailor using Gemini service
          const tailoredBuffer = await tailorDocxWithGemini(docxPath, jobData);
          
          // Save tailored DOCX
          const timestamp = Date.now();
          const filename = `tailored_${resumeId}_${jobData.job_id}_${timestamp}.docx`;
          const docxUrl = await saveDocxFile(tailoredBuffer, filename);
          
          // Estimate improved score
          const estimatedScore = estimateImprovedScore(originalScore || 70);
          
          // Save to database
          const modifications = [
            { section: "skills", type: "added", description: "Added relevant skills from job description" },
            { section: "experience", type: "enhanced", description: "Enhanced bullets with job-relevant keywords" },
            { section: "content", type: "optimized", description: "Optimized content using Gemini AI" }
          ];
          
          const tailoredResume = new TailoredResume({
            originalResumeId: resumeId,
            jobId: jobData.job_id,
            jobTitle: jobData.job_title,
            company: jobData.employer_name,
            jobDescription: jobData.job_description?.substring(0, 2000),
            tailoredContent: {
              summary: "Content tailored using Gemini AI",
              skills: [],
              experience: [],
              projects: [],
              education: []
            },
            modifications: modifications.map(m => ({
              section: String(m.section),
              type: String(m.type),
              description: String(m.description)
            })),
            docxUrl,
            originalScore: originalScore || 70,
            estimatedScore
          });
          
          await tailoredResume.save();
          console.log('✅ [Tailored] Saved Gemini-tailored resume:', tailoredResume._id);
          
          return res.json({
            message: "Resume tailored successfully with Gemini AI",
            tailoredResume,
            scoreImprovement: estimatedScore - (originalScore || 70),
            method: "gemini-service",
            formattingPreserved: true
          });
          
        } catch (geminiError) {
          console.error('❌ [Tailored] Gemini service error:', geminiError.message);
          console.log('⚠️ [Tailored] Falling back to Python service');
          // Fall through to Python service
        }
      }
      
      // Fallback: Try Python service
      console.log('📄 [Tailored] Checking Python service...');
      
      // Check if Python service is available
      const pythonAvailable = await checkPythonServiceHealth();
      
      if (pythonAvailable) {
        console.log('🐍 [Tailored] Using Python service for format-preserving tailoring');
        
        try {
          // Get original DOCX file path
          const docxPath = path.join(__dirname, '../../', resume.fileUrl);
          
          // Tailor using Python service
          const tailoredBuffer = await tailorDocxWithPython(docxPath, jobData);
          
          // Save tailored DOCX
          const timestamp = Date.now();
          const filename = `tailored_${resumeId}_${jobData.job_id}_${timestamp}.docx`;
          const docxUrl = await saveDocxFile(tailoredBuffer, filename);
          
          // Estimate improved score
          const estimatedScore = estimateImprovedScore(originalScore || 70);
          
          // Save to database
          const modifications = [
            { section: "skills", type: "added", description: "Added relevant skills from job description" },
            { section: "experience", type: "modified", description: "Enhanced bullets with job-relevant keywords" },
            { section: "content", type: "optimized", description: "Optimized content while preserving formatting" }
          ];
          
          const tailoredResume = new TailoredResume({
            originalResumeId: resumeId,
            jobId: jobData.job_id,
            jobTitle: jobData.job_title,
            company: jobData.employer_name,
            jobDescription: jobData.job_description?.substring(0, 2000),
            tailoredContent: {
              summary: "Content tailored using Python service",
              skills: [],
              experience: [],
              projects: [],
              education: []
            },
            modifications: modifications.map(m => ({
              section: String(m.section),
              type: String(m.type),
              description: String(m.description)
            })),
            docxUrl,
            originalScore: originalScore || 70,
            estimatedScore
          });
          
          await tailoredResume.save();
          console.log('✅ [Tailored] Saved Python-tailored resume:', tailoredResume._id);
          
          return res.json({
            message: "Resume tailored successfully with formatting preserved",
            tailoredResume,
            scoreImprovement: estimatedScore - (originalScore || 70),
            method: "python-service",
            formattingPreserved: true
          });
          
        } catch (pythonError) {
          console.error('❌ [Tailored] Python service error:', pythonError.message);
          console.log('⚠️ [Tailored] Falling back to Node.js method');
          // Fall through to Node.js method
        }
      } else {
        console.log('⚠️ [Tailored] Python service not available, using Node.js fallback');
      }
    }
    
    // Fallback: Use Node.js method (for PDFs or if Python service fails)
    console.log('⚠️ [Tailored] Using Node.js method (generates new DOCX)');
    console.log('💡 [Tailored] For best results with formatting, ensure Python service is running');

    // Prepare resume data for AI
    const resumeData = {
      name: resume.extractedData.name,
      email: resume.extractedData.email,
      phone: resume.extractedData.phone,
      summary: resume.extractedData.summary,
      skills: resume.extractedData.skills,
      experience: resume.extractedData.experience || [],
      projects: resume.extractedData.projects || [],
      education: resume.extractedData.education.map(e => 
        `${e.degree}, ${e.college}, ${e.year}`
      )
    };

    // Tailor content using AI
    console.log('🤖 [Tailored] Calling AI to tailor content...');
    const tailoredData = await tailorResumeContent(resumeData, jobData);
    
    // Create modifications manually
    const modifications = [
      { section: "summary", type: "modified", description: "Tailored professional summary for job requirements" },
      { section: "skills", type: "reordered", description: "Prioritized job-relevant skills" },
      { section: "experience", type: "modified", description: "Enhanced experience bullets with relevant keywords" }
    ];
    
    // Explicitly construct tailoredContent
    const tailoredContentClean = {
      summary: tailoredData.summary,
      skills: tailoredData.skills,
      experience: tailoredData.experience,
      projects: tailoredData.projects,
      education: tailoredData.education
    };

    // Generate DOCX file
    console.log('📄 [Tailored] Generating DOCX file...');
    const docxBuffer = await generateDocx(tailoredContentClean, resumeData);

    // Save file
    const timestamp = Date.now();
    const filename = `tailored_${resumeId}_${jobData.job_id}_${timestamp}.docx`;
    const docxUrl = await saveDocxFile(docxBuffer, filename);

    // Estimate improved score
    const estimatedScore = estimateImprovedScore(originalScore || 70);

    // Save to database
    const docData = {
      originalResumeId: resumeId,
      jobId: jobData.job_id,
      jobTitle: jobData.job_title,
      company: jobData.employer_name,
      jobDescription: jobData.job_description?.substring(0, 2000),
      tailoredContent: tailoredContentClean,
      modifications: modifications.map(m => ({
        section: String(m.section),
        type: String(m.type),
        description: String(m.description)
      })),
      docxUrl,
      originalScore: originalScore || 70,
      estimatedScore
    };
    
    const tailoredResume = new TailoredResume(docData);
    await tailoredResume.save();
    console.log('✅ [Tailored] Saved to database:', tailoredResume._id);

    res.json({
      message: "Resume tailored successfully",
      tailoredResume,
      scoreImprovement: estimatedScore - (originalScore || 70),
      note: "For best results with formatting preservation, upload DOCX files"
    });

  } catch (error) {
    console.error('❌ [Tailored] Error:', error.message);
    res.status(500).json({ 
      message: "Error creating tailored resume", 
      error: error.message 
    });
  }
};

/**
 * Get a specific tailored resume
 * GET /api/tailored-resume/:id
 */
const getTailoredResume = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tailoredResume = await TailoredResume.findById(id)
      .populate('originalResumeId', 'fileName extractedData.name');

    if (!tailoredResume) {
      return res.status(404).json({ message: "Tailored resume not found" });
    }

    res.json({
      message: "Tailored resume retrieved",
      tailoredResume
    });

  } catch (error) {
    console.error('❌ [Tailored] Get error:', error.message);
    res.status(500).json({ 
      message: "Error retrieving tailored resume", 
      error: error.message 
    });
  }
};

/**
 * Get all tailored versions for a resume
 * GET /api/tailored-resume/by-resume/:resumeId
 */
const getTailoredResumesByOriginal = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const tailoredResumes = await TailoredResume.find({ 
      originalResumeId: resumeId 
    }).sort({ createdAt: -1 });

    res.json({
      message: "Tailored resumes retrieved",
      count: tailoredResumes.length,
      tailoredResumes
    });

  } catch (error) {
    console.error('❌ [Tailored] Get by resume error:', error.message);
    res.status(500).json({ 
      message: "Error retrieving tailored resumes", 
      error: error.message 
    });
  }
};

/**
 * Download tailored resume DOCX file
 * GET /api/tailored-resume/download/:id
 */
const downloadTailoredResume = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 [Download] Request received for tailored resume:', id);

    const tailoredResume = await TailoredResume.findById(id);
    if (!tailoredResume) {
      console.error('❌ [Download] Tailored resume not found in database:', id);
      return res.status(404).json({ message: "Tailored resume not found" });
    }

    const filePath = path.join(__dirname, '../../', tailoredResume.docxUrl);
    console.log('📥 [Download] Database record found');
    console.log('📥 [Download] File URL from DB:', tailoredResume.docxUrl);
    console.log('📥 [Download] Full file path:', filePath);
    
    // Check if file exists
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      console.log('✅ [Download] File exists, size:', stats.size, 'bytes');
    } catch (err) {
      console.error('❌ [Download] File not found on disk:', filePath);
      console.error('❌ [Download] Error:', err.message);
      return res.status(404).json({ 
        message: "File not found on server",
        expectedPath: filePath,
        error: err.message
      });
    }

    // Mark as downloaded
    if (!tailoredResume.downloaded) {
      tailoredResume.downloaded = true;
      await tailoredResume.save();
      console.log('✅ [Download] Marked as downloaded in database');
    }

    // Send file
    const filename = `${tailoredResume.company}_${tailoredResume.jobTitle}_Resume.docx`
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    console.log('📤 [Download] Sending file as:', filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('❌ [Download] Error during file transfer:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file", error: err.message });
        }
      } else {
        console.log('✅ [Download] File sent successfully:', filename);
      }
    });

  } catch (error) {
    console.error('❌ [Download] Unexpected error:', error.message);
    console.error('❌ [Download] Stack:', error.stack);
    res.status(500).json({ 
      message: "Error downloading tailored resume", 
      error: error.message 
    });
  }
};

/**
 * Delete a tailored resume
 * DELETE /api/tailored-resume/:id
 */
const deleteTailoredResume = async (req, res) => {
  try {
    const { id } = req.params;

    const tailoredResume = await TailoredResume.findById(id);
    if (!tailoredResume) {
      return res.status(404).json({ message: "Tailored resume not found" });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../', tailoredResume.docxUrl);
    try {
      await fs.unlink(filePath);
      console.log('🗑️ [Tailored] Deleted file:', filePath);
    } catch (err) {
      console.warn('⚠️ [Tailored] Could not delete file:', err.message);
    }

    // Delete from database
    await TailoredResume.findByIdAndDelete(id);

    res.json({
      message: "Tailored resume deleted successfully"
    });

  } catch (error) {
    console.error('❌ [Tailored] Delete error:', error.message);
    res.status(500).json({ 
      message: "Error deleting tailored resume", 
      error: error.message 
    });
  }
};

module.exports = {
  createTailoredResume,
  getTailoredResume,
  getTailoredResumesByOriginal,
  downloadTailoredResume,
  deleteTailoredResume
};
