const pdf = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from PDF or DOCX file
 * @param {Buffer} buffer - File buffer
 * @param {string} fileType - 'pdf' or 'docx'
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = async (buffer, fileType = 'pdf') => {
  try {
    if (fileType === 'docx') {
      console.log('📄 [FileExtraction] Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else {
      console.log('📄 [FileExtraction] Extracting text from PDF...');
      const pdfData = await pdf(buffer);
      return pdfData.text;
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileType.toUpperCase()}:`, error);
    throw new Error(`Failed to extract text from ${fileType.toUpperCase()}`);
  }
};

/**
 * Extract text from PDF (legacy function for backward compatibility)
 * @param {Buffer} buffer - PDF buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (buffer) => {
  return extractTextFromFile(buffer, 'pdf');
};

module.exports = {
  extractTextFromPDF,
  extractTextFromFile
};