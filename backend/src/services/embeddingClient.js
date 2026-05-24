/**
 * Embedding Client Service
 * Uses Hugging Face Inference Providers API for embeddings
 * Model: ibm-granite/granite-embedding-97m-multilingual-r2
 */

const axios = require('axios');
const config = require('../config/config');

// Use Hugging Face Inference Providers API (router endpoint)
// Using granite-embedding model which is available on HF Inference provider
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/ibm-granite/granite-embedding-97m-multilingual-r2';
const HF_TOKEN = config.HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.warn('⚠️ [Embedding Client] HUGGINGFACE_TOKEN not set in environment variables');
}

/**
 * Generate embedding for a single text using Hugging Face API
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
const generateEmbedding = async (text) => {
  try {
    if (!HF_TOKEN) {
      throw new Error('HUGGINGFACE_TOKEN not configured');
    }

    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    // Hugging Face returns the embedding directly as an array
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }

    throw new Error('Invalid response from Hugging Face API');
  } catch (error) {
    console.error('[Embedding Client] Error generating embedding:', error.message);
    if (error.response) {
      console.error('[Embedding Client] Response status:', error.response.status);
      console.error('[Embedding Client] Response data:', error.response.data);
      
      // Handle model loading state
      if (error.response.status === 503 && error.response.data?.error?.includes('loading')) {
        throw new Error('Model is loading, please retry in a few seconds');
      }
    }
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts in batch using Hugging Face API
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
const generateBatchEmbeddings = async (texts) => {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    if (!HF_TOKEN) {
      throw new Error('HUGGINGFACE_TOKEN not configured');
    }

    // HF API supports batch processing with array of inputs
    const response = await axios.post(
      HF_API_URL,
      { inputs: texts },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for batch
      }
    );

    // Response is array of embeddings
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }

    throw new Error('Invalid response from Hugging Face API');
  } catch (error) {
    console.error('[Embedding Client] Error generating batch embeddings:', error.message);
    if (error.response) {
      console.error('[Embedding Client] Response status:', error.response.status);
      console.error('[Embedding Client] Response data:', error.response.data);
      
      // Handle model loading state
      if (error.response.status === 503 && error.response.data?.error?.includes('loading')) {
        throw new Error('Model is loading, please retry in a few seconds');
      }
    }
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
};

/**
 * Check if Hugging Face API is available
 * @returns {Promise<boolean>} - True if service is available
 */
const checkServiceHealth = async () => {
  try {
    if (!HF_TOKEN) {
      console.error('[Embedding Client] HUGGINGFACE_TOKEN not configured');
      return false;
    }

    // Test with a simple text
    const response = await axios.post(
      HF_API_URL,
      { inputs: 'test' },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return response.status === 200 && Array.isArray(response.data);
  } catch (error) {
    // Model loading is considered "available" - just needs time
    if (error.response?.status === 503 && error.response?.data?.error?.includes('loading')) {
      console.log('[Embedding Client] Model is loading, service is available');
      return true;
    }
    console.error('[Embedding Client] Health check failed:', error.message);
    return false;
  }
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  checkServiceHealth
};
