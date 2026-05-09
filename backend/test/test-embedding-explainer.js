/**
 * EMBEDDING EXPLAINER - See What Embeddings Actually Match
 * 
 * This shows you what the embedding model "sees" and matches
 * WITHOUT hardcoding any keywords - fully dynamic and domain-agnostic
 * 
 * Works for ANY domain: ML, Frontend, Backend, DevOps, Data Science, etc.
 * 
 * Usage: node test/test-embedding-explainer.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { preprocessResume } = require('../src/services/textPreprocessor');

// Colors
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

// ============================================================================
// DYNAMIC PHRASE EXTRACTION (No Hardcoding!)
// ============================================================================

function extractDynamicPhrases(text, minFreq = 2) {
  /**
   * Extract meaningful phrases dynamically using:
   * 1. N-grams (2-4 word phrases)
   * 2. Frequency filtering (appear 2+ times)
   * 3. Technical term detection (capitalized, special chars)
   * 4. STOPWORD FILTERING (remove meaningless phrases)
   * 
   * Works for ANY domain without hardcoding!
   */
  
  // Stopwords to filter out meaningless phrases
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'now'
  ]);
  
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const phrases = [];
  
  // Extract 2-grams, 3-grams, 4-grams
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phraseWords = words.slice(i, i + n);
      
      // Skip if phrase starts or ends with stopword
      if (stopwords.has(phraseWords[0]) || stopwords.has(phraseWords[phraseWords.length - 1])) {
        continue;
      }
      
      // Skip if phrase is mostly stopwords
      const stopwordCount = phraseWords.filter(w => stopwords.has(w)).length;
      if (stopwordCount > phraseWords.length / 2) {
        continue;
      }
      
      const phrase = phraseWords.join(' ');
      phrases.push(phrase);
    }
  }
  
  // Count frequency
  const freq = {};
  phrases.forEach(p => freq[p] = (freq[p] || 0) + 1);
  
  // Filter by frequency and technical indicators
  const meaningfulPhrases = Object.entries(freq)
    .filter(([phrase, count]) => {
      // Keep if:
      // - Appears 2+ times, OR
      // - Contains technical indicators (numbers, special chars, long words)
      const hasTechnicalIndicators = /\d|\/|-|\./.test(phrase) || 
                                     phrase.split(' ').some(w => w.length > 8);
      
      // Skip generic phrases
      const isGeneric = /position|job|candidate|applicant|employer|company|team|work|role|opportunity/i.test(phrase);
      
      return (count >= minFreq || hasTechnicalIndicators) && !isGeneric;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([phrase]) => phrase);
  
  return meaningfulPhrases;
}

function extractSingleTerms(text) {
  /**
   * Extract single technical terms dynamically:
   * - Words with special chars (ci/cd, c++, .net)
   * - Capitalized words (AWS, React, Python)
   * - Long technical words (kubernetes, tensorflow)
   * - Domain-specific terms (NOT generic words)
   */
  
  // Generic words to filter out
  const genericWords = new Set([
    'position', 'job', 'candidate', 'applicant', 'employer', 'company', 
    'team', 'work', 'role', 'opportunity', 'experience', 'skills', 'requirements',
    'qualifications', 'responsibilities', 'benefits', 'salary', 'location',
    'apply', 'application', 'hiring', 'employment', 'career', 'professional',
    'business', 'organization', 'industry', 'market', 'customer', 'client',
    'project', 'program', 'service', 'product', 'solution', 'system',
    'process', 'management', 'development', 'design', 'implementation',
    'support', 'maintenance', 'operations', 'analysis', 'testing', 'quality'
  ]);
  
  const words = text.split(/\s+/);
  const terms = new Set();
  
  words.forEach(word => {
    const cleaned = word.toLowerCase().replace(/[^a-z0-9\/\-\.\+#]/g, '');
    if (cleaned.length > 2 && !genericWords.has(cleaned)) {
      // Include if:
      // - Has special chars (ci/cd, c++, .net)
      // - Is long and technical (kubernetes, tensorflow, postgresql)
      // - Contains numbers (python3, aws-s3, ml-ops)
      if (/[\/\-\.\+#]/.test(cleaned) || 
          (cleaned.length > 10 && !/ing$|tion$|ment$/.test(cleaned)) || 
          /\d/.test(cleaned)) {
        terms.add(cleaned);
      }
    }
  });
  
  return Array.from(terms);
}

// ============================================================================
// EMBEDDING-BASED MATCHING (Dynamic!)
// ============================================================================

async function generateEmbedding(text) {
  /**
   * Generate embedding using your existing service
   * This is DOMAIN-AGNOSTIC - works for any text!
   */
  try {
    const response = await axios.post('http://localhost:5001/embed', {
      text: text
    }, { timeout: 10000 });
    
    return response.data.embedding;
  } catch (error) {
    console.error(colors.red + `Error: Embedding service not running on port 5001` + colors.reset);
    console.error(`Start it with: cd backend/python-services && python3 phrase_aware_matcher.py`);
    process.exit(1);
  }
}

function cosineSimilarity(vec1, vec2) {
  /**
   * Calculate cosine similarity between two vectors
   */
  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }
  return dotProduct; // Vectors are already normalized
}

async function findSemanticMatches(resumePhrases, jdPhrases, threshold = 0.75) {
  /**
   * Find which resume phrases match JD phrases using embeddings
   * This is FULLY DYNAMIC - no hardcoding!
   */
  
  console.log(`\nGenerating embeddings for ${resumePhrases.length} resume phrases...`);
  const resumeEmbeddings = [];
  for (const phrase of resumePhrases) {
    const emb = await generateEmbedding(phrase);
    resumeEmbeddings.push(emb);
  }
  
  console.log(`Generating embeddings for ${jdPhrases.length} JD phrases...`);
  const jdEmbeddings = [];
  for (const phrase of jdPhrases) {
    const emb = await generateEmbedding(phrase);
    jdEmbeddings.push(emb);
  }
  
  console.log(`\nFinding semantic matches (threshold: ${threshold})...`);
  
  const matches = [];
  const unmatched = [];
  
  // For each JD phrase, find best matching resume phrase
  for (let jdIdx = 0; jdIdx < jdPhrases.length; jdIdx++) {
    const jdPhrase = jdPhrases[jdIdx];
    const jdEmb = jdEmbeddings[jdIdx];
    
    let bestSimilarity = 0;
    let bestResumePhrase = null;
    
    for (let resIdx = 0; resIdx < resumePhrases.length; resIdx++) {
      const resumePhrase = resumePhrases[resIdx];
      const resumeEmb = resumeEmbeddings[resIdx];
      
      const similarity = cosineSimilarity(jdEmb, resumeEmb);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestResumePhrase = resumePhrase;
      }
    }
    
    if (bestSimilarity >= threshold) {
      matches.push({
        jdPhrase,
        resumePhrase: bestResumePhrase,
        similarity: bestSimilarity
      });
    } else {
      unmatched.push({
        jdPhrase,
        bestMatch: bestResumePhrase,
        similarity: bestSimilarity
      });
    }
  }
  
  return { matches, unmatched };
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

async function main() {
  printHeader('🔬 EMBEDDING EXPLAINER - See What Embeddings Match');
  console.log(colors.cyan + 'This is FULLY DYNAMIC - works for ANY domain without hardcoding!' + colors.reset);
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  // Preprocess
  printSection('📝 PREPROCESSING');
  const resumePreprocessed = preprocessResume(resumeText);
  const jdPreprocessed = preprocessResume(jdText);
  
  console.log(`Resume: ${resumeText.length} → ${resumePreprocessed.length} characters`);
  console.log(`JD: ${jdText.length} → ${jdPreprocessed.length} characters`);
  
  // Extract phrases dynamically (NO HARDCODING!)
  printSection('🔍 DYNAMIC PHRASE EXTRACTION (No Hardcoding!)');
  
  const resumePhrases = extractDynamicPhrases(resumePreprocessed);
  const jdPhrases = extractDynamicPhrases(jdPreprocessed);
  
  const resumeTerms = extractSingleTerms(resumePreprocessed);
  const jdTerms = extractSingleTerms(jdPreprocessed);
  
  console.log(`\nResume:`);
  console.log(`  - ${resumePhrases.length} multi-word phrases`);
  console.log(`  - ${resumeTerms.length} single technical terms`);
  console.log(`\nJD:`);
  console.log(`  - ${jdPhrases.length} multi-word phrases`);
  console.log(`  - ${jdTerms.length} single technical terms`);
  
  console.log(colors.yellow + '\nTop Resume Phrases:' + colors.reset);
  resumePhrases.slice(0, 10).forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  
  console.log(colors.yellow + '\nTop JD Phrases:' + colors.reset);
  jdPhrases.slice(0, 10).forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  
  // Combine phrases and terms
  const allResumePhrases = [...resumePhrases, ...resumeTerms].slice(0, 30);
  const allJdPhrases = [...jdPhrases, ...jdTerms].slice(0, 30);
  
  // Find semantic matches using embeddings
  printSection('🧠 SEMANTIC MATCHING (Using Embeddings)');
  console.log(colors.cyan + 'This uses your existing embedding model - works for ANY domain!' + colors.reset);
  
  const { matches, unmatched } = await findSemanticMatches(
    allResumePhrases,
    allJdPhrases,
    0.75
  );
  
  // Show results
  printSection('✅ MATCHED PHRASES');
  console.log(`Found ${matches.length} semantic matches:\n`);
  
  matches
    .sort((a, b) => b.similarity - a.similarity)
    .forEach((match, i) => {
      const simPercent = (match.similarity * 100).toFixed(1);
      const color = match.similarity >= 0.85 ? colors.green :
                    match.similarity >= 0.75 ? colors.cyan :
                    colors.yellow;
      
      console.log(`${i + 1}. ${color}[${simPercent}%]${colors.reset} ${colors.bright}${match.jdPhrase}${colors.reset}`);
      console.log(`   ↔ ${match.resumePhrase}`);
    });
  
  printSection('❌ UNMATCHED JD PHRASES');
  console.log(`Found ${unmatched.length} unmatched (below 75% threshold):\n`);
  
  unmatched
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
    .forEach((item, i) => {
      const simPercent = (item.similarity * 100).toFixed(1);
      console.log(`${i + 1}. ${colors.red}[${simPercent}%]${colors.reset} ${item.jdPhrase}`);
      console.log(`   Best match: ${item.bestMatch}`);
    });
  
  // Calculate overall score
  printSection('📊 OVERALL MATCH SCORE');
  
  const matchRate = (matches.length / allJdPhrases.length * 100).toFixed(1);
  const avgSimilarity = matches.length > 0 
    ? (matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length * 100).toFixed(1)
    : 0;
  
  console.log(`Match Rate: ${matchRate}% (${matches.length}/${allJdPhrases.length} phrases)`);
  console.log(`Average Similarity: ${avgSimilarity}%`);
  console.log(colors.bright + `\nFinal Score: ${((parseFloat(matchRate) + parseFloat(avgSimilarity)) / 2).toFixed(1)}%` + colors.reset);
  
  if (matchRate >= 70) {
    console.log(colors.green + '\n✅ EXCELLENT MATCH! Resume aligns well with JD.' + colors.reset);
  } else if (matchRate >= 50) {
    console.log(colors.yellow + '\n⚠️  GOOD MATCH. Consider adding unmatched concepts if applicable.' + colors.reset);
  } else {
    console.log(colors.red + '\n❌ FAIR MATCH. Significant differences between resume and JD.' + colors.reset);
  }
  
  printHeader('✅ ANALYSIS COMPLETE');
  console.log(colors.cyan + '\n💡 Key Insight: This matching is FULLY DYNAMIC!' + colors.reset);
  console.log('   - No hardcoded keywords');
  console.log('   - Works for ANY domain (ML, Frontend, Backend, DevOps, etc.)');
  console.log('   - Embeddings understand semantic relationships automatically');
  console.log('   - Scales to any tech stack or industry\n');
}

main().catch(error => {
  console.error(colors.red + 'Error:' + colors.reset, error.message);
  process.exit(1);
});
