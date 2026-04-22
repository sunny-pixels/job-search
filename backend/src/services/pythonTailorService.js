/**
 * Python Tailor Service
 * Calls the Python resume tailoring service for DOCX files
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const PYTHON_SERVICE_URL = process.env.PYTHON_TAILOR_URL || 'http://localhost:5002';

/**
 * Check if Python tailor service is available
 */
const checkPythonServiceHealth = async () => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.log('⚠️ [PythonTailor] Service not available:', error.message);
    return false;
  }
};

/**
 * Tailor a DOCX resume using Python service
 * @param {string} docxPath - Path to DOCX file
 * @param {object} jobData - Job information
 * @returns {Promise<Buffer>} - Tailored DOCX buffer
 */
const tailorDocxWithPython = async (docxPath, jobData) => {
  console.log('🐍 [PythonTailor] Calling Python service...');
  
  try {
    // Read DOCX file
    const fileBuffer = await fs.readFile(docxPath);
    
    // Create form data
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: 'resume.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    form.append('jobDescription', jobData.job_description || '');
    form.append('jobTitle', jobData.job_title || '');
    form.append('company', jobData.employer_name || '');
    
    // Call Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/tailor`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 180000 // 3 minute timeout for slow AI responses
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Python service error: ${error}`);
    }
    
    // Get tailored DOCX buffer
    const buffer = await response.buffer();
    console.log('✅ [PythonTailor] Successfully tailored resume');
    
    return buffer;
    
  } catch (error) {
    console.error('❌ [PythonTailor] Error:', error.message);
    throw error;
  }
};

module.exports = {
  checkPythonServiceHealth,
  tailorDocxWithPython
};
