/**
 * Test LLM-Based Keyword Extraction using Groq
 * 
 * Simple approach: Extract flat array of technical keywords from resume and JD
 * Then compare to find common and missing keywords
 * 
 * Usage: node test/test-llm-keyword-extraction.js
 */

const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config({ path: path.join(__dirname, '../src/.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + colors.cyan + title + colors.reset);
  console.log('='.repeat(80));
}

function printSection(title) {
  console.log('\n' + colors.bright + colors.blue + title + colors.reset);
  console.log('-'.repeat(80));
}

/**
 * Extract technical keywords from resume using Groq LLM
 */
async function extractResumeKeywords(text) {
  const prompt = `You are an expert technical recruiter and keyword extraction engine.

Your task: extract every technical keyword and skill phrase from the RESUME below.

WHAT TO EXTRACT — include ALL of the following types:

1. Programming languages          → exact names: Python, SQL, Bash, R, Scala, Go
2. Frameworks & libraries         → React, PyTorch, TensorFlow, FastAPI, Django, LangChain
3. Tools & platforms              → Docker, Kubernetes, Git, Airflow, MLflow, Postman
4. Cloud services                 → AWS S3, EC2, SageMaker, Azure ML, GCP BigQuery, Lambda
5. Databases                      → PostgreSQL, MongoDB, Redis, Elasticsearch, Cassandra
6. Technical methodologies        → CI/CD pipeline, MLOps, DevOps, Agile, A/B testing
7. Technical processes/concepts   → model deployment, feature engineering, data ingestion,
                                    distributed training, hyperparameter tuning,
                                    batch processing, stream processing, model monitoring,
                                    transfer learning, fine-tuning, zero-shot learning,
                                    semantic search, vector embeddings, prompt engineering
8. Domain areas                   → Machine Learning, NLP, Computer Vision, Data Engineering,
                                    Deep Learning, Generative AI, Reinforcement Learning
9. Soft / professional skills     → team leadership, cross-functional collaboration

RULES:
- Extract ONLY keywords that are explicitly mentioned in the resume
- Do NOT infer or add keywords that are not present
- Extract exact phrases as they appear — do NOT paraphrase or generalize
- Include version numbers if mentioned (e.g. Python 3.10, TensorFlow 2.x)
- Normalize casing to Title Case (e.g. "pytorch" → "PyTorch")
- Do NOT include job titles, company names, or years of experience

OUTPUT FORMAT — return ONLY a simple JSON array, no explanation, no markdown fences:

["Python", "SQL", "PyTorch", "TensorFlow", "Docker", "Kubernetes", ...]

RESUME:
${text.substring(0, 10000)}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 2000,
    top_p: 0.9,
  });

  const raw = response.choices[0].message.content.trim();
  
  let parsed = null;
  try {
    const cleanedJson = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
    parsed = JSON.parse(cleanedJson);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    }
  }

  if (!parsed || !Array.isArray(parsed)) {
    throw new Error("Could not parse array from Groq response");
  }
  
  return parsed;
}

/**
 * Extract technical keywords from JD using Groq LLM
 */
async function extractJDKeywords(text) {
  const prompt = `You are an expert technical recruiter and keyword extraction engine.

Your task: extract every required and preferred technical keyword and skill phrase from the JOB DESCRIPTION below.

WHAT TO EXTRACT — include ALL of the following types:

1. Programming languages          → exact names: Python, SQL, Bash, R, Scala, Go
2. Frameworks & libraries         → React, PyTorch, TensorFlow, FastAPI, Django, LangChain
3. Tools & platforms              → Docker, Kubernetes, Git, Airflow, MLflow, Postman
4. Cloud services                 → AWS S3, EC2, SageMaker, Azure ML, GCP BigQuery, Lambda
5. Databases                      → PostgreSQL, MongoDB, Redis, Elasticsearch, Cassandra
6. Technical methodologies        → CI/CD pipeline, MLOps, DevOps, Agile, A/B testing
7. Technical processes/concepts   → model deployment, feature engineering, data ingestion,
                                    distributed training, hyperparameter tuning,
                                    batch processing, stream processing, model monitoring,
                                    transfer learning, fine-tuning, zero-shot learning,
                                    semantic search, vector embeddings, prompt engineering
8. Domain areas                   → Machine Learning, NLP, Computer Vision, Data Engineering,
                                    Deep Learning, Generative AI, Reinforcement Learning
9. Soft / professional skills     → team leadership, cross-functional collaboration

RULES:
- Extract ONLY keywords that are explicitly mentioned in the job description
- Do NOT infer or add keywords that are not present
- Extract exact phrases as written — do NOT paraphrase or generalize
- Include version numbers if mentioned (e.g. Python 3.10, TensorFlow 2.x)
- Normalize casing to Title Case (e.g. "pytorch" → "PyTorch")
- Do NOT include job titles, company names, salary, or location

OUTPUT FORMAT — return ONLY a simple JSON array, no explanation, no markdown fences:

["Python", "SQL", "Machine Learning", "AWS", "Docker", ...]

JOB DESCRIPTION:
${text.substring(0, 10000)}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 2000,
    top_p: 0.9,
  });

  const raw = response.choices[0].message.content.trim();
  
  let parsed = null;
  try {
    const cleanedJson = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
    parsed = JSON.parse(cleanedJson);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    }
  }

  if (!parsed || !Array.isArray(parsed)) {
    throw new Error("Could not parse array from Groq response");
  }
  
  return parsed;
}

/**
 * Find common keywords
 */
function findCommonKeywords(resumeKeywords, jdKeywords) {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  return jdKeywords.filter(k => resumeSet.has(k.toLowerCase()));
}

/**
 * Find missing keywords
 */
function findMissingKeywords(resumeKeywords, jdKeywords) {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  return jdKeywords.filter(k => !resumeSet.has(k.toLowerCase()));
}

async function main() {
  printHeader('🤖 LLM-BASED KEYWORD EXTRACTION TEST (GROQ)');
  console.log(colors.cyan + 'Using Groq LLM to extract technical keywords!' + colors.reset);
  
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  console.log(`\nResume: ${resumeText.length} characters`);
  console.log(`JD: ${jdText.length} characters`);
  
  // Extract from resume
  printSection('📄 STEP 1: EXTRACT KEYWORDS FROM RESUME (using LLM)');
  console.log('Analyzing resume with Groq LLM...');
  const resumeKeywords = await extractResumeKeywords(resumeText);
  
  console.log(`\n${colors.green}Resume Keywords (${resumeKeywords.length}):${colors.reset}`);
  console.log(resumeKeywords.join(', '));
  
  // Extract from JD
  printSection('📋 STEP 2: EXTRACT KEYWORDS FROM JOB DESCRIPTION (using LLM)');
  console.log('Analyzing job description with Groq LLM...');
  const jdKeywords = await extractJDKeywords(jdText);
  
  console.log(`\n${colors.green}JD Keywords (${jdKeywords.length}):${colors.reset}`);
  console.log(jdKeywords.join(', '));
  
  // Compare
  printSection('🔍 STEP 3: COMPARE KEYWORDS');
  
  const commonKeywords = findCommonKeywords(resumeKeywords, jdKeywords);
  const missingKeywords = findMissingKeywords(resumeKeywords, jdKeywords);
  
  const matchPercentage = jdKeywords.length > 0 
    ? ((commonKeywords.length / jdKeywords.length) * 100).toFixed(1)
    : 0;
  
  console.log(`\n${colors.green}✅ Common Keywords (${commonKeywords.length}):${colors.reset}`);
  console.log(commonKeywords.join(', ') || 'None');
  
  console.log(`\n${colors.red}❌ Missing Keywords (${missingKeywords.length}):${colors.reset}`);
  console.log(missingKeywords.join(', ') || 'None');
  
  console.log(`\n${colors.bright}📊 Match Percentage: ${matchPercentage}%${colors.reset}`);
  console.log(`   (${commonKeywords.length} out of ${jdKeywords.length} JD keywords found in resume)`);
  
  // Interpretation
  printSection('💡 INTERPRETATION');
  
  if (parseFloat(matchPercentage) >= 80) {
    console.log(colors.green + `✅ EXCELLENT KEYWORD MATCH (${matchPercentage}%)` + colors.reset);
    console.log('Your resume contains most of the technical keywords from the JD.');
  } else if (parseFloat(matchPercentage) >= 60) {
    console.log(colors.cyan + `✅ GOOD KEYWORD MATCH (${matchPercentage}%)` + colors.reset);
    console.log('Your resume has good keyword coverage.');
  } else if (parseFloat(matchPercentage) >= 40) {
    console.log(colors.yellow + `⚠️  FAIR KEYWORD MATCH (${matchPercentage}%)` + colors.reset);
    console.log('Consider adding some missing keywords to your resume.');
  } else {
    console.log(colors.red + `❌ WEAK KEYWORD MATCH (${matchPercentage}%)` + colors.reset);
    console.log('Your resume is missing many keywords from the JD.');
  }
  
  if (missingKeywords.length > 0) {
    printSection('🎯 TOP MISSING KEYWORDS TO ADD');
    console.log('\nConsider adding these keywords to your resume:');
    console.log(colors.yellow + missingKeywords.slice(0, 15).join(', ') + colors.reset);
  }
  
  printHeader('✅ SUMMARY');
  console.log(`\n${colors.bright}Resume:${colors.reset} [${resumeKeywords.join(', ')}]`);
  console.log(`\n${colors.bright}JD:${colors.reset} [${jdKeywords.join(', ')}]`);
  console.log(`\n${colors.bright}Common:${colors.reset} [${commonKeywords.join(', ')}]`);
  console.log(`\n${colors.bright}Missing:${colors.reset} [${missingKeywords.join(', ')}]`);
  console.log(`\n${colors.bright}Match:${colors.reset} ${matchPercentage}%\n`);
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
