/**
 * Tailored Resume Routes
 * Routes for AI-powered resume tailoring
 */

const express = require("express");
const {
  createTailoredResume,
  getTailoredResume,
  getTailoredResumesByOriginal,
  downloadTailoredResume,
  deleteTailoredResume
} = require("../controllers/tailoredResumeController");

const router = express.Router();

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
