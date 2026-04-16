const mongoose = require("mongoose");

const tailoredResumeSchema = new mongoose.Schema({
  // Link to original resume
  originalResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true
  },
  
  // Job information
  jobId: {
    type: String,
    required: true
  },
  jobTitle: String,
  company: String,
  jobDescription: String,
  
  // Tailored content
  tailoredContent: {
    summary: String,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      bullets: [String]
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String]
    }],
    education: [String]
  },
  
  // What changed
  modifications: [{
    section: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true }
  }],
  
  // Generated files
  docxUrl: String,
  
  // Scores
  originalScore: Number,
  estimatedScore: Number,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  downloaded: {
    type: Boolean,
    default: false
  }
});

// Index for faster queries
tailoredResumeSchema.index({ originalResumeId: 1, jobId: 1 });

module.exports = mongoose.model("TailoredResume", tailoredResumeSchema);
