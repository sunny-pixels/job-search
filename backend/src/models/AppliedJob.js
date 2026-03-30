const mongoose = require("mongoose");

const appliedJobSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  jobTitle: String,
  company: String,
  jobUrl: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate applications
appliedJobSchema.index({ resumeId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("AppliedJob", appliedJobSchema);
