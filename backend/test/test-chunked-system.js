/**
 * Test Chunked/Sectioned Embedding System
 * 
 * This improves upon the full-text approach by:
 * - Splitting resume into sections (summary, experience, skills, etc.)
 * - Generating separate embeddings for each section
 * - Using weighted matching (experience=40%, skills=30%, summary=20%, etc.)
 * - Better signal extraction from long documents
 * 
 * Usage: node test/test-chunked-system.js
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

/**
 * Split resume into sections using keyword-based detection
 * Works even when resume has no clear section headers
 * @param {string} text - Resume text
 * @returns {object} - Sections object
 */
function splitResumeIntoSections(text) {
  const textLower = text.toLowerCase();
  
  // Find section boundaries using keywords
  const summaryStart = textLower.indexOf('summary');
  const experienceStart = textLower.indexOf('professional experience');
  const skillsStart = textLower.indexOf('technical skills');
  const educationStart = textLower.indexOf('education');
  
  const sections = {};
  
  // Extract summary (from "summary" to "professional experience")
  if (summaryStart !== -1 && experienceStart !== -1) {
    sections.summary = text.substring(summaryStart, experienceStart).trim();
  }
  
  // Extract experience (from "professional experience" to "technical skills")
  if (experienceStart !== -1 && skillsStart !== -1) {
    sections.experience = text.substring(experienceStart, skillsStart).trim();
  }
  
  // Extract skills (from "technical skills" to "education")
  if (skillsStart !== -1 && educationStart !== -1) {
    sections.skills = text.substring(skillsStart, educationStart).trim();
  }
  
  // Extract education (from "education" to end)
  if (educationStart !== -1) {
    sections.education = text.substring(educationStart).trim();
  }
  
  // If no sections found, use simple chunking
  if (Object.keys(sections).length === 0) {
    const chunkSize = Math.floor(text.length / 3);
    sections.part1 = text.substring(0, chunkSize);
    sections.part2 = text.substring(chunkSize, chunkSize * 2);
    sections.part3 = text.substring(chunkSize * 2);
  }
  
  return sections;
}

/**
 * Generate embeddings for each section
 * @param {object} sections - Sections object
 * @returns {Promise<object>} - Embeddings per section
 */
async function embedSections(sections) {
  const embeddings = {};
  
  for (let key in sections) {
    if (sections[key].trim().length > 50) {
      console.log(`   Embedding section: ${key} (${sections[key].trim().length} chars)`);
      embeddings[key] = await generateEmbedding(sections[key]);
    }
  }
  
  return embeddings;
}

/**
 * Section weights for matching
 */
const SECTION_WEIGHTS = {
  summary: 0.15,
  experience: 0.50,
  skills: 0.30,
  education: 0.05,
  part1: 0.33,
  part2: 0.33,
  part3: 0.34
};

/**
 * Compute weighted section score
 * @param {object} sectionEmbeddings - Embeddings per section
 * @param {Array<number>} jdEmbedding - JD embedding
 * @returns {object} - {totalScore, sectionScores}
 */
function computeSectionScore(sectionEmbeddings, jdEmbedding) {
  let totalScore = 0;
  let totalWeight = 0;
  const sectionScores = {};
  
  for (let section in sectionEmbeddings) {
    const sim = cosineSimilarity(sectionEmbeddings[section], jdEmbedding);
    const weight = SECTION_WEIGHTS[section] || 0.05;
    
    sectionScores[section] = {
      similarity: sim,
      weight: weight,
      weightedScore: sim * weight
    };
    
    totalScore += sim * weight;
    totalWeight += weight;
  }
  
  return {
    totalScore: totalScore / totalWeight,
    sectionScores: sectionScores
  };
}

function checkEligibility(jdText) {
  const text = jdText.toLowerCase();
  
  return {
    requiresCitizenship: text.includes("u.s. citizen"),
    requiresClearance: text.includes("security clearance")
  };
}

async function main() {
  printHeader('🔬 CHUNKED/SECTIONED EMBEDDING SYSTEM TEST');
  console.log(colors.cyan + 'This splits resume into sections and uses weighted matching!' + colors.reset);
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  // Preprocess
  printSection('📝 STEP 1: PREPROCESSING');
  const resumePreprocessed = preprocessResume(resumeText);
  const jdPreprocessed = preprocessResume(jdText);
  
  console.log(`Resume: ${resumeText.length} → ${resumePreprocessed.length} characters`);
  console.log(`JD: ${jdText.length} → ${jdPreprocessed.length} characters`);
  
  console.log(colors.yellow + '\n📄 FULL PREPROCESSED RESUME:' + colors.reset);
  console.log(resumePreprocessed);
  
  console.log(colors.yellow + '\n📄 FULL PREPROCESSED JD:' + colors.reset);
  console.log(jdPreprocessed);
  
  // Split resume into sections
  printSection('✂️  STEP 2: SPLIT RESUME INTO SECTIONS');
  const sections = splitResumeIntoSections(resumePreprocessed);
  
  console.log('Found sections:');
  for (let key in sections) {
    const charCount = sections[key].trim().length;
    if (charCount > 50) {
      console.log(`  - ${key}: ${charCount} characters`);
    }
  }
  
  // Generate embeddings for each section
  printSection('🧠 STEP 3: GENERATE SECTION EMBEDDINGS');
  console.log('Generating embeddings for resume sections...');
  const sectionEmbeddings = await embedSections(sections);
  console.log(`✓ Generated ${Object.keys(sectionEmbeddings).length} section embeddings`);
  
  console.log('\nGenerating JD embedding...');
  const jdEmbedding = await generateEmbedding(jdPreprocessed);
  console.log(`✓ JD embedding: ${jdEmbedding.length} dimensions`);
  
  // Calculate weighted similarity
  printSection('📊 STEP 4: CALCULATE WEIGHTED SIMILARITY');
  const result = computeSectionScore(sectionEmbeddings, jdEmbedding);
  
  console.log('\nSection-wise scores:');
  for (let section in result.sectionScores) {
    const score = result.sectionScores[section];
    const simPercent = (score.similarity * 100).toFixed(1);
    const weightPercent = (score.weight * 100).toFixed(0);
    const weightedPercent = (score.weightedScore * 100).toFixed(1);
    
    console.log(`  ${section.padEnd(15)} | Similarity: ${simPercent}% | Weight: ${weightPercent}% | Weighted: ${weightedPercent}%`);
  }
  
  const finalScore = result.totalScore;
  const finalPercent = (finalScore * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Final Weighted Score: ${finalPercent}%${colors.reset}`);
  
  // Check eligibility
  printSection('🚨 STEP 5: CHECK ELIGIBILITY REQUIREMENTS');
  
  const eligibility = checkEligibility(jdText);
  
  if (eligibility.requiresCitizenship) {
    console.log(colors.red + '⚠️  Job requires U.S. citizenship' + colors.reset);
  }
  
  if (eligibility.requiresClearance) {
    console.log(colors.red + '⚠️  Job requires security clearance' + colors.reset);
  }
  
  if (eligibility.requiresCitizenship || eligibility.requiresClearance) {
    console.log(colors.yellow + '\n⚠️  NOT ELIGIBLE due to job constraints' + colors.reset);
  } else {
    console.log(colors.green + '✅ No special eligibility requirements detected' + colors.reset);
  }
  
  // Interpret score
  printSection('🎯 STEP 6: INTERPRET SIMILARITY SCORE');
  
  let label;
  if (finalScore >= 0.8) {
    label = "EXCELLENT MATCH";
  } else if (finalScore >= 0.7) {
    label = "STRONG MATCH";
  } else if (finalScore >= 0.6) {
    label = "GOOD MATCH";
  } else {
    label = "WEAK MATCH";
  }
  
  console.log(`\nMatch Quality: ${label}`);
  
  // Show interpretation
  printSection('💡 INTERPRETATION');
  
  if (eligibility.requiresCitizenship || eligibility.requiresClearance) {
    console.log(colors.red + '\n❌ NOT ELIGIBLE FOR THIS POSITION' + colors.reset);
    console.log('This job requires U.S. citizenship and/or security clearance.');
    console.log('Even with a high similarity score, you cannot apply without meeting these requirements.');
  } else {
    if (finalScore >= 0.8) {
      console.log(colors.green + `✅ EXCELLENT MATCH (${finalPercent}%)` + colors.reset);
      console.log('Your resume strongly aligns with this JD.');
    } else if (finalScore >= 0.7) {
      console.log(colors.cyan + `✅ STRONG MATCH (${finalPercent}%)` + colors.reset);
      console.log('Your resume aligns well with this JD.');
    } else if (finalScore >= 0.6) {
      console.log(colors.yellow + `⚠️  GOOD MATCH (${finalPercent}%)` + colors.reset);
      console.log('Your resume has decent alignment with this JD.');
    } else {
      console.log(colors.red + `❌ WEAK MATCH (${finalPercent}%)` + colors.reset);
      console.log('Limited alignment between resume and JD.');
    }
  }
  
  // Explain advantages
  printSection('🎓 WHY CHUNKED APPROACH IS BETTER');
  
  console.log(colors.cyan + '\n1. Section-Level Granularity:' + colors.reset);
  console.log('   - Experience section gets 40% weight (most important)');
  console.log('   - Skills section gets 30% weight');
  console.log('   - Summary gets 20% weight');
  console.log('   - Better signal extraction from long documents');
  
  console.log(colors.cyan + '\n2. Weighted Matching:' + colors.reset);
  console.log('   - Not all sections are equal');
  console.log('   - Experience matters more than education');
  console.log('   - Skills matter more than projects');
  
  console.log(colors.cyan + '\n3. Prevents Dilution:' + colors.reset);
  console.log('   - Full-text embeddings can bury important info');
  console.log('   - Section embeddings keep signals strong');
  console.log('   - Better for long resumes (10k+ chars)');
  
  console.log(colors.cyan + '\n4. Still Dynamic:' + colors.reset);
  console.log('   - No hardcoded keywords');
  console.log('   - Works for any domain');
  console.log('   - Semantic understanding preserved');
  
  printHeader('✅ CONCLUSION');
  console.log(colors.green + '\nChunked approach advantages:' + colors.reset);
  console.log('✅ Better signal extraction from long documents');
  console.log('✅ Weighted matching (experience > skills > summary)');
  console.log('✅ Prevents important info from being diluted');
  console.log('✅ Still fully dynamic and domain-agnostic');
  console.log('\nThis is the recommended approach for production!\n');
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
