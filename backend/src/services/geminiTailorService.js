/**
 * Gemini Tailor Service
 * Calls the Gemini-based resume tailoring service for DOCX files
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const GEMINI_SERVICE_URL = process.env.GEMINI_TAILOR_URL || 'http://localhost:5004';

/**
 * Check if Gemini tailor service is available
 */
const checkGeminiServiceHealth = async () => {
  try {
    const response = await fetch(`${GEMINI_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.log('⚠️ [GeminiTailor] Service not available:', error.message);
    return false;
  }
};

/**
 * Tailor a DOCX resume using Gemini service
 * @param {string} docxPath - Path to DOCX file
 * @param {object} jobData - Job information
 * @returns {Promise<Buffer>} - Tailored DOCX buffer
 */
const tailorDocxWithGemini = async (docxPath, jobData) => {
  console.log('🤖 [GeminiTailor] Calling Gemini service...');
  
  try {
    // Read DOCX file
    const fileBuffer = await fs.readFile(docxPath);
    
    // Create form data
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: 'resume.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    // Build job description text
    const jobDescription = buildJobDescriptionText(jobData);
    
    form.append('jobDescription', jobDescription);
    form.append('jobTitle', jobData.job_title || '');
    form.append('company', jobData.employer_name || '');
    
    console.log('📝 [GeminiTailor] Job description length:', jobDescription.length, 'chars');
    
    // Call Gemini service
    const response = await fetch(`${GEMINI_SERVICE_URL}/tailor`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 120000 // 2 minute timeout (Gemini can be slower)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini service error: ${error}`);
    }
    
    // Get tailored DOCX buffer
    const buffer = await response.buffer();
    console.log('✅ [GeminiTailor] Successfully tailored resume');
    console.log('📦 [GeminiTailor] Output size:', buffer.length, 'bytes');
    
    return buffer;
    
  } catch (error) {
    console.error('❌ [GeminiTailor] Error:', error.message);
    throw error;
  }
};

/**
 * Build comprehensive job description text from job data
 * @param {object} jobData - Job information
 * @returns {string} - Formatted job description
 */
function buildJobDescriptionText(jobData) {
  const parts = [];
  
  // Job title and company
  if (jobData.job_title) {
    parts.push(`Job Title: ${jobData.job_title}`);
  }
  if (jobData.employer_name) {
    parts.push(`Company: ${jobData.employer_name}`);
  }
  
  parts.push(''); // Empty line
  
  // Main job description
  if (jobData.job_description) {
    parts.push('Job Description:');
    parts.push(jobData.job_description);
    parts.push('');
  }
  
  // Job highlights (qualifications, responsibilities)
  if (jobData.job_highlights) {
    const highlights = jobData.job_highlights;
    
    if (highlights.Qualifications && highlights.Qualifications.length > 0) {
      parts.push('Qualifications:');
      highlights.Qualifications.forEach(q => parts.push(`• ${q}`));
      parts.push('');
    }
    
    if (highlights.Responsibilities && highlights.Responsibilities.length > 0) {
      parts.push('Responsibilities:');
      highlights.Responsibilities.forEach(r => parts.push(`• ${r}`));
      parts.push('');
    }
    
    if (highlights.Benefits && highlights.Benefits.length > 0) {
      parts.push('Benefits:');
      highlights.Benefits.forEach(b => parts.push(`• ${b}`));
      parts.push('');
    }
  }
  
  // Required skills
  if (jobData.job_required_skills) {
    parts.push('Required Skills:');
    if (Array.isArray(jobData.job_required_skills)) {
      jobData.job_required_skills.forEach(s => parts.push(`• ${s}`));
    } else {
      parts.push(jobData.job_required_skills);
    }
    parts.push('');
  }
  
  return parts.join('\n');
}

module.exports = {
  checkGeminiServiceHealth,
  tailorDocxWithGemini
};
