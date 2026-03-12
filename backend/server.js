const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdf = require("pdf-parse");
const axios = require("axios");

const app = express();

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// Store last analyzed resume data
let lastAnalyzedResume = null;

// Function to analyze resume with Ollama
async function analyzeResumeWithOllama(resumeText) {
  const prompt = `You are a resume parser that MUST return ONLY valid JSON.

Analyze this resume and extract information into this EXACT JSON structure. Do not add any text before or after the JSON.

IMPORTANT INSTRUCTIONS:
- primary_roles: Extract ONLY actual job titles the person held (e.g., "Full-Stack Developer", "Software Engineer"). DO NOT include project names.
- skills: Extract ONLY technical skills (e.g., "REST API", "Database Design", "Git", "Agile"). DO NOT include project names or descriptions.
- job_keywords: Extract ONLY 5-8 most relevant job titles for job searching. Include the primary role and close variations (e.g., "Full-Stack Developer", "Full Stack Developer", "Software Engineer", "Web Developer")
- programming_languages: Extract ONLY programming languages (e.g., "JavaScript", "Python", "Java", "C++")
- frameworks: Extract ONLY frameworks and libraries (e.g., "React", "Express", "Node.js", "MongoDB", "Vue")
- tools: Extract ONLY development tools (e.g., "Git", "Docker", "VS Code", "Postman", "Jenkins")
- experience_level: Determine from years: 0-1 years = "Junior", 2-4 years = "Mid", 5+ years = "Senior"
- experience_years: Calculate total years from employment dates

DO NOT INCLUDE:
- Project names (e.g., "BillSwift", "Invoice Management System")
- Project descriptions
- Company names
- University names

{
  "primary_roles": ["actual job titles only"],
  "skills": ["technical skills only"],
  "job_keywords": ["5-8 relevant job search keywords"],
  "experience_level": "Junior or Mid or Senior or Intern",
  "experience_years": 0,
  "programming_languages": ["programming languages only"],
  "frameworks": ["frameworks and libraries only"],
  "tools": ["development tools only"]
}

Resume:
${resumeText}

JSON output:`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 1500
      }
    });

    let aiResponse = response.data.response.trim();
    
    console.log("=== RAW OLLAMA RESPONSE ===");
    console.log(aiResponse);
    console.log("===========================");
    
    // Try multiple JSON extraction methods
    let parsedData = null;
    
    // Method 1: Direct parse
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (e) {
      // Method 2: Extract JSON from markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        parsedData = JSON.parse(codeBlockMatch[1]);
      } else {
        // Method 3: Find first { to last }
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    if (!parsedData) {
      throw new Error("Could not extract JSON from Ollama response");
    }
    
    // Filter out project names and non-technical terms
    const projectKeywords = ['system', 'solution', 'management', 'platform', 'application', 'app'];
    
    const filterNonTechnical = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.filter(item => {
        const lower = item.toLowerCase();
        // Filter out items that look like project names
        return !projectKeywords.some(keyword => 
          lower.includes(keyword) && !lower.includes('management tool') && !lower.includes('system design')
        );
      });
    };
    
    // Validate and normalize structure
    const validatedData = {
      primary_roles: Array.isArray(parsedData.primary_roles) && parsedData.primary_roles.length > 0 
        ? filterNonTechnical(parsedData.primary_roles)
        : ["Full-Stack Developer"],
      skills: Array.isArray(parsedData.skills) ? filterNonTechnical(parsedData.skills) : [],
      job_keywords: Array.isArray(parsedData.job_keywords) && parsedData.job_keywords.length > 0
        ? filterNonTechnical(parsedData.job_keywords)
        : [],
      experience_level: ["Intern", "Junior", "Mid", "Senior"].includes(parsedData.experience_level) 
        ? parsedData.experience_level 
        : "Junior",
      experience_years: parseInt(parsedData.experience_years) || 0,
      programming_languages: Array.isArray(parsedData.programming_languages) ? parsedData.programming_languages : [],
      frameworks: Array.isArray(parsedData.frameworks) ? parsedData.frameworks : [],
      tools: Array.isArray(parsedData.tools) ? parsedData.tools : []
    };
    
    // Only enhance job keywords if they're too few
    if (validatedData.job_keywords.length < 5) {
      const enhancedKeywords = new Set(validatedData.job_keywords);
      
      // Add only essential variations of primary roles
      validatedData.primary_roles.forEach(role => {
        if (role.toLowerCase().includes('full')) {
          enhancedKeywords.add("Full-Stack Developer");
          enhancedKeywords.add("Full Stack Developer");
          enhancedKeywords.add("Software Engineer");
          enhancedKeywords.add("Web Developer");
        } else if (role.toLowerCase().includes('backend')) {
          enhancedKeywords.add("Backend Developer");
          enhancedKeywords.add("Software Engineer");
        } else if (role.toLowerCase().includes('frontend')) {
          enhancedKeywords.add("Frontend Developer");
          enhancedKeywords.add("Software Engineer");
        } else {
          enhancedKeywords.add(role);
        }
      });
      
      validatedData.job_keywords = Array.from(enhancedKeywords).slice(0, 8);
    }
    
    return validatedData;
    
  } catch (error) {
    console.error("Error analyzing resume with Ollama:", error.message);
    throw error;
  }
}

app.post("/api/resume/upload", upload.single("resume"), async (req, res) => {
  console.log("POST /api/resume/upload called");

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // STEP 1: Extract text from PDF
    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text;

    console.log("Resume text extracted");
    console.log("=== EXTRACTED TEXT ===");
    console.log(resumeText.substring(0, 500));
    console.log("======================");

    // STEP 2: Analyze with Ollama
    console.log("Sending to Ollama for analysis...");
    const analysisData = await analyzeResumeWithOllama(resumeText);

    console.log("=== AI ANALYSIS (JSON) ===");
    console.log(JSON.stringify(analysisData, null, 2));
    console.log("==========================");

    // Store the analyzed data
    lastAnalyzedResume = {
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      analysis: analysisData,
      extractedTextPreview: resumeText.substring(0, 200)
    };

    res.json({
      message: "Resume uploaded successfully",
      analysis: analysisData,
      extracted_text_preview: resumeText.substring(0, 200)
    });

  } catch (error) {
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("Ollama response error:", error.response.data);
    }
    res.status(500).json({
      message: "Error analyzing resume",
      error: error.message
    });
  }
});

app.get("/api/resume", (req, res) => {
  if (!lastAnalyzedResume) {
    return res.status(404).json({ 
      message: "No resume uploaded yet. Please upload a resume first." 
    });
  }

  res.json({
    message: "Resume data retrieved successfully",
    data: lastAnalyzedResume
  });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});