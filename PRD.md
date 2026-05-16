# Product Requirements Document (PRD)
# AI Resume Agent - Intelligent Job Matching Platform

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Product Team  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Problem Statement](#problem-statement)
4. [Goals & Objectives](#goals--objectives)
5. [Target Users](#target-users)
6. [Key Features](#key-features)
7. [Technical Architecture](#technical-architecture)
8. [User Flows](#user-flows)
9. [Functional Requirements](#functional-requirements)
10. [Non-Functional Requirements](#non-functional-requirements)
11. [API Specifications](#api-specifications)
12. [Data Models](#data-models)
13. [Algorithms & Scoring](#algorithms--scoring)
14. [Success Metrics](#success-metrics)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**AI Resume Agent** is an intelligent job matching platform that leverages advanced AI/ML technologies to match job seekers with relevant job opportunities. The system analyzes resumes using natural language processing, extracts technical skills and experience, and matches candidates with jobs using a hybrid scoring approach combining keyword coverage and semantic similarity.

### Key Differentiators
- **Semantic Understanding**: Uses embeddings to understand context beyond keyword matching
- **Hybrid Scoring**: Combines ATS-style keyword matching (25%) with semantic similarity (75%)
- **Intelligent Filtering**: Automatically prioritizes non-intern roles for experienced candidates
- **Real-time Job Search**: Integrates with JSearch API for up-to-date job listings
- **Experience-Based Filtering**: Matches jobs based on candidate experience level

---

## Product Overview

### What is AI Resume Agent?

AI Resume Agent is a full-stack web application that helps job seekers find relevant job opportunities by:
1. Analyzing their resume using AI (Groq LLM)
2. Extracting skills, experience, and job roles
3. Searching for matching jobs via JSearch API
4. Scoring jobs using semantic similarity and keyword matching
5. Presenting ranked job recommendations

### Technology Stack

**Frontend:**
- React.js
- Modern UI/UX design

**Backend:**
- Node.js + Express.js
- MongoDB (data persistence)
- Python (embedding service)

**AI/ML Services:**
- Groq LLM (resume parsing)
- all-mpnet-base-v2 (semantic embeddings)
- Custom keyword extraction engine

**External APIs:**
- JSearch API (job listings via RapidAPI)

---

## Problem Statement

### Current Challenges in Job Search

1. **Information Overload**: Job seekers face thousands of job postings daily
2. **Poor Matching**: Traditional keyword-based systems miss semantically similar skills
3. **Time-Consuming**: Manual job search and application tracking is inefficient
4. **ATS Limitations**: Applicant Tracking Systems often reject qualified candidates
5. **Experience Mismatch**: Jobs don't filter properly by experience level

### Our Solution

AI Resume Agent addresses these challenges by:
- **Intelligent Parsing**: Extracts structured data from unstructured resumes
- **Semantic Matching**: Understands skill relationships (e.g., PyTorch ≈ TensorFlow)
- **Automated Search**: Finds relevant jobs automatically based on resume
- **Smart Ranking**: Prioritizes jobs that match both keywords and context
- **Experience Filtering**: Shows jobs appropriate for candidate's experience level

---

## Goals & Objectives

### Primary Goals

1. **Accuracy**: Achieve 70%+ match accuracy between resumes and job descriptions
2. **Speed**: Process resume and return job matches in <10 seconds
3. **Relevance**: 80%+ of top 10 results should be relevant to user
4. **User Satisfaction**: 4+ star rating from users

### Business Objectives

1. Help 10,000+ job seekers find relevant opportunities in Year 1
2. Achieve 60%+ user retention rate
3. Reduce average job search time by 50%
4. Build a scalable platform for future monetization

---

## Target Users

### Primary Personas

#### 1. **Tech Job Seeker - "Sarah"**
- **Age**: 25-35
- **Background**: Software Engineer, 3-5 years experience
- **Pain Points**: 
  - Overwhelmed by job postings
  - Unsure which jobs match her skills
  - Wastes time applying to irrelevant positions
- **Goals**: Find relevant jobs quickly, track applications

#### 2. **Career Changer - "Mike"**
- **Age**: 30-40
- **Background**: Transitioning from different field to tech
- **Pain Points**:
  - Doesn't know how to position transferable skills
  - Gets rejected by ATS systems
  - Needs guidance on relevant job titles
- **Goals**: Understand which tech roles match his background

#### 3. **Recent Graduate - "Alex"**
- **Age**: 22-25
- **Background**: Fresh graduate, 0-1 year experience
- **Pain Points**:
  - Limited experience
  - Doesn't know which entry-level jobs to apply for
  - Confused about intern vs full-time positions
- **Goals**: Find entry-level opportunities, build career

---

## Key Features

### 1. Resume Upload & Analysis

**Description**: Users upload their resume (PDF/DOCX) for AI-powered analysis

**Features**:
- Support for PDF and DOCX formats
- Automatic text extraction
- Duplicate detection (file hash-based)
- File format preservation (DOCX preferred)
- Re-analysis on duplicate upload (ensures latest logic)

**AI Extraction**:
- Primary job roles (with intern filtering)
- Technical skills
- Programming languages
- Frameworks & tools
- Experience level (Intern/Junior/Mid/Senior)
- Years of experience
- Education
- Projects & internships
- Professional summary

### 2. Intelligent Job Role Extraction

**Description**: Smart extraction of job titles with prioritization logic

**Logic**:
- Extract exact job titles from resume
- If both intern and non-intern roles found → prioritize non-intern
- If only intern roles found → use intern roles
- Examples:
  - Input: ["Software Developer Intern", "Software Engineer"]
  - Output: ["Software Engineer"] ✅

**Benefits**:
- Prevents searching for intern positions when candidate has full-time experience
- Ensures relevant job search queries
- Respects candidate's career progression

### 3. Automated Job Search

**Description**: Searches for relevant jobs using JSearch API

**Features**:
- Multi-query search (uses all extracted job roles)
- Experience-based filtering:
  - 0 years: `no_experience,under_3_years_experience`
  - 1-2 years: `under_3_years_experience`
  - 3+ years: `more_than_3_years_experience`
- Date filtering (jobs posted in last week)
- Country/language filtering (US, English)
- Pagination support (up to 10 pages per query)
- Duplicate removal across queries

**Search Parameters**:
```javascript
{
  query: "Software Engineer",
  num_pages: 10,
  country: "us",
  language: "en",
  date_posted: "week",
  job_requirements: "more_than_3_years_experience"
}
```

### 4. Job Enrichment

**Description**: Fetches detailed job information for better matching

**Enrichment Process**:
- Batch processing (10 jobs per batch)
- Fetches: Qualifications, Responsibilities, Benefits
- Rate limit management (200ms delay between batches)
- Fallback to basic info if enrichment fails

**Benefits**:
- More accurate matching with detailed job descriptions
- Better understanding of job requirements
- Improved scoring accuracy

### 5. Hybrid Scoring Algorithm

**Description**: Advanced scoring combining keyword coverage and semantic similarity

**Formula**:
```
Final Score = (Coverage Score × 0.25) + (Semantic Similarity × 0.75)
```

**Components**:

#### A. Coverage Score (25% weight)
- Measures keyword overlap
- Formula: `common_keywords / jd_keywords`
- Ensures minimum required skills are present

#### B. Semantic Similarity (75% weight)
- Compares ALL resume keywords vs ALL JD keywords
- Uses all-mpnet-base-v2 embeddings
- Cosine similarity calculation
- Captures contextual relevance and transferable skills

**Example**:
```
Resume Keywords (114): Python, PyTorch, TensorFlow, Docker, AWS, ...
JD Keywords (27): Python, Machine Learning, AWS, ...
Common Keywords (11): Python, PyTorch, AWS, ...

Coverage Score: 11/27 = 40.7%
Semantic Similarity: cosine(resume_embedding, jd_embedding) = 79.7%
Final Score: (40.7 × 0.25) + (79.7 × 0.75) = 69.9%
```

### 6. Technical Keyword Extraction

**Description**: Comprehensive extraction of 400+ technical keywords

**Categories**:
- Programming Languages (Python, Java, JavaScript, etc.)
- ML/AI Frameworks (PyTorch, TensorFlow, Keras, etc.)
- Cloud Platforms (AWS, Azure, GCP)
- Databases (PostgreSQL, MongoDB, Snowflake, etc.)
- DevOps Tools (Docker, Kubernetes, Jenkins, CI/CD)
- Data Science Libraries (NumPy, Pandas, Matplotlib)
- Web Frameworks (FastAPI, Flask, Django, React)
- MLOps Tools (MLflow, Airflow, DVC)

**Features**:
- Case-insensitive matching
- Duplicate removal
- Proper casing for display
- Regex-based extraction

### 7. Experience Matching

**Description**: Filters jobs based on candidate experience level

**Matching Logic**:
```javascript
if (candidate_years === job_min_years) → 100% match
if (candidate_years === job_min_years - 1) → 80% match
if (candidate_years === job_min_years - 2) → 60% match
if (candidate_years >= job_min_years + 2) → 110% match (overqualified)
```

**Benefits**:
- Prevents showing senior roles to juniors
- Identifies overqualification
- Improves job relevance

### 8. Score Boosting

**Description**: Piecewise linear boosting to improve score distribution

**Boost Formula**:
```
80% → 90%
70% → 85%
65% → 80%
60% → 75%
50% → 65%
```

**Purpose**:
- Makes good matches stand out
- Improves user perception of match quality
- Maintains relative ranking

### 9. Job Ranking & Filtering

**Description**: Ranks and filters jobs for presentation

**Filters**:
- Minimum threshold: 40% (configurable)
- Experience match filter (Phase 1)
- Top N results: 120 jobs (configurable)

**Ranking**:
- Primary: Final score (descending)
- Secondary: Experience match
- Tertiary: Keyword match rate

### 10. Results Presentation

**Description**: Displays ranked job matches with detailed information

**Job Card Information**:
- Job title
- Company name
- Location
- Employment type
- Salary range (if available)
- Match score (%)
- Coverage score (%)
- Semantic similarity (%)
- Common keywords
- Missing keywords
- Experience match details

---

## Technical Architecture

### System Architecture

```
┌─────────────────┐
│   React Frontend│
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Express Backend│
│   (Node.js)     │
└────┬────┬───┬───┘
     │    │   │
     ↓    ↓   ↓
┌────────┐ ┌──────────┐ ┌──────────────┐
│MongoDB │ │Groq LLM  │ │JSearch API   │
│        │ │(Resume   │ │(Job Search)  │
│        │ │Parsing)  │ │              │
└────────┘ └──────────┘ └──────────────┘
     ↓
┌──────────────────┐
│Python Embedding  │
│Service (Flask)   │
│all-mpnet-base-v2 │
└──────────────────┘
```

### Component Breakdown

#### 1. Frontend (React)
- **Purpose**: User interface
- **Responsibilities**:
  - Resume upload
  - Job search initiation
  - Results display
  - Application tracking

#### 2. Backend (Node.js/Express)
- **Purpose**: API server and business logic
- **Key Services**:
  - `embeddingResumeController.js`: Main orchestrator
  - `groqService.js`: Resume parsing with LLM
  - `jsearchService.js`: Job search integration
  - `embeddingMatcherService.js`: Scoring engine
  - `technicalTerms.js`: Keyword extraction
  - `textPreprocessor.js`: Text cleaning

#### 3. Database (MongoDB)
- **Purpose**: Data persistence
- **Collections**:
  - `resumes`: Stored resume data
  - `appliedJobs`: Job application tracking
  - `tailoredResumes`: Custom resume versions

#### 4. Embedding Service (Python/Flask)
- **Purpose**: Generate semantic embeddings
- **Model**: all-mpnet-base-v2 (768 dimensions)
- **Endpoint**: `POST /embed`
- **Port**: 5001

#### 5. External APIs
- **Groq API**: LLM for resume parsing
- **JSearch API**: Job listings (via RapidAPI)

---

## User Flows

### Flow 1: Resume Upload & Job Matching

```
1. User uploads resume (PDF/DOCX)
   ↓
2. System calculates file hash
   ↓
3. Check for duplicate in MongoDB
   ↓
4. Extract text from resume
   ↓
5. Analyze with Groq LLM
   - Extract job roles, skills, experience
   - Filter intern roles if applicable
   ↓
6. Save/Update resume in MongoDB
   ↓
7. Build search queries from job roles
   ↓
8. Search jobs via JSearch API
   - Multiple queries (one per role)
   - Experience-based filtering
   - 10 pages per query
   ↓
9. Enrich jobs with detailed info
   - Batch processing (10 jobs/batch)
   - Fetch Qualifications, Responsibilities
   ↓
10. Extract technical keywords
    - From resume (once)
    - From each job description
    ↓
11. Score each job
    - Phase 1: Experience matching
    - Phase 2: Hybrid scoring (coverage + semantic)
    ↓
12. Rank and filter jobs
    - Minimum threshold: 40%
    - Top 120 results
    ↓
13. Return results to frontend
    ↓
14. Display ranked job matches
```

### Flow 2: Duplicate Resume Handling

```
1. User uploads same resume again
   ↓
2. System detects duplicate (file hash match)
   ↓
3. Extract text from new upload
   ↓
4. Re-analyze with Groq (latest logic)
   ↓
5. Update MongoDB with fresh analysis
   ↓
6. Use fresh analysis for job search
   ↓
7. Continue with normal flow
```

---

## Functional Requirements

### FR-1: Resume Upload


**ID**: FR-1  
**Priority**: P0 (Critical)  
**Description**: System shall accept resume uploads in PDF and DOCX formats

**Acceptance Criteria**:
- ✅ Accept PDF files up to 10MB
- ✅ Accept DOCX files up to 10MB
- ✅ Extract text from both formats
- ✅ Calculate SHA-256 file hash
- ✅ Detect duplicates based on hash
- ✅ Preserve DOCX format when possible
- ✅ Handle corrupted files gracefully

### FR-2: Resume Parsing

**ID**: FR-2  
**Priority**: P0 (Critical)  
**Description**: System shall parse resume and extract structured data using AI

**Acceptance Criteria**:
- ✅ Extract primary job roles
- ✅ Extract technical skills
- ✅ Extract programming languages
- ✅ Extract frameworks and tools
- ✅ Calculate experience years
- ✅ Determine experience level
- ✅ Extract education details
- ✅ Generate professional summary
- ✅ Parse within 3 seconds

### FR-3: Intern Role Filtering

**ID**: FR-3  
**Priority**: P1 (High)  
**Description**: System shall intelligently filter intern roles

**Acceptance Criteria**:
- ✅ If both intern and non-intern roles exist → use non-intern only
- ✅ If only intern roles exist → use intern roles
- ✅ Log filtering actions
- ✅ Apply filtering in both prompt and code

### FR-4: Job Search

**ID**: FR-4  
**Priority**: P0 (Critical)  
**Description**: System shall search for relevant jobs using JSearch API

**Acceptance Criteria**:
- ✅ Search using extracted job roles
- ✅ Apply experience-based filtering
- ✅ Search jobs from last week
- ✅ Support multiple queries
- ✅ Remove duplicate jobs
- ✅ Handle API rate limits
- ✅ Return results within 10 seconds

### FR-5: Job Enrichment

**ID**: FR-5  
**Priority**: P1 (High)  
**Description**: System shall enrich jobs with detailed information

**Acceptance Criteria**:
- ✅ Fetch Qualifications array
- ✅ Fetch Responsibilities array
- ✅ Fetch Benefits array
- ✅ Process in batches (10 jobs)
- ✅ Add 200ms delay between batches
- ✅ Handle enrichment failures gracefully

### FR-6: Keyword Extraction

**ID**: FR-6  
**Priority**: P0 (Critical)  
**Description**: System shall extract technical keywords from resume and JDs

**Acceptance Criteria**:
- ✅ Extract 400+ technical keyword patterns
- ✅ Case-insensitive matching
- ✅ Remove duplicates
- ✅ Proper casing for display
- ✅ Support regex patterns (e.g., C++)

### FR-7: Hybrid Scoring

**ID**: FR-7  
**Priority**: P0 (Critical)  
**Description**: System shall score jobs using hybrid algorithm

**Acceptance Criteria**:
- ✅ Calculate coverage score (common/total keywords)
- ✅ Generate embeddings for resume and JD keywords
- ✅ Calculate cosine similarity
- ✅ Apply 25%/75% weighting
- ✅ Boost final scores
- ✅ Score all jobs within 5 seconds

### FR-8: Experience Matching

**ID**: FR-8  
**Priority**: P1 (High)  
**Description**: System shall match jobs based on experience level

**Acceptance Criteria**:
- ✅ Filter jobs in Phase 1
- ✅ Calculate experience match percentage
- ✅ Apply experience-based multipliers
- ✅ Identify overqualification

### FR-9: Results Ranking

**ID**: FR-9  
**Priority**: P0 (Critical)  
**Description**: System shall rank and filter job results

**Acceptance Criteria**:
- ✅ Apply minimum threshold (40%)
- ✅ Sort by final score (descending)
- ✅ Return top 120 results
- ✅ Include match details
- ✅ Include common/missing keywords

### FR-10: Duplicate Handling

**ID**: FR-10  
**Priority**: P1 (High)  
**Description**: System shall handle duplicate resume uploads

**Acceptance Criteria**:
- ✅ Detect duplicates via file hash
- ✅ Re-analyze with latest logic
- ✅ Update MongoDB with fresh data
- ✅ Clear cached results
- ✅ Return updated analysis

---

## Non-Functional Requirements

### NFR-1: Performance

**Requirements**:
- Resume upload and parsing: < 5 seconds
- Job search and matching: < 10 seconds
- Total end-to-end: < 15 seconds
- Support 100 concurrent users
- Handle 1000 resumes/day

**Current Performance**:
- Resume parsing: ~2-3 seconds
- Job search (100 jobs): ~7-8 seconds
- Embedding generation: ~1 second
- Total: ~10-12 seconds ✅

### NFR-2: Scalability

**Requirements**:
- Horizontal scaling support
- Batch processing for large datasets
- Efficient database queries
- Caching for frequently accessed data

**Implementation**:
- Batch size: 10-20 (configurable)
- MongoDB indexing on fileHash
- In-memory caching for last analyzed resume
- Stateless API design

### NFR-3: Reliability

**Requirements**:
- 99.5% uptime
- Graceful error handling
- Automatic retry for failed API calls
- Data backup and recovery

**Implementation**:
- Try-catch blocks for all API calls
- Fallback to basic info if enrichment fails
- MongoDB replication
- Error logging and monitoring

### NFR-4: Security

**Requirements**:
- Secure file upload
- API key protection
- Data encryption at rest
- HTTPS for all communications

**Implementation**:
- Environment variables for API keys
- File type validation
- File size limits
- MongoDB encryption

### NFR-5: Maintainability

**Requirements**:
- Clean code architecture
- Comprehensive logging
- Modular design
- Documentation

**Implementation**:
- Service-based architecture
- Console logging at each step
- Separate concerns (controllers, services, models)
- Inline code comments

---

## API Specifications

### 1. Upload Resume

**Endpoint**: `POST /api/embedding-resume/upload`

**Request**:
```http
POST /api/embedding-resume/upload
Content-Type: multipart/form-data

file: <resume.pdf or resume.docx>
```

**Response**:
```json
{
  "message": "Resume uploaded and analyzed successfully",
  "_id": "507f1f77bcf86cd799439011",
  "analysis": {
    "primary_roles": ["Software Engineer"],
    "skills": ["Python", "JavaScript", "React"],
    "experience_level": "Mid",
    "experience_years": 4,
    "programming_languages": ["Python", "JavaScript"],
    "frameworks": ["React", "Node.js"],
    "tools": ["Git", "Docker"],
    "summary": "Experienced software engineer...",
    "education": ["BS Computer Science, MIT, 2019"]
  },
  "duplicate": false
}
```

### 2. Fetch Jobs

**Endpoint**: `POST /api/embedding-resume/fetch-jobs`

**Request**:
```http
POST /api/embedding-resume/fetch-jobs
Content-Type: application/json

{}
```

**Response**:
```json
{
  "message": "Jobs fetched and matched successfully",
  "totalJobs": 120,
  "matchedJobs": [
    {
      "job_id": "abc123",
      "job_title": "Senior Software Engineer",
      "employer_name": "Tech Corp",
      "employer_logo": "https://...",
      "job_city": "San Francisco",
      "job_state": "CA",
      "job_country": "US",
      "job_employment_type": "FULLTIME",
      "job_min_salary": 120000,
      "job_max_salary": 180000,
      "job_apply_link": "https://...",
      "job_description": "We are looking for...",
      "embedding_match_score": 85,
      "coverage_score_percent": 65,
      "semantic_similarity_percent": 92,
      "keyword_match_rate": 65.0,
      "common_keywords": ["Python", "AWS", "Docker"],
      "missing_keywords": ["Kubernetes", "Go"],
      "experience_match": {
        "required_min": 3,
        "required_max": 5,
        "candidate_years": 4,
        "match_percentage": 100
      }
    }
  ]
}
```

### 3. Get Scored Jobs

**Endpoint**: `GET /api/embedding-resume/scored-jobs`

**Response**:
```json
{
  "message": "Returning cached scored jobs",
  "totalJobs": 120,
  "matchedJobs": [...]
}
```

### 4. Get Last Analyzed Resume

**Endpoint**: `GET /api/embedding-resume/last-analyzed`

**Response**:
```json
{
  "filename": "resume.pdf",
  "uploadedAt": "2025-01-15T10:30:00Z",
  "analysis": {...}
}
```

---

## Data Models

### Resume Model

```javascript
{
  _id: ObjectId,
  fileName: String,
  fileUrl: String,
  fileType: String, // 'pdf' or 'docx'
  fileHash: String, // SHA-256 hash
  uploadedAt: Date,
  extractedData: {
    name: String,
    email: String,
    phone: String,
    primary_roles: [String],
    skills: [String],
    job_keywords: [String],
    experience_level: String,
    experience_years: Number,
    programming_languages: [String],
    frameworks: [String],
    tools: [String],
    summary: String,
    education: [{
      degree: String,
      college: String,
      year: String
    }],
    resumeFullText: String
  }
}
```

### Job Model (from JSearch)

```javascript
{
  job_id: String,
  job_title: String,
  employer_name: String,
  employer_logo: String,
  job_city: String,
  job_state: String,
  job_country: String,
  job_employment_type: String,
  job_min_salary: Number,
  job_max_salary: Number,
  job_apply_link: String,
  job_description: String,
  job_highlights: {
    Qualifications: [String],
    Responsibilities: [String],
    Benefits: [String]
  },
  job_required_experience: {
    required_experience_in_months: Number
  }
}
```

### Matched Job Model (Enhanced)

```javascript
{
  ...jobData,
  embedding_match_score: Number, // 0-100 (boosted)
  coverage_score_percent: Number, // 0-100
  semantic_similarity_percent: Number, // 0-100
  keyword_match_rate: Number, // 0-100
  common_keywords: [String],
  missing_keywords: [String],
  experience_match: {
    required_min: Number,
    required_max: Number,
    candidate_years: Number,
    match_percentage: Number
  },
  _debug: {
    coverage_score: Number,
    semantic_similarity: Number,
    final_score: Number,
    raw_final_percent: Number,
    boosted_final_percent: Number,
    formula: String
  }
}
```

---

## Algorithms & Scoring

### 1. Coverage Score Algorithm

```javascript
function calculateCoverageScore(resumeKeywords, jdKeywords) {
  const commonKeywords = findCommonKeywords(resumeKeywords, jdKeywords);
  return jdKeywords.length > 0 
    ? commonKeywords.length / jdKeywords.length 
    : 0;
}
```

**Example**:
```
Resume: [Python, AWS, Docker, Kubernetes, React]
JD: [Python, AWS, Machine Learning, TensorFlow]
Common: [Python, AWS]
Coverage: 2/4 = 50%
```

### 2. Semantic Similarity Algorithm

```javascript
async function calculateSemanticSimilarity(resumeKeywords, jdKeywords) {
  // Generate embeddings
  const resumeEmbedding = await generateEmbedding(resumeKeywords.join(' '));
  const jdEmbedding = await generateEmbedding(jdKeywords.join(' '));
  
  // Calculate cosine similarity
  return cosineSimilarity(resumeEmbedding, jdEmbedding);
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### 3. Hybrid Scoring Algorithm

```javascript
function calculateHybridScore(coverageScore, semanticSimilarity) {
  return (coverageScore * 0.25) + (semanticSimilarity * 0.75);
}
```

### 4. Score Boosting Algorithm

```javascript
function boostFinalScore(rawPercent) {
  if (rawPercent >= 80) return 90;
  if (rawPercent >= 70) return 85;
  if (rawPercent >= 65) return 80;
  if (rawPercent >= 60) return 75;
  if (rawPercent >= 50) return 65;
  return rawPercent;
}
```

### 5. Experience Matching Algorithm

```javascript
function calculateExperienceMatch(candidateYears, jobMinYears, jobMaxYears) {
  const diff = candidateYears - jobMinYears;
  
  if (diff === 0) return 1.00;  // Perfect match
  if (diff === -1) return 0.80; // 1 year less
  if (diff === -2) return 0.60; // 2 years less
  if (diff <= -3) return 0.40;  // 3+ years less
  if (diff === 1) return 1.05;  // 1 year more
  if (diff === 2) return 1.10;  // 2 years more
  if (diff >= 3) return 1.15;   // 3+ years more (overqualified)
  
  return 0;
}
```

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### 1. Match Accuracy
- **Target**: 70%+ of top 10 results are relevant
- **Measurement**: User feedback on job relevance
- **Current**: TBD (needs user testing)

#### 2. Processing Speed
- **Target**: < 15 seconds end-to-end
- **Measurement**: Server-side timing logs
- **Current**: ~10-12 seconds ✅

#### 3. User Engagement
- **Target**: 60%+ users return within 7 days
- **Measurement**: User analytics
- **Current**: TBD

#### 4. Application Rate
- **Target**: 30%+ of viewed jobs result in application
- **Measurement**: Click-through tracking
- **Current**: TBD

### Success Criteria

**Phase 1 (MVP) - Complete ✅**
- ✅ Resume upload and parsing
- ✅ Job search integration
- ✅ Hybrid scoring algorithm
- ✅ Results ranking and display

**Phase 2 (Beta) - In Progress**
- ⏳ User authentication
- ⏳ Application tracking
- ⏳ Resume tailoring
- ⏳ User feedback collection

**Phase 3 (Production)**
- ⬜ Advanced analytics
- ⬜ Email notifications
- ⬜ Mobile app
- ⬜ Premium features

---

## Future Enhancements

### Short-term (3-6 months)

1. **Resume Tailoring**
   - Generate customized resumes for specific jobs
   - Highlight relevant skills
   - Optimize for ATS systems

2. **Application Tracking**
   - Track applied jobs
   - Set reminders for follow-ups
   - Store application status

3. **User Authentication**
   - Secure user accounts
   - Save multiple resumes
   - Personalized dashboard

4. **Email Notifications**
   - New job matches
   - Application status updates
   - Weekly job digest

### Mid-term (6-12 months)

5. **Cover Letter Generation**
   - AI-generated cover letters
   - Customized for each job
   - Professional templates

6. **Interview Preparation**
   - Common interview questions
   - Company research
   - Salary negotiation tips

7. **Skill Gap Analysis**
   - Identify missing skills
   - Recommend learning resources
   - Track skill development

8. **Advanced Filters**
   - Salary range
   - Remote/hybrid/onsite
   - Company size
   - Industry

### Long-term (12+ months)

9. **Mobile Application**
   - iOS and Android apps
   - Push notifications
   - On-the-go job search

10. **Premium Features**
    - Unlimited job searches
    - Priority support
    - Advanced analytics
    - Resume review by experts

11. **Company Insights**
    - Company culture analysis
    - Employee reviews integration
    - Salary benchmarking
    - Growth trajectory

12. **AI Interview Coach**
    - Mock interviews
    - Real-time feedback
    - Video analysis
    - Confidence scoring

---

## Appendix

### A. Technical Keyword Categories

**Total Keywords**: 400+

**Categories**:
1. Programming Languages (20+)
2. ML/AI Frameworks (25+)
3. Data Science Libraries (10+)
4. Cloud Platforms (25+)
5. Databases (30+)
6. AI/ML Concepts (70+)
7. MLOps & Data Engineering (35+)
8. Web Frameworks (20+)
9. DevOps & Containerization (20+)
10. Version Control (15+)
11. Testing & Quality (15+)
12. Data Visualization (10+)
13. Operating Systems (15+)
14. Methodologies (20+)
15. Domain Areas (20+)
16. Security (15+)
17. Additional Tools (30+)

### B. API Rate Limits

**JSearch API**:
- Limit: 200 requests/month (free tier)
- Current usage tracking: Yes
- Delay between batches: 200ms
- Batch size: 10 jobs

**Groq API**:
- Limit: Varies by plan
- Current usage: ~1 request per resume
- Timeout: 10 seconds

**Embedding Service**:
- Local service (no external limits)
- Batch size: 20 jobs
- No delay between batches

### C. Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/resume-agent

# API Keys
GROQ_API_KEY=your_groq_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Services
EMBEDDING_SERVICE_URL=http://localhost:5001

# Server
PORT=3001
```

### D. Deployment Checklist

- [ ] Set up production MongoDB
- [ ] Configure environment variables
- [ ] Deploy embedding service
- [ ] Set up HTTPS
- [ ] Configure CORS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation review

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Product Team | Initial PRD creation |

---

## Approval

**Product Manager**: _________________ Date: _______

**Engineering Lead**: _________________ Date: _______

**Design Lead**: _________________ Date: _______

---

**End of Document**
