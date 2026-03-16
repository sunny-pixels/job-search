const express = require("express");
const multer = require("multer");
const { uploadResume, getResumeData, getMatchingJobs } = require("../controllers/resumeController");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Routes
router.post("/upload", upload.single("resume"), uploadResume);
router.get("/", getResumeData);
router.get("/jobs", getMatchingJobs);

module.exports = router;