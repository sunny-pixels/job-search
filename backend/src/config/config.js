require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  PORT: process.env.PORT || 3001,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
};
