/**
 * Feature Extraction Debug Script
 * 
 * This script reads resume.txt and jd.txt from the test folder,
 * runs them through the preprocessing pipeline, and shows:
 * - Preprocessed text
 * - Extracted technical keywords
 * - Common keywords between resume and JD
 * - Missing keywords in resume
 * 
 * Usage: node test/test-feature-extraction.js
 */

const fs = require('fs');
const path = require('path');
const { 
  preprocessResume, 
  preprocessText 
} = require('../src/services/textPreprocessor');
const { 
  extractTechnicalKeywords, 
  findCommonKeywords 
} = require('../src/services/embeddingMatcherService');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
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

function printSuccess(text) {
  console.log(colors.green + text + colors.reset);
}

function printWarning(text) {
  console.log(colors.yellow + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + text + colors.reset);
}

function printInfo(text) {
  console.log(colors.cyan + text + colors.reset);
}

// Read files
function readTestFiles() {
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  try {
    const resumeText = fs.readFileSync(resumePath, 'utf-8');
    const jdText = fs.readFileSync(jdPath, 'utf-8');
    
    return { resumeText, jdText };
  } catch (error) {
    printError(`Error reading files: ${error.message}`);
    printWarning('\nMake sure you have:');
    printWarning('  - backend/test/resume.txt (your resume content)');
    printWarning('  - backend/test/jd.txt (job description content)');
    process.exit(1);
  }
}

// Analyze text and extract features
function analyzeText(text, label) {
  printSection(`📄 ${label} - Original Text`);
  console.log(`Length: ${text.length} characters`);
  console.log(`Preview: ${text.substring(0, 200)}...`);
  
  // Preprocess
  printSection(`🔧 ${label} - Preprocessed Text`);
  const preprocessed = preprocessResume(text);
  console.log(`Length: ${preprocessed.length} characters`);
  console.log(`Preview: ${preprocessed.substring(0, 300)}...`);
  console.log(`\nFull preprocessed text:\n${preprocessed}`);
  
  // Extract technical keywords
  printSection(`🔍 ${label} - Technical Keywords Extracted`);
  const keywords = extractTechnicalKeywords(preprocessed);
  console.log(`Found ${keywords.length} technical keywords:\n`);
  
  // Group keywords by category
  const categories = {
    'Programming Languages': [],
    'ML/AI Frameworks': [],
    'Cloud Platforms': [],
    'Databases': [],
    'DevOps Tools': [],
    'Other Technical': []
  };
  
  const programmingLangs = ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'go', 'golang', 'rust', 'scala', 'r'];
  const mlFrameworks = ['tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'opencv', 'nlp', 'transformers', 'huggingface', 'bert', 'gpt', 'llm'];
  const cloudPlatforms = ['aws', 'azure', 'gcp', 'google cloud', 'lambda', 'ec2', 's3', 'sagemaker', 'bedrock'];
  const databases = ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'oracle'];
  const devopsTools = ['docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github', 'ci/cd', 'terraform', 'ansible'];
  
  keywords.forEach(keyword => {
    if (programmingLangs.includes(keyword)) {
      categories['Programming Languages'].push(keyword);
    } else if (mlFrameworks.includes(keyword)) {
      categories['ML/AI Frameworks'].push(keyword);
    } else if (cloudPlatforms.includes(keyword)) {
      categories['Cloud Platforms'].push(keyword);
    } else if (databases.includes(keyword)) {
      categories['Databases'].push(keyword);
    } else if (devopsTools.includes(keyword)) {
      categories['DevOps Tools'].push(keyword);
    } else {
      categories['Other Technical'].push(keyword);
    }
  });
  
  // Print categorized keywords
  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      printInfo(`\n  ${category}:`);
      console.log(`    ${items.join(', ')}`);
    }
  });
  
  // Print all keywords as list
  printInfo(`\n  All Keywords (alphabetical):`);
  console.log(`    ${keywords.join(', ')}`);
  
  return { preprocessed, keywords };
}

// Compare resume and JD
function compareFeatures(resumeKeywords, jdKeywords) {
  printHeader('🔄 COMPARISON: Resume vs Job Description');
  
  // Find common keywords
  printSection('✅ Common Keywords (Skills You Have That Match JD)');
  const commonKeywords = findCommonKeywords(resumeKeywords, jdKeywords);
  console.log(`Found ${commonKeywords.length} matching keywords:\n`);
  
  if (commonKeywords.length > 0) {
    commonKeywords.forEach((keyword, index) => {
      printSuccess(`  ${index + 1}. ${keyword}`);
    });
    
    const matchPercentage = ((commonKeywords.length / jdKeywords.length) * 100).toFixed(1);
    printInfo(`\n📊 Match Rate: ${commonKeywords.length}/${jdKeywords.length} (${matchPercentage}%)`);
  } else {
    printWarning('  No matching keywords found!');
  }
  
  // Find missing keywords
  printSection('❌ Missing Keywords (Skills in JD But Not in Resume)');
  const missingKeywords = jdKeywords.filter(k => !commonKeywords.includes(k));
  console.log(`Found ${missingKeywords.length} missing keywords:\n`);
  
  if (missingKeywords.length > 0) {
    missingKeywords.forEach((keyword, index) => {
      printWarning(`  ${index + 1}. ${keyword}`);
    });
  } else {
    printSuccess('  None! You have all required skills!');
  }
  
  // Find extra keywords (in resume but not in JD)
  printSection('➕ Extra Keywords (Skills You Have But Not Required in JD)');
  const extraKeywords = resumeKeywords.filter(k => !commonKeywords.includes(k));
  console.log(`Found ${extraKeywords.length} extra keywords:\n`);
  
  if (extraKeywords.length > 0) {
    extraKeywords.forEach((keyword, index) => {
      console.log(`  ${index + 1}. ${keyword}`);
    });
  } else {
    console.log('  None');
  }
  
  return { commonKeywords, missingKeywords, extraKeywords };
}

// Generate summary report
function generateSummary(resumeData, jdData, comparison) {
  printHeader('📊 SUMMARY REPORT');
  
  console.log('\n📄 Resume:');
  console.log(`  - Original length: ${resumeData.original.length} characters`);
  console.log(`  - Preprocessed length: ${resumeData.preprocessed.length} characters`);
  console.log(`  - Technical keywords: ${resumeData.keywords.length}`);
  
  console.log('\n📋 Job Description:');
  console.log(`  - Original length: ${jdData.original.length} characters`);
  console.log(`  - Preprocessed length: ${jdData.preprocessed.length} characters`);
  console.log(`  - Technical keywords: ${jdData.keywords.length}`);
  
  console.log('\n🎯 Matching Analysis:');
  const matchRate = ((comparison.commonKeywords.length / jdData.keywords.length) * 100).toFixed(1);
  console.log(`  - Common keywords: ${comparison.commonKeywords.length}`);
  console.log(`  - Missing keywords: ${comparison.missingKeywords.length}`);
  console.log(`  - Extra keywords: ${comparison.extraKeywords.length}`);
  console.log(`  - Match rate: ${matchRate}%`);
  
  console.log('\n💡 Recommendations:');
  if (matchRate >= 80) {
    printSuccess('  ✅ Excellent match! Your resume aligns well with the JD.');
  } else if (matchRate >= 60) {
    printWarning('  ⚠️  Good match, but consider adding missing keywords if you have those skills.');
  } else if (matchRate >= 40) {
    printWarning('  ⚠️  Fair match. Consider tailoring your resume to include more relevant keywords.');
  } else {
    printError('  ❌ Low match. This role may not align with your skills, or your resume needs significant tailoring.');
  }
  
  if (comparison.missingKeywords.length > 0 && comparison.missingKeywords.length <= 5) {
    printInfo('\n  🎯 Focus on adding these missing keywords (if applicable):');
    comparison.missingKeywords.slice(0, 5).forEach(keyword => {
      console.log(`     - ${keyword}`);
    });
  }
}

// Main execution
function main() {
  printHeader('🔬 FEATURE EXTRACTION DEBUG TOOL');
  printInfo('This tool analyzes your resume and job description to show what features are extracted.\n');
  
  // Read files
  const { resumeText, jdText } = readTestFiles();
  
  // Analyze resume
  printHeader('📝 RESUME ANALYSIS');
  const resumeAnalysis = analyzeText(resumeText, 'Resume');
  
  // Analyze JD
  printHeader('📋 JOB DESCRIPTION ANALYSIS');
  const jdAnalysis = analyzeText(jdText, 'Job Description');
  
  // Compare
  const comparison = compareFeatures(resumeAnalysis.keywords, jdAnalysis.keywords);
  
  // Generate summary
  generateSummary(
    { original: resumeText, ...resumeAnalysis },
    { original: jdText, ...jdAnalysis },
    comparison
  );
  
  printHeader('✅ ANALYSIS COMPLETE');
  printInfo('\nNext steps:');
  console.log('  1. Review the common keywords - these are your strengths');
  console.log('  2. Check missing keywords - add them to your resume if you have those skills');
  console.log('  3. Look at the preprocessed text to see what the AI actually "sees"');
  console.log('  4. Use this information to tailor your resume for better matching\n');
}

// Run the script
main();
