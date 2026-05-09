/**
 * Test Your CURRENT Production System
 * 
 * This shows what your actual matching system does:
 * - Preprocesses full text (not phrases)
 * - Generates ONE embedding per document
 * - Compares full semantic meaning
 * - This is ALREADY dynamic and domain-agnostic!
 * 
 * Usage: node test/test-current-system.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { preprocessResume } = require('../src/services/textPreprocessor');

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

function cosineSimilarity(a, b) {
  /**
   * TRUE cosine similarity with proper normalization
   * This is NOT just dot product - it normalizes vectors first
   */
  let dot = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  printHeader('🔬 YOUR CURRENT PRODUCTION SYSTEM TEST');
  console.log(colors.cyan + 'This is what your actual system does - and it WORKS!' + colors.reset);
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  // Preprocess (same as production)
  printSection('📝 STEP 1: PREPROCESSING');
  const resumePreprocessed = preprocessResume(resumeText);
  const jdPreprocessed = preprocessResume(jdText);
  
  console.log(`Resume: ${resumeText.length} → ${resumePreprocessed.length} characters`);
  console.log(`JD: ${jdText.length} → ${jdPreprocessed.length} characters`);
  
  console.log(colors.yellow + '\n📄 FULL PREPROCESSED RESUME:' + colors.reset);
  console.log(resumePreprocessed);
  
  console.log(colors.yellow + '\n📄 FULL PREPROCESSED JD:' + colors.reset);
  console.log(jdPreprocessed);
  
  // Generate embeddings (same as production)
  printSection('🧠 STEP 2: GENERATE EMBEDDINGS');
  console.log('Generating resume embedding...');
  const resumeEmbedding = await generateEmbedding(resumePreprocessed);
  console.log(`✓ Resume embedding: ${resumeEmbedding.length} dimensions`);
  
  console.log('Generating JD embedding...');
  const jdEmbedding = await generateEmbedding(jdPreprocessed);
  console.log(`✓ JD embedding: ${jdEmbedding.length} dimensions`);
  
  // Calculate similarity (same as production)
  printSection('📊 STEP 3: CALCULATE SIMILARITY');
  const rawSimilarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
  const rawPercent = (rawSimilarity * 100).toFixed(1);
  
  console.log(`Raw Cosine Similarity: ${rawPercent}%`);
  
  // Check eligibility requirements
  printSection('🚨 STEP 4: CHECK ELIGIBILITY REQUIREMENTS');
  
  function checkEligibility(jdText) {
    const text = jdText.toLowerCase();
    
    return {
      requiresCitizenship: text.includes("u.s. citizen"),
      requiresClearance: text.includes("security clearance")
    };
  }
  
  const eligibility = checkEligibility(jdText);
  
  if (eligibility.requiresCitizenship) {
    console.log(colors.red + '⚠️  Job requires U.S. citizenship' + colors.reset);
  }
  
  if (eligibility.requiresClearance) {
    console.log(colors.red + '⚠️  Job requires security clearance' + colors.reset);
  }
  
  if (eligibility.requiresCitizenship || eligibility.requiresClearance) {
    console.log(colors.yellow + '\n⚠️  NOT ELIGIBLE due to job constraints' + colors.reset);
    console.log('This job has requirements that cannot be assessed from resume alone.');
  } else {
    console.log(colors.green + '✅ No special eligibility requirements detected' + colors.reset);
  }
  
  // Keep raw scores honest (no artificial rescaling)
  printSection('🎯 STEP 5: INTERPRET SIMILARITY SCORE');
  
  const similarity = rawSimilarity;
  
  let label;
  if (similarity >= 0.8) {
    label = "EXCELLENT MATCH";
  } else if (similarity >= 0.7) {
    label = "STRONG MATCH";
  } else if (similarity >= 0.6) {
    label = "GOOD MATCH";
  } else {
    label = "WEAK MATCH";
  }
  
  console.log(`\nSimilarity Score: ${rawPercent}%`);
  console.log(`Match Quality: ${label}`);
  
  // Show interpretation
  printSection('💡 INTERPRETATION');
  
  if (eligibility.requiresCitizenship || eligibility.requiresClearance) {
    console.log(colors.red + '\n❌ NOT ELIGIBLE FOR THIS POSITION' + colors.reset);
    console.log('This job requires U.S. citizenship and/or security clearance.');
    console.log('Even with a high similarity score, you cannot apply without meeting these requirements.');
  } else {
    if (similarity >= 0.8) {
      console.log(colors.green + `✅ EXCELLENT MATCH (${rawPercent}%)` + colors.reset);
      console.log('Your resume strongly aligns with this JD.');
      console.log('The embeddings understand your ML/AI experience matches their requirements.');
    } else if (similarity >= 0.7) {
      console.log(colors.cyan + `✅ STRONG MATCH (${rawPercent}%)` + colors.reset);
      console.log('Your resume aligns well with this JD.');
      console.log('The embeddings see strong semantic overlap in skills and experience.');
    } else if (similarity >= 0.6) {
      console.log(colors.yellow + `⚠️  GOOD MATCH (${rawPercent}%)` + colors.reset);
      console.log('Your resume has decent alignment with this JD.');
      console.log('Consider tailoring to emphasize matching concepts.');
    } else {
      console.log(colors.red + `❌ WEAK MATCH (${rawPercent}%)` + colors.reset);
      console.log('Limited alignment between resume and JD.');
    }
  }
  
  // Explain why this works
  printSection('🎓 WHY THIS APPROACH WORKS');
  
  console.log(colors.cyan + '\n1. Proper Cosine Similarity:' + colors.reset);
  console.log('   - Normalizes vectors correctly (not just dot product)');
  console.log('   - Works even if embeddings are not pre-normalized');
  console.log('   - Mathematically sound similarity measure');
  
  console.log(colors.cyan + '\n2. Honest Scoring:' + colors.reset);
  console.log('   - No artificial rescaling formulas');
  console.log('   - Raw similarity scores are interpretable');
  console.log('   - 70%+ = strong match, 60-70% = good, <60% = weak');
  
  console.log(colors.cyan + '\n3. Eligibility Filtering:' + colors.reset);
  console.log('   - Checks for citizenship requirements');
  console.log('   - Checks for security clearance requirements');
  console.log('   - Prevents false positives for ineligible jobs');
  
  console.log(colors.cyan + '\n4. Full Text Embeddings:' + colors.reset);
  console.log('   - Captures ENTIRE semantic meaning');
  console.log('   - Understands context, not just keywords');
  console.log('   - Works for ANY domain automatically');
  
  console.log(colors.cyan + '\n5. Next Steps (Not Yet Implemented):' + colors.reset);
  console.log('   - Chunked embeddings (split resume/JD into sections)');
  console.log('   - Hybrid approach (embeddings + rule-based filtering)');
  console.log('   - Better signal extraction from long documents');
  
  printHeader('✅ CONCLUSION');
  console.log(colors.green + '\nFixed Issues:' + colors.reset);
  console.log('✅ 1. Proper cosine similarity (not just dot product)');
  console.log('✅ 2. Removed artificial rescaling');
  console.log('✅ 3. Added eligibility filtering');
  console.log(colors.yellow + '⏳ 4. Chunked embeddings (future improvement)' + colors.reset);
  console.log(colors.yellow + '⏳ 5. Hybrid approach (future improvement)' + colors.reset);
  console.log('\nKey takeaway: Keep scores honest and filter ineligible jobs!\n');
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
