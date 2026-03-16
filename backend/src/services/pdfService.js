const pdf = require("pdf-parse");

const extractTextFromPDF = async (buffer) => {
  try {
    const pdfData = await pdf(buffer);
    return pdfData.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

module.exports = {
  extractTextFromPDF
};