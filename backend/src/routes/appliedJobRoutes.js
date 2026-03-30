const express = require("express");
const { markJobAsApplied, getAppliedJobs, checkIfApplied } = require("../controllers/appliedJobController");

const router = express.Router();

// Routes
router.post("/mark-applied", markJobAsApplied);
router.get("/:resumeId", getAppliedJobs);
router.post("/check", checkIfApplied);

module.exports = router;
