/**
 * Test Keyword-Only Similarity
 * 
 * This test compares ONLY extracted keywords (not full text):
 * 1. Extract keywords from resume
 * 2. Extract keywords from JD
 * 3. Generate embeddings from keywords only
 * 4. Calculate similarity between keyword embeddings
 * 
 * Compare this with test-keyword-matching.js (full-text approach)
 * 
 * Usage: node test/test-keyword-only-similarity.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { preprocessResume, preprocessJobDescription } = require('../src/services/textPreprocessor');
const { extractTechnicalKeywords, findCommonKeywords, findMissingKeywords } = require('../src/services/technicalPatterns');

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

async function main() {
  printHeader('🔬 COVERAGE + SEMANTIC SIMILARITY TEST');
  console.log(colors.cyan + 'New Approach: Coverage (60%) + Semantic Similarity (40%)' + colors.reset);
  
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
  
  // Step 2: Extract keywords
  printSection('🔧 STEP 2: EXTRACT TECHNICAL KEYWORDS');
  
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
  
  // Step 4: Calculate Coverage Score
  printSection('📊 STEP 4: CALCULATE COVERAGE SCORE');
  
  const coverageScore = jdKeywords.length > 0 
    ? commonKeywords.length / jdKeywords.length 
    : 0;
  const coveragePercent = (coverageScore * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Coverage Score: ${coveragePercent}%${colors.reset}`);
  console.log(`   Formula: commonKeywords / jdKeywords = ${commonKeywords.length} / ${jdKeywords.length}`);
  console.log(`   Measures: How many JD keywords are present in resume`);
  
  // Step 5: Generate embeddings FROM COMMON KEYWORDS ONLY
  printSection('🧠 STEP 5: GENERATE EMBEDDINGS FOR SEMANTIC SIMILARITY');
  
  // Convert keywords to text
  const commonKeywordText = commonKeywords.join(' ');
  const jdKeywordText = jdKeywords.join(' ');
  
  console.log(`\n${colors.yellow}Common keyword text (${commonKeywordText.length} chars):${colors.reset}`);
  console.log(commonKeywordText);
  
  console.log(`\n${colors.yellow}JD keyword text (${jdKeywordText.length} chars):${colors.reset}`);
  console.log(jdKeywordText);
  
  console.log('\nGenerating embedding from common keywords...');
  const commonEmbedding = await generateEmbedding(commonKeywordText);
  console.log(`✓ Common keyword embedding: ${commonEmbedding.length} dimensions`);
  
  console.log('\nGenerating embedding from JD keywords...');
  const jdEmbedding = await generateEmbedding(jdKeywordText);
  console.log(`✓ JD keyword embedding: ${jdEmbedding.length} dimensions`);
  
  // Step 6: Calculate Semantic Similarity
  printSection('� STEP 6: CALCULATE SEMANTIC SIMILARITY');
  
  const semanticSimilarity = cosineSimilarity(commonEmbedding, jdEmbedding);
  const semanticPercent = (semanticSimilarity * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Semantic Similarity: ${semanticPercent}%${colors.reset}`);
  console.log(`   Formula: cosine(commonEmbedding, jdEmbedding)`);
  console.log(`   Measures: How semantically similar the common keywords are to JD keywords`);
  
  // Step 7: Calculate Final Score
  printSection('🎯 STEP 7: CALCULATE FINAL SCORE');
  
  const finalScore = (coverageScore * 0.6) + (semanticSimilarity * 0.4);
  const finalPercent = (finalScore * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Final Score Formula:${colors.reset}`);
  console.log(`   final = (coverage × 0.6) + (semantic × 0.4)`);
  console.log(`   final = (${coveragePercent}% × 0.6) + (${semanticPercent}% × 0.4)`);
  console.log(`   final = ${(coverageScore * 0.6 * 100).toFixed(1)}% + ${(semanticSimilarity * 0.4 * 100).toFixed(1)}%`);
  console.log(`\n${colors.bright}${colors.green}Final Score: ${finalPercent}%${colors.reset}`);
  
  // Interpretation
  printSection('💡 INTERPRETATION');
  
  if (finalScore >= 0.85) {
    console.log(colors.green + `✅ EXCELLENT MATCH (${finalPercent}%)` + colors.reset);
  } else if (finalScore >= 0.70) {
    console.log(colors.cyan + `✅ VERY GOOD MATCH (${finalPercent}%)` + colors.reset);
  } else if (finalScore >= 0.60) {
    console.log(colors.yellow + `⚠️  GOOD MATCH (${finalPercent}%)` + colors.reset);
  } else {
    console.log(colors.red + `❌ FAIR MATCH (${finalPercent}%)` + colors.reset);
  }
  
  // Analysis
  printSection('📊 NEW SCORING APPROACH ANALYSIS');
  
  console.log(`\n${colors.cyan}✅ Coverage Score (60% weight):${colors.reset}`);
  console.log('  • Measures keyword overlap');
  console.log('  • Simple ratio: common / total JD keywords');
  console.log('  • Rewards having the required skills');
  
  console.log(`\n${colors.cyan}✅ Semantic Similarity (40% weight):${colors.reset}`);
  console.log('  • Measures how similar common keywords are to JD');
  console.log('  • Uses embeddings for semantic understanding');
  console.log('  • Captures context and relationships');
  
  console.log(`\n${colors.green}✅ Benefits:${colors.reset}`);
  console.log('  • Balanced approach (coverage + semantics)');
  console.log('  • Coverage ensures key skills are present');
  console.log('  • Semantics ensures skills are relevant');
  console.log('  • More interpretable than pure embedding similarity');
  
  console.log(`\n${colors.yellow}⚠️  Considerations:${colors.reset}`);
  console.log('  • Still depends on keyword extraction quality');
  console.log('  • Common keywords must be meaningful');
  console.log('  • Semantic similarity only on common keywords');
  
  // Summary
  printHeader('📋 SUMMARY');
  
  console.log(`\n${colors.bright}Resume Keywords (${resumeKeywords.length}):${colors.reset}`);
  console.log(`[${resumeKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}JD Keywords (${jdKeywords.length}):${colors.reset}`);
  console.log(`[${jdKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}Common Keywords (${commonKeywords.length}):${colors.reset}`);
  console.log(`[${commonKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}Missing Keywords (${missingKeywords.length}):${colors.reset}`);
  console.log(`[${missingKeywords.join(', ')}]`);
  
  console.log(`\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📊 SCORING BREAKDOWN:${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Coverage Score:${colors.reset}      ${coveragePercent}% (weight: 60%)`);
  console.log(`${colors.bright}Semantic Similarity:${colors.reset} ${semanticPercent}% (weight: 40%)`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.green}FINAL SCORE:${colors.reset}         ${finalPercent}%`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  console.log(`\n${colors.yellow}💡 This approach combines:${colors.reset}`);
  console.log(`   • Coverage (60%): Ensures required skills are present`);
  console.log(`   • Semantics (40%): Ensures skills are contextually relevant`);
  
  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
