# Resume Tailoring Python Service

This service modifies DOCX resumes while preserving their original formatting.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variable:
```bash
export GROQ_API_KEY=your_groq_api_key
```

3. Run the service:
```bash
python resume_tailor.py
```

The service will run on `http://localhost:5002`

## API Endpoints

### POST /tailor
Tailor a DOCX resume for a specific job.

**Request:**
- `file`: DOCX file (multipart/form-data)
- `jobDescription`: Job description text
- `jobTitle`: Job title
- `company`: Company name

**Response:**
- Returns tailored DOCX file for download

### GET /health
Health check endpoint.

## How It Works

1. **Analyzes Job Description** - Extracts required skills, keywords, and domain
2. **Extracts Candidate Skills** - Parses resume to find existing skills
3. **Gap Analysis** - Identifies what skills can be added honestly
4. **Section Detection** - Identifies which sections to modify
5. **Smart Modification** - Modifies bullets and skills while preserving formatting
6. **Returns DOCX** - Original formatting preserved

## Features

- ✅ Preserves original DOCX formatting (fonts, colors, spacing)
- ✅ Only modifies relevant sections (Experience, Projects, Skills)
- ✅ Adds skills honestly (no fabrication)
- ✅ Enhances bullets with job-relevant keywords
- ✅ Domain-aware tailoring (Data Science, Full Stack, etc.)

## Integration with Node.js Backend

The Node.js backend can call this service via HTTP:

```javascript
const FormData = require('form-data');
const form = new FormData();
form.append('file', docxBuffer, 'resume.docx');
form.append('jobDescription', jobDescription);
form.append('jobTitle', jobTitle);
form.append('company', company);

const response = await fetch('http://localhost:5002/tailor', {
  method: 'POST',
  body: form
});

const tailoredDocx = await response.buffer();
```

## Note

This service requires DOCX files. For PDF uploads, the Node.js backend will use the fallback method (generate new DOCX with tailored content).
