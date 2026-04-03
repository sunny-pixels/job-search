const express = require("express");
const multer = require("multer");
const { uploadResume, getResumeData, getAllResumes, getResumeById, getMatchingJobs, getJobProgress } = require("../controllers/resumeController");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Routes (order matters - specific routes before dynamic ones)
router.post("/upload", upload.single("resume"), uploadResume);
router.get("/all", getAllResumes);
router.get("/jobs", getMatchingJobs);
router.get("/jobs/progress", getJobProgress);
router.get("/:id", getResumeById);
router.get("/", getResumeData);

module.exports = router;