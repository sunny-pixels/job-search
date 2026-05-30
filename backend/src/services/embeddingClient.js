/**
 * Embedding Client Service
 * Uses local embedding service (all-MiniLM-L6-v2)
 */

const axios = require('axios');
const config = require('../config/config');

const EMBEDDING_SERVICE_URL = config.EMBEDDING_SERVICE_URL || 'http://localhost:5001';

console.log(`[Embedding Client] Using local service: ${EMBEDDING_SERVICE_URL}`);

/**
 * Generate embedding for a single text using local embedding service
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      `${EMBEDDING_SERVICE_URL}/embed`,
      { text: text },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }

    throw new Error('Invalid response from embedding service');
  } catch (error) {
    console.error('[Embedding Client] Error generating embedding:', error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Embedding service is not running. Please start it with: cd embedding-service && python app.py');
    }
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts in batch using local embedding service
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
const generateBatchEmbeddings = async (texts) => {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const response = await axios.post(
      `${EMBEDDING_SERVICE_URL}/embed/batch`,
      { texts: texts },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for batch
      }
    );

    if (response.data && response.data.embeddings) {
      return response.data.embeddings;
    }

    throw new Error('Invalid response from embedding service');
  } catch (error) {
    console.error('[Embedding Client] Error generating batch embeddings:', error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Embedding service is not running. Please start it with: cd embedding-service && python app.py');
    }
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
};

/**
 * Check if local embedding service is available
 * @returns {Promise<boolean>} - True if service is available
 */
const checkServiceHealth = async () => {
  try {
    const response = await axios.get(
      `${EMBEDDING_SERVICE_URL}/health`,
      { timeout: 5000 }
    );
    
    const isHealthy = response.status === 200 && response.data.status === 'ok';
    
    if (isHealthy) {
      console.log(`[Embedding Client] Service healthy - Model: ${response.data.model}`);
    }
    
    return isHealthy;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Embedding Client] Service not running. Start it with: cd embedding-service && python app.py');
    } else {
      console.error('[Embedding Client] Health check failed:', error.message);
    }
    return false;
  }
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  checkServiceHealth
};
