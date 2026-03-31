const express = require("express");
const { markJobAsApplied, unmarkJobAsApplied, getAppliedJobs, checkIfApplied } = require("../controllers/appliedJobController");

const router = express.Router();

// Routes
router.post("/mark-applied", markJobAsApplied);
router.post("/unmark-applied", unmarkJobAsApplied);
router.get("/:resumeId", getAppliedJobs);
router.post("/check", checkIfApplied);

module.exports = router;
