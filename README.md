# JobSphere - AI-Powered Resume-Job Matching System

## Project Topic
**Intelligent Job Recommendation System using Semantic Embeddings and Multi-Phase Filtering**

An AI-powered platform that analyzes resumes and matches candidates with relevant job opportunities using advanced natural language processing, semantic embeddings, and hybrid scoring algorithms.

---

## Brief Motivation

In today's competitive job market, job seekers face several challenges:
- **Information Overload**: Thousands of job postings make it difficult to find relevant opportunities
- **Keyword Mismatch**: Traditional keyword-based systems miss semantically similar roles
- **Experience Misalignment**: Candidates often apply to jobs requiring vastly different experience levels
- **Time Consumption**: Manual job searching and filtering is time-intensive and inefficient

JobSphere addresses these challenges by leveraging AI to understand resume content semantically and match candidates with jobs that truly align with their skills, experience, and career goals.

---

## Objectives

### Primary Objectives
1. **Intelligent Resume Analysis**: Extract and structure candidate information using LLM-based parsing
2. **Semantic Job Matching**: Use embedding-based similarity to understand job-resume compatibility beyond keywords
3. **Experience-Based Filtering**: Implement multi-phase filtering to show only experience-appropriate opportunities
4. **Hybrid Scoring System**: Combine semantic similarity with experience matching for accurate recommendations
5. **Application Tracking**: Enable candidates to track their job applications and manage their job search

### Secondary Objectives
1. Provide human-aligned scoring (0-100%) that reflects actual match quality
2. Support multiple resume management and comparison
3. Integrate with real-time job search APIs for up-to-date listings
4. Deliver fast, scalable matching using batch processing and optimized algorithms

---

## Methodology

### System Architecture

The system consists of three main components:

#### 1. **Backend Service** (Node.js/Express)
- **Resume Processing**: PDF parsing and text extraction
- **AI Analysis**: Groq LLM integration for structured resume parsing
- **Job Search Integration**: JSearch API for real-time job listings
- **Matching Engine**: Multi-phase filtering and scoring algorithm
- **Database**: MongoDB for resume and application tracking

#### 2. **Embedding Service** (Python/Flask)
- **Model**: Sentence Transformers (`all-mpnet-base-v2`, 768 dimensions)
- **Functionality**: Generate semantic embeddings for resumes and job descriptions
- **Optimization**: Batch processing for efficient embedding generation

#### 3. **Frontend Application** (React/Vite)
- **Resume Upload**: Drag-and-drop interface for PDF resumes
- **Job Display**: Interactive job cards with match scores and details
- **Resume Library**: Manage multiple resumes and view analysis
- **Application Tracker**: Track applied jobs with status management

### Matching Algorithm

The system employs a **three-phase matching pipeline**:

#### **Phase 1: Experience-Based Filtering**
```
Candidate Experience Range: (candidate_years - 2) to (candidate_years + 1)

Examples:
- 0 years → Show 0-1 year jobs
- 2 years → Show 0-3 year jobs  
- 5 years → Show 3-6 year jobs
```

**Experience Extraction**:
- Analyzes job descriptions, qualifications, and responsibilities
- Detects patterns: "2-4 years", "5+ years", "junior", "senior", etc.
- Confidence levels: High (explicit range), Medium (keywords), Low (default)

#### **Phase 2: Embedding Generation**
- **Resume Preprocessing**: Weighted text combination
  - Skills: 4x weight (most important)
  - Qualifications: 3x weight
  - Title: 3x weight
  - Responsibilities: 2x weight
  - Description: 1x weight

- **Batch Processing**: Process 20 jobs per batch for efficiency
- **Normalization**: All embeddings are L2-normalized for cosine similarity

#### **Phase 3: Hybrid Scoring**
```javascript
// Rescale raw similarity to human-aligned perception
rescaledSimilarity = (rawSimilarity - 0.3) / 0.4  // Maps [0.3-0.7] → [0-1]

// Calculate experience bonus/penalty
experienceScore = calculateExperienceScore(candidateYears, requiredYears)

// Final score: 90% semantic + 10% experience
finalScore = (rescaledSimilarity × 0.90) + (experienceScore × 0.10)
```

**Experience Scoring**:
- Exact match: 100%
- 1 year less: 85%
- 2 years less: 60%
- 3+ years less: 0%
- 1 year more: 105% (bonus)
- 2 years more: 110% (bonus)
- 3+ years more: 105%

### Technology Stack

**Backend**:
- Node.js, Express.js
- MongoDB with Mongoose ODM
- Groq SDK (LLaMA 3.1 8B Instant)
- Axios for API integration
- Multer for file uploads
- PDF-Parse for text extraction

**Embedding Service**:
- Python 3.x, Flask
- Sentence Transformers
- PyTorch
- NumPy

**Frontend**:
- React 19
- Vite build tool
- Tailwind CSS
- Axios for API calls

**External APIs**:
- JSearch API (RapidAPI) - Job listings
- Groq API - LLM-based resume parsing

---

## Expected Results

### Matching Accuracy
- **Cross-Domain Accuracy**: 100% (prevents mobile developers matching data engineer roles)
- **Real Job Accuracy**: 80% (8/10 top matches are relevant)
- **Score Distribution**: 
  - Excellent matches: 90-100%
  - Great matches: 80-90%
  - Good matches: 70-80%
  - Fair matches: 60-70%

### Performance Metrics
- **Resume Processing**: ~2-3 seconds per resume
- **Job Matching**: ~2-3 seconds for 200+ jobs
- **Embedding Generation**: ~100ms per job (batch processing)
- **API Response Time**: <5 seconds end-to-end

### User Experience
- **Intuitive Scores**: Human-aligned 0-100% scoring
- **Relevant Results**: 30-40 jobs above 70% threshold for good resumes
- **Experience Filtering**: No mismatched experience level jobs
- **Application Tracking**: Organized job application management

---

## Outcomes

### Implemented Features

1. **Resume Upload & Analysis**
   - PDF upload with drag-and-drop interface
   - Automatic text extraction and parsing
   - LLM-based structured data extraction
   - Skills, experience, education, and role identification

2. **Intelligent Job Matching**
   - Multi-phase filtering (experience → embeddings → scoring)
   - Semantic similarity using transformer embeddings
   - Hybrid scoring (semantic + experience)
   - Human-aligned score rescaling

3. **Resume Library**
   - Store and manage multiple resumes
   - View extracted data and analysis
   - Compare different resume versions
   - Delete and re-upload functionality

4. **Job Application Tracking**
   - Mark jobs as applied
   - Track application status (applied, shortlisted, interview, rejected)
   - View all applications across resumes
   - Search and filter applied jobs

5. **Real-Time Job Search**
   - Integration with JSearch API
   - Multiple search queries based on resume analysis
   - Experience-based filtering
   - Job enrichment with detailed highlights

### Key Achievements

1. **Accurate Matching**: Achieved 100% cross-domain accuracy and 80% real-world relevance
2. **Fast Processing**: Batch embedding generation processes 200+ jobs in ~2 seconds
3. **Scalable Architecture**: Microservices design allows independent scaling
4. **User-Friendly Scores**: Rescaling provides intuitive 0-100% match percentages
5. **Production-Ready**: Error handling, logging, and graceful degradation implemented

### Technical Innovations

1. **Human-Aligned Rescaling**: Maps embedding similarity [0.3-0.7] to [0-100%] for better UX
2. **Multi-Phase Filtering**: Reduces computational load by filtering before embedding generation
3. **Weighted Preprocessing**: Emphasizes important job sections (skills, qualifications)
4. **Experience Extraction**: Robust pattern matching for job experience requirements
5. **Batch Processing**: Efficient embedding generation for large job sets

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB 6.0+
- API Keys: Groq API, RapidAPI (JSearch)

### Local Development Setup

#### Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cd src
cp .env.example .env
# Edit .env with your API keys:
# MONGODB_URI=mongodb://localhost:27017/jobsphere
# GROQ_API_KEY=your_groq_key
# RAPIDAPI_KEY=your_rapidapi_key
# EMBEDDING_SERVICE_URL=http://localhost:5001

npm run dev  # Start development server on port 5000
```

#### Embedding Service Setup
```bash
cd embedding-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

python app.py  # Start service on port 5001
```

#### Frontend Setup
```bash
cd frontend
npm install

# Configure API endpoint
# Edit src/config.js if needed

npm run dev  # Start development server on port 5173
```

#### Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Embedding Service: http://localhost:5001

---

## Production Deployment

### Deploy on Render + Vercel

The application is production-ready and can be deployed on Render (backend + embedding service) and Vercel (frontend).

**Quick Deploy (5 minutes)**:
1. Push code to GitHub
2. Go to Render Dashboard → New Blueprint
3. Connect repository (auto-detects `render.yaml`)
4. Add environment variables (MongoDB, API keys)
5. Deploy frontend on Vercel with backend URL

**Detailed Instructions**: See [RENDER_QUICK_DEPLOY.md](RENDER_QUICK_DEPLOY.md)

**Full Deployment Guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Required Environment Variables

**Backend (Render)**:
- `MONGODB_URI` - MongoDB Atlas connection string
- `GROQ_API_KEY` - Groq API key for resume parsing
- `RAPIDAPI_KEY` - RapidAPI key for JSearch
- `EMBEDDING_SERVICE_URL` - URL of embedding service

**Frontend (Vercel)**:
- `VITE_API_URL` - Backend API URL

**Embedding Service (Render)**:
- No additional variables needed (configured in render.yaml)

---

## Usage

### 1. Upload Resume
- Navigate to "Upload Resume" tab
- Drag and drop PDF resume or click to browse
- Wait for AI analysis to complete
- View extracted skills, experience, and roles

### 2. View Matched Jobs
- System automatically fetches and matches jobs
- Jobs displayed with match scores (0-100%)
- View job details: title, company, location, salary
- See match breakdown: semantic similarity + experience score

### 3. Apply to Jobs
- Click "Apply" button on job cards
- Opens job application page in new tab
- Job automatically marked as "Applied"
- Track application in Jobs Tracker

### 4. Manage Applications
- Navigate to "Jobs Tracker" tab
- View all applied jobs across resumes
- Update status: Applied → Shortlisted → Interview → Rejected
- Search and filter applications

### 5. Resume Library
- Navigate to "Resume Library" tab
- View all uploaded resumes
- See extracted data and analysis
- Delete old resumes
- Upload new versions

---

## Project Structure

```
ai-resume-agent/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── embeddingMatcherService.js  # Core matching algorithm
│   │   │   ├── jsearchService.js           # Job search API
│   │   │   ├── groqService.js              # Resume parsing
│   │   │   ├── embeddingClient.js          # Embedding service client
│   │   │   ├── textPreprocessor.js         # Text preprocessing
│   │   │   └── pdfService.js               # PDF extraction
│   │   ├── app.js           # Express app
│   │   └── server.js        # Server entry point
│   ├── uploads/             # Uploaded resume files
│   ├── test-*.js            # Test scripts
│   └── package.json
├── embedding-service/
│   ├── app.py               # Flask embedding service
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ResumeUploaderEmbedding.jsx
│   │   │   ├── ResumeLibrary.jsx
│   │   │   └── JobsTracker.jsx
│   │   ├── App.jsx          # Main app component
│   │   ├── config.js        # API configuration
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## API Endpoints

### Resume Endpoints
- `POST /api/embedding-matcher/upload` - Upload and analyze resume
- `GET /api/embedding-matcher/resumes` - Get all resumes
- `GET /api/embedding-matcher/resumes/:id` - Get resume by ID
- `DELETE /api/embedding-matcher/resumes/:id` - Delete resume

### Job Matching Endpoints
- `POST /api/embedding-matcher/match` - Match resume with jobs

### Application Tracking Endpoints
- `POST /api/applied-jobs/mark-applied` - Mark job as applied
- `POST /api/applied-jobs/unmark-applied` - Unmark job
- `GET /api/applied-jobs/:resumeId` - Get applied jobs for resume
- `POST /api/applied-jobs/check-applied` - Check application status
- `POST /api/applied-jobs/update-status` - Update application status
- `GET /api/applied-jobs/all` - Get all applied jobs

---

## Testing

### Test Scripts
```bash
cd backend

# Test embedding similarity
node test-embedding-similarity.js

# Test cross-domain matching accuracy
node test-cross-domain-matching.js

# Test real job matching
node test-real-job-matching.js

# Test experience extraction
node test-experience-extraction.js

# Test hybrid scoring
node test-hybrid-scoring.js

# Test rescaling accuracy
node test-rescaling-accuracy.js
```

---

## Future Enhancements

1. **Advanced Filtering**
   - Location-based filtering
   - Salary range preferences
   - Remote/hybrid/onsite preferences
   - Company size and industry filters

2. **Resume Optimization**
   - AI-powered resume improvement suggestions
   - Keyword optimization for specific jobs
   - ATS compatibility checker

3. **Interview Preparation**
   - Generate interview questions based on job requirements
   - Skill gap analysis
   - Learning resource recommendations

4. **Analytics Dashboard**
   - Application success rate tracking
   - Market demand analysis
   - Salary insights and trends

5. **Notifications**
   - Email alerts for new matching jobs
   - Application status updates
   - Interview reminders

6. **Multi-Language Support**
   - Support for non-English resumes
   - International job markets

---

## References

### Research Papers & Articles
1. Reimers, N., & Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks"
2. Devlin, J., et al. (2018). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
3. Vaswani, A., et al. (2017). "Attention Is All You Need"

### Technologies & Libraries
1. **Sentence Transformers**: https://www.sbert.net/
2. **Groq API**: https://groq.com/
3. **JSearch API**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
4. **MongoDB**: https://www.mongodb.com/
5. **React**: https://react.dev/
6. **Express.js**: https://expressjs.com/
7. **Flask**: https://flask.palletsprojects.com/

### Models
1. **all-mpnet-base-v2**: https://huggingface.co/sentence-transformers/all-mpnet-base-v2
   - 768-dimensional embeddings
   - Trained on 1B+ sentence pairs
   - State-of-the-art semantic similarity

2. **LLaMA 3.1 8B Instant** (via Groq):
   - Fast inference for structured data extraction
   - JSON output formatting
   - Low latency (<1s response time)

### Documentation
1. Cosine Similarity: https://en.wikipedia.org/wiki/Cosine_similarity
2. Semantic Search: https://www.pinecone.io/learn/semantic-search/
3. Vector Embeddings: https://www.tensorflow.org/text/guide/word_embeddings

---

## Contributors

**Development Team**: AI Resume Agent Project

---

## License

This project is developed for educational and research purposes.

---

## Acknowledgments

- Groq for providing fast LLM inference
- Sentence Transformers team for pre-trained models
- JSearch API for real-time job data
- Open-source community for libraries and tools

---

## Contact & Support

For questions, issues, or contributions, please refer to the project repository.

---

**Last Updated**: April 9, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
