const express = require("express");
const { markJobAsApplied, unmarkJobAsApplied, getAppliedJobs, checkIfApplied, updateJobStatus, getAllAppliedJobs } = require("../controllers/appliedJobController");

const router = express.Router();

// Routes
router.get("/all", getAllAppliedJobs);
router.post("/mark-applied", markJobAsApplied);
router.post("/unmark-applied", unmarkJobAsApplied);
router.post("/update-status", updateJobStatus);
router.get("/:resumeId", getAppliedJobs);
router.post("/check", checkIfApplied);

module.exports = router;
