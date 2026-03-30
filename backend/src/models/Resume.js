const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true,
    unique: true
  },
  extractedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    education: [{
      degree: String,
      college: String,
      year: String
    }],
    experience: [{
      company: String,
      role: String,
      years: String
    }],
    // Additional Groq analysis fields
    primary_roles: [String],
    programming_languages: [String],
    frameworks: [String],
    tools: [String],
    experience_level: String,
    experience_years: Number,
    summary: String,
    job_keywords: [String]
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Resume", resumeSchema);
