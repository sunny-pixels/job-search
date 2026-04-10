/**
 * Embedding-Based Resume Routes
 * NEW routes for embedding-based job matching
 */

const express = require("express");
const multer = require("multer");
const {
  uploadResumeEmbedding,
  getMatchingJobsEmbedding,
  getJobProgressEmbedding,
  getAllResumes
} = require("../controllers/embeddingResumeController");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Routes
router.post("/upload", upload.single("resume"), uploadResumeEmbedding);
router.get("/jobs", getMatchingJobsEmbedding);
router.get("/jobs/progress", getJobProgressEmbedding);
router.get("/all", getAllResumes); // Get all resumes

module.exports = router;
