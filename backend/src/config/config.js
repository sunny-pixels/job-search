require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  PORT: process.env.PORT || 3001,
  OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3",
};
