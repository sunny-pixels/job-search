const AppliedJob = require("../models/AppliedJob");

const markJobAsApplied = async (req, res) => {
  try {
    const { resumeId, jobId, jobTitle, company, jobUrl } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({ message: "resumeId and jobId are required" });
    }

    // Check if already applied
    const existing = await AppliedJob.findOne({ resumeId, jobId });
    if (existing) {
      return res.status(200).json({ 
        message: "Already applied to this job",
        applied: true,
        appliedAt: existing.appliedAt
      });
    }

    // Create new application record
    const appliedJob = new AppliedJob({
      resumeId,
      jobId,
      jobTitle,
      company,
      jobUrl
    });

    await appliedJob.save();

    res.json({
      message: "Job marked as applied",
      applied: true,
      appliedAt: appliedJob.appliedAt
    });

  } catch (error) {
    console.error("Mark applied error:", error.message);
    res.status(500).json({ message: "Error marking job as applied", error: error.message });
  }
};

const getAppliedJobs = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!resumeId) {
      return res.status(400).json({ message: "resumeId is required" });
    }

    const appliedJobs = await AppliedJob.find({ resumeId }).sort({ appliedAt: -1 });

    res.json({
      message: "Applied jobs retrieved",
      count: appliedJobs.length,
      jobs: appliedJobs
    });

  } catch (error) {
    console.error("Get applied jobs error:", error.message);
    res.status(500).json({ message: "Error retrieving applied jobs", error: error.message });
  }
};

const checkIfApplied = async (req, res) => {
  try {
    const { resumeId, jobIds } = req.body;

    if (!resumeId || !jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ message: "resumeId and jobIds array are required" });
    }

    const appliedJobs = await AppliedJob.find({ 
      resumeId, 
      jobId: { $in: jobIds } 
    });

    const appliedJobIds = appliedJobs.map(job => job.jobId);

    res.json({
      message: "Application status checked",
      appliedJobIds
    });

  } catch (error) {
    console.error("Check applied error:", error.message);
    res.status(500).json({ message: "Error checking application status", error: error.message });
  }
};

module.exports = { markJobAsApplied, getAppliedJobs, checkIfApplied };
