/**
 * Test LLM-Based Keyword Extraction using Groq
 *
 * Approach:
 *  1. Extract clean technical keywords from resume (strict — tools/tech/skills only)
 *  2. Extract keywords from JD
 *  3. Semantic matching via a third LLM call (handles abbreviations, synonyms, partials)
 *
 * Usage: node test/test-llm-keyword-extraction.js
 */

const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config({ path: path.join(__dirname, '../src/.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const colors = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
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

// ---------------------------------------------------------------------------
// STEP 1 — Extract keywords from RESUME
// ---------------------------------------------------------------------------
async function extractResumeKeywords(text) {
  const prompt = `You are an expert technical recruiter and keyword extraction engine.

Extract technical keywords and skill phrases ONLY from the RESUME text provided below.

CATEGORIES TO LOOK FOR (use these as guidance only — do NOT copy them as keywords):
- Named programming languages
- Named frameworks and libraries
- Named tools and platforms
- Named cloud services and products
- Named databases
- Technical methodologies (e.g. CI/CD, MLOps, A/B testing)
- Well-defined domain/skill areas (e.g. NLP, Computer Vision, Reinforcement Learning)
- Soft or professional skills explicitly mentioned

STRICT RULES:
- Extract ONLY named tools, technologies, frameworks, libraries, platforms,
  databases, methodologies, and well-defined domain/skill areas
- Do NOT extract outcome phrases or business results
  (e.g. NOT "Production Failures", "Task Success Rates", "Decision Accuracy")
- Do NOT extract generic adjectives or descriptors used in sentences
  (e.g. NOT "Scalable", "Real-Time", "Enterprise Environments", "Cloud-Native")
- Do NOT extract verbs or action phrases
  (e.g. NOT "Model Learning", "Issue Resolution", "Feedback")
- Each keyword must be something a recruiter would type into a LinkedIn skills search
- Extract ONLY words/phrases that literally appear in the provided text
- Do NOT add keywords you think "should" be there — only what is written
- Do NOT copy examples from these instructions
- Normalize casing to Title Case (e.g. "pytorch" → "PyTorch", "nlp" → "NLP")
- Remove duplicates

OUTPUT: Return ONLY a JSON array with no markdown fences and no explanation.
Example format: ["Python", "PyTorch", "Docker", "MLOps", "NLP"]

RESUME:
${text.substring(0, 10000)}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.0,
    max_tokens: 2000,
    top_p: 1.0,
  });

  return parseJsonArray(response.choices[0].message.content.trim(), 'Resume');
}

// ---------------------------------------------------------------------------
// STEP 2 — Extract keywords from JD
// ---------------------------------------------------------------------------
async function extractJDKeywords(text) {
  const prompt = `You are an expert technical recruiter and keyword extraction engine.

Extract technical keywords and skill phrases ONLY from the JOB DESCRIPTION text provided below.

CATEGORIES TO LOOK FOR (use these as guidance only — do NOT copy them as keywords):
- Named programming languages
- Named frameworks and libraries
- Named tools and platforms
- Named cloud services and products
- Named databases
- Technical methodologies (e.g. CI/CD, MLOps, RAG, prompt engineering)
- Well-defined domain/skill areas (e.g. NLP, Computer Vision, Deep Learning)
- Soft or professional skills explicitly mentioned

STRICT RULES:
- Extract ONLY named tools, technologies, frameworks, libraries, platforms,
  databases, methodologies, and well-defined domain/skill areas
- Do NOT extract outcome phrases, business results, or generic descriptors
- Do NOT extract degree types, field names, or academic qualifications
  (e.g. NOT "Bachelor's Degree", "STEM", "Statistics", "Economics", "Mathematics")
- Each keyword must be something a recruiter would type into a LinkedIn skills search
- Extract ONLY words/phrases that literally appear in the provided text
- Do NOT add keywords you think "should" be there — only what is written
- Do NOT copy examples from these instructions
- Normalize casing to Title Case (e.g. "pytorch" → "PyTorch")
- Remove duplicates

OUTPUT: Return ONLY a JSON array with no markdown fences and no explanation.
Example format: ["Python", "SQL", "AWS", "LangChain", "Hugging Face Transformers"]

JOB DESCRIPTION:
${text.substring(0, 10000)}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.0,
    max_tokens: 2000,
    top_p: 1.0,
  });

  return parseJsonArray(response.choices[0].message.content.trim(), 'JD');
}

// ---------------------------------------------------------------------------
// STEP 3 — Semantic matching via LLM
// ---------------------------------------------------------------------------
async function semanticMatch(resumeKeywords, jdKeywords) {
  const prompt = `You are an expert technical recruiter comparing a candidate's resume skills to job requirements.

Your task: for each JD keyword, decide whether the resume keywords cover it.

MATCHING RULES:
- "matched"  → the resume has this skill (exact or clear semantic equivalent)
              Examples: "NLP" covers "Natural Language Processing"
                        "LLM" covers "Large Language Models"
                        "PyTorch" covers "Pytorch" (casing difference)
                        "Transformers" + "Hugging Face" together cover "Hugging Face Transformers"
                        "Fine-Tuning" covers "Fine-Tuning Transformers"
- "partial"  → the resume has a related but broader/narrower term, not a full match
              Examples: resume has "Transformers" but JD wants "Hugging Face Transformers" specifically
                        resume has "AWS" but JD wants "AWS SageMaker" specifically
- "missing"  → the resume has no equivalent for this JD keyword at all

Resume Keywords:
${JSON.stringify(resumeKeywords, null, 2)}

JD Keywords:
${JSON.stringify(jdKeywords, null, 2)}

Return ONLY a valid JSON object in exactly this format, no markdown, no explanation:
{
  "matched": ["keyword1", "keyword2"],
  "partial": ["keyword3"],
  "missing": ["keyword4", "keyword5"]
}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.0,
    max_tokens: 1500,
    top_p: 1.0,
  });

  const raw = response.choices[0].message.content.trim();

  let parsed = null;
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
    parsed = JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Could not parse semantic match result from Groq response');
  }

  // Ensure all three keys exist
  parsed.matched = parsed.matched || [];
  parsed.partial = parsed.partial || [];
  parsed.missing = parsed.missing || [];

  return parsed;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseJsonArray(raw, label) {
  let parsed = null;
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
    parsed = JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
  }

  if (!parsed || !Array.isArray(parsed)) {
    throw new Error(`Could not parse array from Groq response for ${label}`);
  }

  // Deduplicate (case-insensitive)
  const seen = new Set();
  return parsed.filter(k => {
    const lower = k.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function matchScore(matched, partial, total) {
  if (total === 0) return 0;
  // Partial counts as 0.5
  const score = matched.length + partial.length * 0.5;
  return ((score / total) * 100).toFixed(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  printHeader('🤖 LLM-BASED KEYWORD EXTRACTION & SEMANTIC MATCHING (GROQ)');
  console.log(colors.cyan + 'Extract → Extract → Semantic Match via LLM' + colors.reset);

  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath     = path.join(__dirname, 'jd.txt');

  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText     = fs.readFileSync(jdPath, 'utf-8');

  console.log(`\nResume: ${resumeText.length} characters`);
  console.log(`JD:     ${jdText.length} characters`);

  // ── Step 1: Resume keywords ──────────────────────────────────────────────
  printSection('📄 STEP 1: EXTRACT KEYWORDS FROM RESUME');
  console.log('Analyzing resume with Groq LLM...');
  const resumeKeywords = await extractResumeKeywords(resumeText);

  console.log(`\n${colors.green}Resume Keywords (${resumeKeywords.length}):${colors.reset}`);
  console.log(resumeKeywords.join(', '));

  // ── Step 2: JD keywords ─────────────────────────────────────────────────
  printSection('📋 STEP 2: EXTRACT KEYWORDS FROM JOB DESCRIPTION');
  console.log('Analyzing job description with Groq LLM...');
  const jdKeywords = await extractJDKeywords(jdText);

  console.log(`\n${colors.green}JD Keywords (${jdKeywords.length}):${colors.reset}`);
  console.log(jdKeywords.join(', '));

  // ── Step 3: Semantic match ───────────────────────────────────────────────
  printSection('🧠 STEP 3: SEMANTIC KEYWORD MATCHING');
  console.log('Running semantic comparison with Groq LLM...');
  const result = await semanticMatch(resumeKeywords, jdKeywords);

  const { matched, partial, missing } = result;
  const totalJD  = jdKeywords.length;
  const score    = matchScore(matched, partial, totalJD);
  const scoreNum = parseFloat(score);

  console.log(`\n${colors.green}✅ Matched (${matched.length}):${colors.reset}`);
  console.log(matched.join(', ') || 'None');

  console.log(`\n${colors.yellow}⚠️  Partial Match (${partial.length}):${colors.reset}`);
  console.log(partial.join(', ') || 'None');

  console.log(`\n${colors.red}❌ Missing (${missing.length}):${colors.reset}`);
  console.log(missing.join(', ') || 'None');

  console.log(`\n${colors.bright}📊 Match Score: ${score}%${colors.reset}`);
  console.log(`   (${matched.length} full + ${partial.length} partial × 0.5 out of ${totalJD} JD keywords)`);

  // ── Interpretation ───────────────────────────────────────────────────────
  printSection('💡 INTERPRETATION');

  if (scoreNum >= 80) {
    console.log(colors.green + `✅ EXCELLENT MATCH (${score}%)` + colors.reset);
    console.log('Your resume covers almost all technical keywords from the JD.');
  } else if (scoreNum >= 60) {
    console.log(colors.cyan + `✅ GOOD MATCH (${score}%)` + colors.reset);
    console.log('Your resume has solid keyword coverage with a few gaps.');
  } else if (scoreNum >= 40) {
    console.log(colors.yellow + `⚠️  FAIR MATCH (${score}%)` + colors.reset);
    console.log('Consider adding missing keywords to your resume where applicable.');
  } else {
    console.log(colors.red + `❌ WEAK MATCH (${score}%)` + colors.reset);
    console.log('Your resume is missing many keywords from the JD.');
  }

  // ── Recommendations ──────────────────────────────────────────────────────
  if (missing.length > 0) {
    printSection('🎯 KEYWORDS TO ADD TO YOUR RESUME');
    console.log('\nThese JD keywords are completely absent from your resume:');
    console.log(colors.red + missing.join(', ') + colors.reset);
  }

  if (partial.length > 0) {
    printSection('✏️  KEYWORDS TO STRENGTHEN');
    console.log('\nYou have related experience, but consider using the JD\'s exact terminology:');
    console.log(colors.yellow + partial.join(', ') + colors.reset);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  printHeader('✅ FINAL SUMMARY');
  console.log(`\n${colors.bright}Resume Keywords (${resumeKeywords.length}):${colors.reset}`);
  console.log(resumeKeywords.join(', '));

  console.log(`\n${colors.bright}JD Keywords (${jdKeywords.length}):${colors.reset}`);
  console.log(jdKeywords.join(', '));

  console.log(`\n${colors.bright}Matched:${colors.reset}  ${matched.join(', ') || 'None'}`);
  console.log(`${colors.bright}Partial:${colors.reset}  ${partial.join(', ') || 'None'}`);
  console.log(`${colors.bright}Missing:${colors.reset}  ${missing.join(', ') || 'None'}`);
  console.log(`\n${colors.bright}Score:${colors.reset} ${score}%\n`);
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});