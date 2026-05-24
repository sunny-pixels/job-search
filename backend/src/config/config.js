require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  PORT: process.env.PORT || 3001,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY, // JSearch API key
  EMBEDDING_SERVICE_URL: process.env.EMBEDDING_SERVICE_URL || 'http://localhost:5001', // Legacy: Python embedding service
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN, // NEW: Hugging Face API token for embeddings
};
