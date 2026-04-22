/**
 * Tailored Resume Routes
 * Routes for AI-powered resume tailoring
 */

const express = require("express");
const {
  analyzeKeywords,
  getPreviewHtml,
  createTailoredResume,
  getTailoredResume,
  getTailoredResumesByOriginal,
  downloadTailoredResume,
  deleteTailoredResume
} = require("../controllers/tailoredResumeController");

const router = express.Router();

// Analyze missing keywords
router.post("/analyze-keywords", analyzeKeywords);

// Get HTML preview
router.post("/preview", getPreviewHtml);

// Create tailored resume for a job
router.post("/create", createTailoredResume);

// Get specific tailored resume
router.get("/:id", getTailoredResume);

// Get all tailored versions for a resume
router.get("/by-resume/:resumeId", getTailoredResumesByOriginal);

// Download tailored resume DOCX
router.get("/download/:id", downloadTailoredResume);

// Delete tailored resume
router.delete("/:id", deleteTailoredResume);

module.exports = router;
