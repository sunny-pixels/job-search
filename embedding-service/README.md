# Embedding Microservice

Python Flask service for generating semantic embeddings using Sentence Transformers.

## Setup

1. Install Python 3.8+
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python app.py
```

The service will start on port 5001.

## API Endpoints

### Health Check
```
GET /health
```

### Single Embedding
```
POST /embed
Content-Type: application/json

{
  "text": "Your resume or job description text"
}
```

### Batch Embeddings
```
POST /embed/batch
Content-Type: application/json

{
  "texts": ["text1", "text2", "text3"]
}
```

## Model

Uses `all-MiniLM-L6-v2` from Sentence Transformers:
- Embedding dimension: 384
- Normalized embeddings for cosine similarity
- Fast inference (~50ms per text)
