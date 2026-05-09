/**
 * Test Keyword Matching with Embeddings
 * 
 * This test script:
 * 1. Reads resume.txt and jd.txt
 * 2. Preprocesses both texts
 * 3. Extracts technical keywords using hardcoded patterns (same as production)
 * 4. Generates embeddings for both
 * 5. Calculates cosine similarity
 * 6. Shows common/missing keywords and final score
 * 
 * Usage: node test/test-keyword-matching.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { preprocessResume, preprocessJobDescription } = require('../src/services/textPreprocessor');

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
 * Generate embedding using the embedding service
 */
async function generateEmbedding(text) {
  try {
    const response = await axios.post('http://localhost:5001/embed', {
      text: text
    }, { timeout: 10000 });
    
    return response.data.embedding;
  } catch (error) {
    console.error(colors.red + `Error: Embedding service not running on port 5001` + colors.reset);
    process.exit(1);
  }
}

/**
 * Calculate cosine similarity (with proper normalization)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Extract technical keywords using hardcoded patterns (same as production)
 */
function extractTechnicalKeywords(text) {
  if (!text) return [];

  // Hardcoded technical patterns (same as embeddingMatcherService.js)
  const technicalPatterns = [
    // Programming Languages
    'python', 'java', 'javascript', 'typescript', 'c\\+\\+', 'c#', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'go', 'golang', 'rust', 'scala', 'r\\b',
    // Web Frameworks
    'react', 'reactjs', 'angular', 'vue', 'vuejs', 'nodejs', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'springboot', 'laravel', 'rails',
    // ML/AI
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'opencv', 'nlp', 'machine learning', 'deep learning', 'neural network', 'llm', 'gpt', 'bert', 'transformers', 'huggingface',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github', 'ci/cd', 'terraform', 'ansible', 'lambda', 'ec2', 's3', 'sagemaker', 'bedrock',
    // Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sqlite',
    // Tools & Others
    'git', 'linux', 'unix', 'bash', 'api', 'rest', 'restful', 'graphql', 'microservices', 'agile', 'scrum', 'jira', 'kafka', 'spark', 'hadoop', 'airflow', 'mlflow'
  ];

  const textLower = text.toLowerCase();
  const foundKeywords = [];

  // Find all matching technical keywords
  for (const pattern of technicalPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    if (regex.test(textLower)) {
      // Normalize the keyword (remove regex escapes)
      const normalized = pattern.replace(/\\b|\\+|\\/g, '').replace(/\s+/g, ' ');
      if (!foundKeywords.includes(normalized)) {
        foundKeywords.push(normalized);
      }
    }
  }

  return foundKeywords.sort();
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
  printHeader('🔬 KEYWORD MATCHING TEST WITH EMBEDDINGS');
  console.log(colors.cyan + 'Testing resume.txt vs jd.txt with production logic' + colors.reset);
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  console.log(`\nResume: ${resumeText.length} characters`);
  console.log(`JD: ${jdText.length} characters`);
  
  // Step 1: Preprocess
  printSection('📝 STEP 1: PREPROCESSING');
  const resumePreprocessed = preprocessResume(resumeText);
  const jdPreprocessed = preprocessJobDescription({ job_description: jdText });
  
  console.log(`Resume: ${resumeText.length} → ${resumePreprocessed.length} characters`);
  console.log(`JD: ${jdText.length} → ${jdPreprocessed.length} characters`);
  
  console.log(colors.yellow + '\nPreprocessed Resume (first 500 chars):' + colors.reset);
  console.log(resumePreprocessed.substring(0, 500) + '...');
  
  console.log(colors.yellow + '\nPreprocessed JD (first 500 chars):' + colors.reset);
  console.log(jdPreprocessed.substring(0, 500) + '...');
  
  // Step 2: Extract keywords
  printSection('🔧 STEP 2: EXTRACT TECHNICAL KEYWORDS');
  console.log('Using hardcoded patterns (same as production)...');
  
  const resumeKeywords = extractTechnicalKeywords(resumePreprocessed);
  const jdKeywords = extractTechnicalKeywords(jdPreprocessed);
  
  console.log(`\n${colors.green}Resume Keywords (${resumeKeywords.length}):${colors.reset}`);
  console.log(`[${resumeKeywords.join(', ')}]`);
  
  console.log(`\n${colors.green}JD Keywords (${jdKeywords.length}):${colors.reset}`);
  console.log(`[${jdKeywords.join(', ')}]`);
  
  // Step 3: Compare keywords
  printSection('🔍 STEP 3: COMPARE KEYWORDS');
  
  const commonKeywords = findCommonKeywords(resumeKeywords, jdKeywords);
  const missingKeywords = findMissingKeywords(resumeKeywords, jdKeywords);
  
  const keywordMatchRate = jdKeywords.length > 0 
    ? ((commonKeywords.length / jdKeywords.length) * 100).toFixed(1)
    : 0;
  
  console.log(`\n${colors.green}✅ Common Keywords (${commonKeywords.length}):${colors.reset}`);
  console.log(`[${commonKeywords.join(', ')}]`);
  
  console.log(`\n${colors.red}❌ Missing Keywords (${missingKeywords.length}):${colors.reset}`);
  console.log(`[${missingKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}📊 Keyword Match Rate: ${keywordMatchRate}%${colors.reset}`);
  console.log(`   (${commonKeywords.length} out of ${jdKeywords.length} JD keywords found in resume)`);
  
  // Step 4: Generate embeddings
  printSection('🧠 STEP 4: GENERATE EMBEDDINGS');
  console.log('Generating resume embedding...');
  const resumeEmbedding = await generateEmbedding(resumePreprocessed);
  console.log(`✓ Resume embedding: ${resumeEmbedding.length} dimensions`);
  
  console.log('\nGenerating JD embedding...');
  const jdEmbedding = await generateEmbedding(jdPreprocessed);
  console.log(`✓ JD embedding: ${jdEmbedding.length} dimensions`);
  
  // Step 5: Calculate similarity
  printSection('📊 STEP 5: CALCULATE COSINE SIMILARITY');
  
  const rawSimilarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
  const rawPercent = (rawSimilarity * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Raw Cosine Similarity: ${rawPercent}%${colors.reset}`);
  
  // Apply rescaling (same as production)
  const rescaledSimilarity = Math.max(0, Math.min(1, (rawSimilarity - 0.25) / 0.55));
  const rescaledPercent = (rescaledSimilarity * 100).toFixed(1);
  
  console.log(`${colors.bright}Rescaled Similarity: ${rescaledPercent}%${colors.reset}`);
  console.log(`   (Using production formula: (raw - 0.25) / 0.55)`);
  
  // Final score
  const finalScore = rescaledSimilarity;
  const finalPercent = (finalScore * 100).toFixed(1);
  
  console.log(`\n${colors.bright}${colors.green}Final Score: ${finalPercent}%${colors.reset}`);
  
  // Interpretation
  printSection('💡 INTERPRETATION');
  
  if (finalScore >= 0.85) {
    console.log(colors.green + `✅ EXCELLENT MATCH (${finalPercent}%)` + colors.reset);
    console.log('Strong semantic alignment between resume and JD.');
  } else if (finalScore >= 0.70) {
    console.log(colors.cyan + `✅ VERY GOOD MATCH (${finalPercent}%)` + colors.reset);
    console.log('Good semantic alignment between resume and JD.');
  } else if (finalScore >= 0.60) {
    console.log(colors.yellow + `⚠️  GOOD MATCH (${finalPercent}%)` + colors.reset);
    console.log('Decent alignment, consider tailoring resume.');
  } else {
    console.log(colors.red + `❌ FAIR MATCH (${finalPercent}%)` + colors.reset);
    console.log('Limited alignment between resume and JD.');
  }
  
  // Summary
  printHeader('📋 SUMMARY');
  
  console.log(`\n${colors.bright}Resume Words:${colors.reset}`);
  console.log(`[${resumeKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}JD Words:${colors.reset}`);
  console.log(`[${jdKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}Common:${colors.reset}`);
  console.log(`[${commonKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}Missing:${colors.reset}`);
  console.log(`[${missingKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}Keyword Match:${colors.reset} ${keywordMatchRate}% (${commonKeywords.length}/${jdKeywords.length})`);
  console.log(`${colors.bright}Raw Similarity:${colors.reset} ${rawPercent}%`);
  console.log(`${colors.bright}Final Score:${colors.reset} ${finalPercent}%`);
  
  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
