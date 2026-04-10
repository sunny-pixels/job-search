/**
 * Embedding Client Service
 * Communicates with Python embedding microservice
 */

const axios = require('axios');
const config = require('../config/config');

const EMBEDDING_SERVICE_URL = config.EMBEDDING_SERVICE_URL || 'http://localhost:5001';

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(`${EMBEDDING_SERVICE_URL}/embed`, {
      text: text
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }

    throw new Error('Invalid response from embedding service');
  } catch (error) {
    console.error('[Embedding Client] Error generating embedding:', error.message);
    if (error.response) {
      console.error('[Embedding Client] Response status:', error.response.status);
      console.error('[Embedding Client] Response data:', error.response.data);
    }
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
const generateBatchEmbeddings = async (texts) => {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    const response = await axios.post(`${EMBEDDING_SERVICE_URL}/embed/batch`, {
      texts: texts
    }, {
      timeout: 30000 // 30 second timeout for batch
    });

    if (response.data && response.data.embeddings) {
      return response.data.embeddings;
    }

    throw new Error('Invalid response from embedding service');
  } catch (error) {
    console.error('[Embedding Client] Error generating batch embeddings:', error.message);
    if (error.response) {
      console.error('[Embedding Client] Response status:', error.response.status);
      console.error('[Embedding Client] Response data:', error.response.data);
    }
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
};

/**
 * Check if embedding service is available
 * @returns {Promise<boolean>} - True if service is available
 */
const checkServiceHealth = async () => {
  try {
    const response = await axios.get(`${EMBEDDING_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('[Embedding Client] Embedding service health check failed:', error.message);
    return false;
  }
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  checkServiceHealth
};
