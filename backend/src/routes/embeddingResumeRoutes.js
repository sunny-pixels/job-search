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
const { getRateLimitInfo } = require("../services/rateLimitTracker");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// Routes
router.post("/upload", upload.single("resume"), uploadResumeEmbedding);
router.get("/jobs", getMatchingJobsEmbedding);
router.get("/jobs/progress", getJobProgressEmbedding);
router.get("/all", getAllResumes);
router.get("/rate-limit", (req, res) => {
  res.json(getRateLimitInfo());
});

module.exports = router;
