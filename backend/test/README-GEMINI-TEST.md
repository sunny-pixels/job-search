# LLM-Based Resume-JD Matching Test with Gemini

## Overview
This test uses Google's Gemini AI to score how well a resume matches a job description, similar to uploading both documents to Gemini's online platform.

## What It Does
1. Reads `resume.txt` and `jd.txt` from the test folder
2. Sends both to Gemini with a detailed scoring prompt
3. Gets back:
   - Overall match score (0-100%)
   - Skills match score
   - Experience match score
   - Education match score
   - Key strengths (what makes the candidate a good fit)
   - Key gaps (what's missing or weak)
   - Recommendation (STRONG_MATCH, GOOD_MATCH, MODERATE_MATCH, WEAK_MATCH)
4. Displays results in a formatted output
5. Saves results to `gemini-match-result.json`

## Installation

### Step 1: Install Google Generative AI Package
```bash
cd backend
npm install @google/generative-ai
```

### Step 2: Verify API Key
Make sure `GEMINI_API_KEY` is set in `backend/src/.env`:
```
GEMINI_API_KEY=AIzaSy...
```

## Usage

### Run the Test
```bash
cd backend/test
node test-llm-gemini.js
```

### Expected Output
```
🧪 Starting LLM-Based Resume-JD Matching Test with Gemini

✅ Gemini API key found

📄 Reading test files...
   Resume: 8234 characters
   Job Description: 3456 characters

🤖 [Gemini] Analyzing resume-JD match...

✅ Analysis complete in 4.23s

════════════════════════════════════════════════════════════════════════════════
📊 GEMINI AI RESUME-JD MATCH ANALYSIS
════════════════════════════════════════════════════════════════════════════════

🟢 OVERALL MATCH SCORE: 85%

📈 DETAILED SCORES:
   Skills Match:     90%
   Experience Match: 85%
   Education Match:  80%

✅ RECOMMENDATION: STRONG_MATCH

📝 ANALYSIS:
   The candidate is an excellent match with 5+ years of ML/AI experience, strong
   Python and cloud skills, and proven track record in NLP and LLM work. Minor
   gaps in specific HR domain experience.

✅ KEY STRENGTHS:
   1. 5+ years of AI/ML experience exceeds the 2-year requirement
   2. Strong expertise in Python, PyTorch, TensorFlow, and NLP
   3. Hands-on experience with LLMs, transformers, and prompt engineering
   4. Cloud platform experience (AWS, Azure) aligns with job requirements
   5. MLOps and production deployment experience

❌ KEY GAPS:
   1. No specific HR or People Analytics domain experience mentioned
   2. Limited mention of statistical modeling and A/B testing
   3. No explicit experience with Snowflake (preferred qualification)

════════════════════════════════════════════════════════════════════════════════

💾 Results saved to: gemini-match-result.json

════════════════════════════════════════════════════════════════════════════════
✅ TEST COMPLETED SUCCESSFULLY
════════════════════════════════════════════════════════════════════════════════
```

## Output File
Results are saved to `gemini-match-result.json`:
```json
{
  "overall_match_score": 85,
  "skills_match_score": 90,
  "experience_match_score": 85,
  "education_match_score": 80,
  "key_strengths": [
    "5+ years of AI/ML experience exceeds the 2-year requirement",
    "Strong expertise in Python, PyTorch, TensorFlow, and NLP",
    "Hands-on experience with LLMs, transformers, and prompt engineering",
    "Cloud platform experience (AWS, Azure) aligns with job requirements",
    "MLOps and production deployment experience"
  ],
  "key_gaps": [
    "No specific HR or People Analytics domain experience mentioned",
    "Limited mention of statistical modeling and A/B testing",
    "No explicit experience with Snowflake (preferred qualification)"
  ],
  "recommendation": "STRONG_MATCH",
  "detailed_analysis": "The candidate is an excellent match with 5+ years of ML/AI experience..."
}
```

## Customization

### Test with Different Files
Replace `resume.txt` and `jd.txt` with your own content.

### Adjust Scoring Criteria
Edit the prompt in `test-llm-gemini.js` to change:
- Scoring weights
- Analysis depth
- Output format
- Recommendation thresholds

### Use Different Gemini Model
Change the model in the code:
```javascript
// Current: gemini-1.5-pro (best quality, slower)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Alternative: gemini-1.5-flash (faster, good quality)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

## Performance

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| gemini-1.5-pro | 4-6s | Excellent | Higher |
| gemini-1.5-flash | 2-3s | Very Good | Lower |

## Comparison: Gemini vs Embedding-Based Scoring

| Aspect | Gemini (LLM) | Embedding-Based |
|--------|--------------|-----------------|
| **Accuracy** | 90-95% | 85-90% |
| **Speed** | 4-6 seconds | 0.5-1 second |
| **Cost** | ~$0.03 per match | Free (local) |
| **Reasoning** | Provides detailed analysis | No explanation |
| **Context Understanding** | Excellent | Good |
| **Scalability** | Limited (API rate limits) | Excellent |

## Use Cases

### When to Use Gemini (LLM):
- ✅ Final candidate screening (top 10-20 candidates)
- ✅ Detailed match analysis needed
- ✅ Explaining match scores to users
- ✅ Quality over speed

### When to Use Embeddings:
- ✅ Initial filtering (100+ jobs)
- ✅ Real-time matching
- ✅ High-volume processing
- ✅ Speed over detailed analysis

## Troubleshooting

### Error: "GEMINI_API_KEY not found"
- Check that `.env` file exists in `backend/src/`
- Verify the API key is set correctly

### Error: "Module not found: @google/generative-ai"
- Run: `npm install @google/generative-ai`

### Error: "API key invalid"
- Get a new API key from: https://makersuite.google.com/app/apikey
- Update `GEMINI_API_KEY` in `.env`

### Slow Response (>10 seconds)
- Switch to `gemini-1.5-flash` model
- Check internet connection
- Verify API quota limits

## API Limits

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day

**Paid Tier:**
- Higher rate limits
- Better performance
- Priority access

## Next Steps

1. **Integrate into Main Flow**: Add Gemini scoring as an optional feature
2. **Batch Processing**: Score multiple jobs in parallel
3. **Caching**: Cache scores to avoid re-scoring same resume-JD pairs
4. **Hybrid Approach**: Use embeddings for filtering, Gemini for top candidates
