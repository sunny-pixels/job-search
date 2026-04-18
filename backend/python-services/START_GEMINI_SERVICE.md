# Start Gemini Resume Tailoring Service

## Overview

New Gemini-based tailoring service that intelligently modifies resumes while preserving formatting.

**Port:** 5004  
**Model:** gemini-2.0-flash-exp (Google's latest fast model)

## Setup

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Update .env File

```bash
cd backend/python-services
nano .env
```

Add your Gemini API key:
```
GEMINI_API_KEY=AIzaSy...your_key_here
```

### Step 3: Install Dependencies

```bash
pip3 install -r requirements.txt
```

This will install:
- `google-genai` - Official Gemini SDK
- Other existing dependencies

### Step 4: Start the Service

```bash
PORT=5004 python3 resume_tailor_gemini.py
```

You should see:
```
================================================================================
🚀 Starting Resume Tailor Service (Gemini)
📍 Port: 5004
🤖 Model: gemini-2.0-flash-exp
================================================================================
```

## How It Works

### 1. Parse Resume
- Extracts all paragraphs and table cells
- Preserves formatting metadata (bold, italic, font size)
- Creates structured JSON representation

### 2. Call Gemini AI
- Sends resume structure + job description to Gemini
- Gemini analyzes and suggests targeted changes
- Returns JSON patches with specific modifications

### 3. Apply Patches
- Updates only the text content
- Preserves ALL formatting (fonts, colors, styles)
- Maintains document structure

### 4. Return Tailored Resume
- Same format as original
- Enhanced with job-relevant keywords
- Skills section updated intelligently

## What Gets Modified

✅ **Skills Section** - Adds missing skills from job description  
✅ **Summary** - Adds relevant soft skills if summary exists  
✅ **Projects** - Adds technologies that fit project domain  
❌ **Experience** - Does NOT fabricate experience  
❌ **Education** - Does NOT modify education  
❌ **Formatting** - 100% preserved  

## Service Priority

The backend tries services in this order:

1. **Gemini Service** (Port 5004) - Preferred, most intelligent
2. **Python Service** (Port 5002) - Fallback, skills-only
3. **Node.js Service** - Last resort, generates new DOCX

## Testing

### Test Health Endpoint
```bash
curl http://localhost:5004/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "resume-tailor-gemini",
  "model": "gemini-2.0-flash-exp"
}
```

### Test from UI
1. Upload your resume
2. Select a job
3. Click "Tailor Resume"
4. Check logs to see which service was used

## Logs to Watch

```
🎯 [TAILOR-GEMINI] New tailoring request received
📄 [TAILOR-GEMINI] File: resume.docx
💼 [TAILOR-GEMINI] Job: Full Stack Developer at Google
📝 [TAILOR-GEMINI] JD length: 1250 chars

[1/3] Parsing resume...
📋 [PARSE] Parsed 85 blocks (78 body paras + table cells)

[2/3] Tailoring with Gemini...
🤖 [GEMINI] Calling gemini-2.0-flash-exp...
✅ [GEMINI] Response received (2341 chars)
  📊 Gemini suggested 5 patch(es)

[3/3] Applying patches...
  ✏️  Block #65  |  Added missing skills to technical skills section
  OLD: Python • R • Git • GitLab • GitHub • Bitbucket • APIs
  NEW: Python • R • Git • GitLab • GitHub • Bitbucket • APIs • Docker • AWS • Kubernetes

  ✅ 5 change(s) applied

✅ [TAILOR-GEMINI] Success! Returning 18234 bytes
```

## Comparison: Gemini vs Groq

| Feature | Gemini (Port 5004) | Groq (Port 5002) |
|---------|-------------------|------------------|
| **Intelligence** | ✅ Very High | ⚠️ Medium |
| **Format Preservation** | ✅ Perfect | ✅ Good |
| **Speed** | ⚠️ 5-10 seconds | ✅ 2-3 seconds |
| **Cost** | ✅ Free (generous limits) | ✅ Free |
| **Modifications** | ✅ Smart, contextual | ⚠️ Skills only |
| **Safety** | ✅ Never fabricates | ✅ Never fabricates |

## Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env` file exists in `backend/python-services/`
- Verify key is set: `cat backend/python-services/.env`
- Or export manually: `export GEMINI_API_KEY=your_key`

### "Port 5004 already in use"
```bash
# Find process
lsof -ti:5004

# Kill it
lsof -ti:5004 | xargs kill

# Or use different port
PORT=5005 python3 resume_tailor_gemini.py
```

### "Module 'google.genai' not found"
```bash
# Uninstall old SDK
pip3 uninstall google-generativeai -y

# Install new SDK
pip3 install google-genai
```

### Service not being used
- Check backend logs to see which service is called
- Verify Gemini service is running: `curl http://localhost:5004/health`
- Check `.env` has `GEMINI_TAILOR_URL=http://localhost:5004`

## Running All Services

For best results, run all three services:

**Terminal 1 - Gemini (Preferred):**
```bash
cd backend/python-services
PORT=5004 python3 resume_tailor_gemini.py
```

**Terminal 2 - Groq (Fallback):**
```bash
cd backend/python-services
PORT=5002 python3 resume_tailor.py
```

**Terminal 3 - Backend:**
```bash
cd backend/src
npm start
```

## Benefits of Gemini Service

1. **Smarter** - Understands context better than rule-based systems
2. **Safer** - Never fabricates experience or education
3. **Precise** - Only modifies what needs changing
4. **Format-preserving** - 100% maintains your document structure
5. **ATS-friendly** - Adds keywords naturally, not stuffed

## API Key Limits

Gemini free tier:
- 15 requests per minute
- 1 million tokens per day
- More than enough for personal use

If you hit limits, the service will fall back to Groq automatically.
