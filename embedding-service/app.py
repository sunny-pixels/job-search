"""
Embedding Microservice for JobSphere
Uses Sentence Transformers to generate semantic embeddings for resumes and job descriptions
"""

from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load the model on startup
logger.info("Loading Sentence Transformer model: all-MiniLM-L6-v2")
model = SentenceTransformer('all-MiniLM-L6-v2')
logger.info("Model loaded successfully")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model': 'all-MiniLM-L6-v2',
        'service': 'embedding-service'
    }), 200

@app.route('/embed', methods=['POST'])
def generate_embedding():
    """
    Generate embedding for a single text
    
    Request body:
    {
        "text": "resume or job description text"
    }
    
    Response:
    {
        "embedding": [0.123, 0.456, ...],
        "dimension": 384
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field in request body'}), 400
        
        text = data['text']
        
        if not text or not isinstance(text, str):
            return jsonify({'error': 'Text must be a non-empty string'}), 400
        
        # Generate embedding
        embedding = model.encode(text, normalize_embeddings=True)
        
        # Convert to list for JSON serialization
        embedding_list = embedding.tolist()
        
        return jsonify({
            'embedding': embedding_list,
            'dimension': len(embedding_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        return jsonify({'error': f'Failed to generate embedding: {str(e)}'}), 500

@app.route('/embed/batch', methods=['POST'])
def generate_batch_embeddings():
    """
    Generate embeddings for multiple texts in batch
    
    Request body:
    {
        "texts": ["text1", "text2", "text3", ...]
    }
    
    Response:
    {
        "embeddings": [[0.123, ...], [0.456, ...], ...],
        "dimension": 384,
        "count": 3
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing "texts" field in request body'}), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({'error': 'Texts must be a non-empty list'}), 400
        
        # Validate all texts are strings
        if not all(isinstance(t, str) and t for t in texts):
            return jsonify({'error': 'All texts must be non-empty strings'}), 400
        
        # Generate embeddings in batch (more efficient)
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        
        # Convert to list for JSON serialization
        embeddings_list = embeddings.tolist()
        
        return jsonify({
            'embeddings': embeddings_list,
            'dimension': len(embeddings_list[0]) if embeddings_list else 0,
            'count': len(embeddings_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        return jsonify({'error': f'Failed to generate batch embeddings: {str(e)}'}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Embedding Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
