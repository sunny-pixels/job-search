/**
 * SEMANTIC MATCHER - True Intelligent Matching
 * 
 * Features:
 * 1. Semantic similarity (fuzzy matching with threshold 0.7)
 * 2. Concept mapping (synonyms and related terms)
 * 3. Weighted scoring (core skills > use-cases)
 * 4. N-gram extraction from JD
 * 5. Intelligent scoring formula
 * 
 * Usage: node test/test-semantic-matcher.js
 */

const fs = require('fs');
const path = require('path');
const { preprocessResume } = require('../src/services/textPreprocessor');

// Colors
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

// ============================================================================
// 1. CONCEPT MAPPING (Synonyms & Related Terms)
// ============================================================================

const CONCEPT_MAPPING = {
  // Distributed Computing
  'distributed computing': ['spark', 'distributed training', 'parallel processing', 'multi-gpu', 'distributed systems'],
  'distributed training': ['multi-gpu training', 'distributed computing', 'parallel training'],
  'parallel processing': ['distributed computing', 'concurrent processing', 'multi-threading'],
  
  // AI Systems
  'ai systems': ['mlops', 'production systems', 'ml systems', 'ai solutions', 'ml pipelines'],
  'production systems': ['production deployment', 'production-grade', 'mlops', 'ai systems'],
  'ml systems': ['ai systems', 'machine learning systems', 'ml infrastructure'],
  
  // Decision Systems
  'decision systems': ['prediction systems', 'ml models', 'ai models', 'recommendation systems'],
  'prediction systems': ['forecasting', 'predictive models', 'decision systems'],
  
  // Pattern Recognition
  'pattern recognition': ['computer vision', 'object detection', 'image classification', 'anomaly detection'],
  'computer vision': ['image processing', 'object detection', 'pattern recognition'],
  'object detection': ['computer vision', 'image classification', 'pattern recognition'],
  
  // Model Operations
  'model deployment': ['production deployment', 'model serving', 'inference deployment'],
  'model optimization': ['hyperparameter tuning', 'performance optimization', 'model tuning'],
  'model monitoring': ['model performance', 'drift detection', 'observability'],
  
  // Data Operations
  'data pipelines': ['etl pipelines', 'data processing', 'data engineering'],
  'data preprocessing': ['data cleaning', 'data transformation', 'feature engineering'],
  'feature engineering': ['feature extraction', 'feature selection', 'data preprocessing'],
  
  // Infrastructure
  'scalability': ['horizontal scaling', 'auto-scaling', 'distributed systems'],
  'latency optimization': ['performance optimization', 'inference optimization', 'speed optimization'],
  'cloud-native': ['containerization', 'kubernetes', 'docker', 'microservices'],
  
  // MLOps
  'ci/cd': ['continuous integration', 'continuous deployment', 'devops', 'automation'],
  'mlops': ['model lifecycle', 'ml operations', 'production ml', 'ai systems'],
  'experiment tracking': ['model versioning', 'mlflow', 'model registry'],
  
  // Architecture
  'system design': ['software architecture', 'system architecture', 'distributed systems'],
  'microservices': ['api development', 'rest apis', 'service architecture'],
  'api development': ['rest apis', 'api integration', 'microservices']
};

// ============================================================================
// 2. SEMANTIC SIMILARITY (Fuzzy Matching)
// ============================================================================

function calculateSimilarity(str1, str2) {
  /**
   * Calculate semantic similarity between two strings
   * Uses Jaccard similarity on word sets
   * Threshold: 0.7 for match
   */
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function findSemanticMatch(concept, candidateList, threshold = 0.7) {
  /**
   * Find if concept matches any candidate using semantic similarity
   * Returns: { matched: boolean, matchedConcept: string, similarity: number }
   */
  for (const candidate of candidateList) {
    const similarity = calculateSimilarity(concept, candidate);
    if (similarity >= threshold) {
      return { matched: true, matchedConcept: candidate, similarity };
    }
  }
  return { matched: false, matchedConcept: null, similarity: 0 };
}

function findConceptMatch(jdConcept, resumeConcepts) {
  /**
   * Check if JD concept matches resume using:
   * 1. Exact match
   * 2. Semantic similarity (>0.7)
   * 3. Concept mapping (synonyms)
   */
  
  // 1. Exact match
  if (resumeConcepts.includes(jdConcept)) {
    return { matched: true, type: 'exact', matchedWith: jdConcept, confidence: 1.0 };
  }
  
  // 2. Semantic similarity
  const semanticMatch = findSemanticMatch(jdConcept, resumeConcepts, 0.7);
  if (semanticMatch.matched) {
    return { 
      matched: true, 
      type: 'semantic', 
      matchedWith: semanticMatch.matchedConcept, 
      confidence: semanticMatch.similarity 
    };
  }
  
  // 3. Concept mapping (check if JD concept maps to any resume concept)
  if (CONCEPT_MAPPING[jdConcept]) {
    for (const relatedConcept of CONCEPT_MAPPING[jdConcept]) {
      if (resumeConcepts.includes(relatedConcept)) {
        return { 
          matched: true, 
          type: 'mapped', 
          matchedWith: relatedConcept, 
          confidence: 0.8 
        };
      }
      // Also check semantic similarity on mapped concepts
      const mappedSemanticMatch = findSemanticMatch(relatedConcept, resumeConcepts, 0.7);
      if (mappedSemanticMatch.matched) {
        return { 
          matched: true, 
          type: 'mapped-semantic', 
          matchedWith: mappedSemanticMatch.matchedConcept, 
          confidence: 0.75 
        };
      }
    }
  }
  
  return { matched: false, type: 'none', matchedWith: null, confidence: 0 };
}

// ============================================================================
// 3. WEIGHTED CONCEPT EXTRACTION
// ============================================================================

function extractWeightedConcepts(text) {
  /**
   * Extract concepts with weights
   * Core skills = 1.0
   * Use-case concepts = 0.5 (lower weight)
   */
  
  const textLower = text.toLowerCase();
  
  const coreSkills = {
    weight: 1.0,
    patterns: [
      'machine learning', 'deep learning', 'artificial intelligence', 'ai systems',
      'neural networks', 'reinforcement learning', 'supervised learning', 'unsupervised learning',
      'feature engineering', 'model training', 'model deployment', 'model optimization',
      'hyperparameter tuning', 'transfer learning', 'fine-tuning', 'zero-shot learning',
      'few-shot learning', 'generative ai', 'llm', 'large language models',
      'natural language processing', 'nlp', 'computer vision',
      'model evaluation', 'model monitoring', 'model versioning', 'model performance',
      'embeddings', 'transformers', 'attention mechanisms',
      'mlops', 'ci/cd', 'continuous integration', 'continuous deployment',
      'model lifecycle', 'experiment tracking', 'model registry',
      'distributed computing', 'distributed training', 'parallel processing',
      'scalability', 'high availability', 'fault tolerance',
      'latency optimization', 'performance optimization', 'inference optimization',
      'production systems', 'production deployment', 'real-time inference',
      'batch processing', 'stream processing', 'containerization', 'orchestration',
      'monitoring', 'logging', 'alerting', 'observability',
      'cloud-native', 'serverless', 'infrastructure as code',
      'data engineering', 'data pipelines', 'data processing', 'etl pipelines',
      'data quality', 'data validation', 'data cleaning', 'data preprocessing',
      'data transformation', 'data integration', 'feature extraction',
      'system design', 'system architecture', 'software architecture',
      'distributed systems', 'microservices', 'api development', 'rest apis',
      'high-performance computing', 'gpu computing', 'parallel computing'
    ]
  };
  
  const useCaseConcepts = {
    weight: 0.5,
    patterns: [
      'pattern recognition', 'target detection', 'decision systems',
      'sentiment analysis', 'object detection', 'image classification',
      'text classification', 'recommendation systems', 'anomaly detection',
      'time series forecasting'
    ]
  };
  
  const processConcepts = {
    weight: 0.7,
    patterns: [
      'cross-functional teams', 'agile development', 'scrum',
      'code review', 'technical documentation', 'stakeholder management',
      'requirements gathering', 'problem solving', 'research and development',
      'proof of concept', 'prototyping', 'a/b testing', 'experimentation',
      'benchmarking'
    ]
  };
  
  const concepts = [];
  
  // Extract core skills
  for (const pattern of coreSkills.patterns) {
    if (textLower.includes(pattern)) {
      concepts.push({ concept: pattern, weight: coreSkills.weight, category: 'core' });
    }
  }
  
  // Extract use-case concepts
  for (const pattern of useCaseConcepts.patterns) {
    if (textLower.includes(pattern)) {
      concepts.push({ concept: pattern, weight: useCaseConcepts.weight, category: 'use-case' });
    }
  }
  
  // Extract process concepts
  for (const pattern of processConcepts.patterns) {
    if (textLower.includes(pattern)) {
      concepts.push({ concept: pattern, weight: processConcepts.weight, category: 'process' });
    }
  }
  
  return concepts;
}

// ============================================================================
// 4. N-GRAM EXTRACTION (Better JD Understanding)
// ============================================================================

function extractNGrams(text, n = 3) {
  /**
   * Extract n-grams (2-3 word phrases) from text
   * Helps capture multi-word concepts from JD
   */
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const ngrams = [];
  
  // Extract 2-grams and 3-grams
  for (let size = 2; size <= n; size++) {
    for (let i = 0; i <= words.length - size; i++) {
      const ngram = words.slice(i, i + size).join(' ');
      ngrams.push(ngram);
    }
  }
  
  // Count frequency
  const freq = {};
  ngrams.forEach(ng => freq[ng] = (freq[ng] || 0) + 1);
  
  // Return top frequent n-grams (appearing 2+ times)
  return Object.entries(freq)
    .filter(([ng, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([ng]) => ng);
}

// ============================================================================
// 5. TOOL EXTRACTION
// ============================================================================

function extractTools(text) {
  const textLower = text.toLowerCase();
  const tools = [];
  
  const toolPatterns = [
    'python', 'java', 'javascript', 'go', 'golang', 'scala', 'r',
    'tensorflow', 'pytorch', 'keras', 'sklearn', 'pandas', 'numpy',
    'aws', 'azure', 'gcp', 'lambda', 'ec2', 's3', 'sagemaker',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
    'docker', 'kubernetes', 'jenkins', 'github', 'gitlab', 'git',
    'kafka', 'spark', 'airflow', 'mlflow', 'fastapi', 'flask'
  ];
  
  for (const tool of toolPatterns) {
    const regex = new RegExp(`\\b${tool}\\b`, 'i');
    if (regex.test(textLower)) {
      tools.push(tool);
    }
  }
  
  return tools;
}

// ============================================================================
// 6. INTELLIGENT SCORING
// ============================================================================

function calculateIntelligentScore(resumeData, jdData) {
  /**
   * Weighted scoring formula:
   * Score = (semantic_match * 0.6) + (tool_match * 0.3) + (inferred_match * 0.1)
   */
  
  const jdConcepts = jdData.concepts.map(c => c.concept);
  const resumeConcepts = resumeData.concepts.map(c => c.concept);
  const jdTools = jdData.tools;
  const resumeTools = resumeData.tools;
  
  // Semantic concept matching with weights
  let semanticScore = 0;
  let totalWeight = 0;
  const matches = [];
  const missing = [];
  
  jdData.concepts.forEach(jdItem => {
    const match = findConceptMatch(jdItem.concept, resumeConcepts);
    totalWeight += jdItem.weight;
    
    if (match.matched) {
      semanticScore += jdItem.weight * match.confidence;
      matches.push({
        jdConcept: jdItem.concept,
        resumeConcept: match.matchedWith,
        matchType: match.type,
        confidence: match.confidence,
        weight: jdItem.weight
      });
    } else {
      missing.push({
        concept: jdItem.concept,
        weight: jdItem.weight,
        category: jdItem.category
      });
    }
  });
  
  const semanticMatchPercent = totalWeight > 0 ? (semanticScore / totalWeight) * 100 : 0;
  
  // Tool matching
  const commonTools = jdTools.filter(t => resumeTools.includes(t));
  const missingTools = jdTools.filter(t => !resumeTools.includes(t));
  const toolMatchPercent = jdTools.length > 0 ? (commonTools.length / jdTools.length) * 100 : 0;
  
  // Inferred matching (from concept mapping)
  const inferredMatches = matches.filter(m => m.matchType === 'mapped' || m.matchType === 'mapped-semantic');
  const inferredMatchPercent = inferredMatches.length > 0 ? 10 : 0;
  
  // Final weighted score
  const finalScore = (semanticMatchPercent * 0.6) + (toolMatchPercent * 0.3) + (inferredMatchPercent * 0.1);
  
  return {
    finalScore: finalScore.toFixed(1),
    semanticMatchPercent: semanticMatchPercent.toFixed(1),
    toolMatchPercent: toolMatchPercent.toFixed(1),
    matches,
    missing,
    commonTools,
    missingTools
  };
}

// ============================================================================
// 7. MAIN ANALYSIS
// ============================================================================

function main() {
  printHeader('🚀 SEMANTIC MATCHER - Intelligent Matching System');
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  // Preprocess
  const resumePreprocessed = preprocessResume(resumeText);
  const jdPreprocessed = preprocessResume(jdText);
  
  // Extract features
  printSection('📊 EXTRACTING FEATURES');
  
  const resumeConcepts = extractWeightedConcepts(resumePreprocessed);
  const jdConcepts = extractWeightedConcepts(jdPreprocessed);
  const jdNGrams = extractNGrams(jdPreprocessed);
  
  const resumeTools = extractTools(resumePreprocessed);
  const jdTools = extractTools(jdPreprocessed);
  
  console.log(`Resume: ${resumeConcepts.length} concepts, ${resumeTools.length} tools`);
  console.log(`JD: ${jdConcepts.length} concepts, ${jdTools.length} tools`);
  console.log(`JD N-grams: ${jdNGrams.length} frequent phrases`);
  
  // Calculate intelligent score
  printSection('🎯 INTELLIGENT MATCHING');
  
  const result = calculateIntelligentScore(
    { concepts: resumeConcepts, tools: resumeTools },
    { concepts: jdConcepts, tools: jdTools }
  );
  
  console.log(colors.bright + `\n📊 FINAL SCORE: ${result.finalScore}%` + colors.reset);
  console.log(`  - Semantic Match: ${result.semanticMatchPercent}% (weight: 60%)`);
  console.log(`  - Tool Match: ${result.toolMatchPercent}% (weight: 30%)`);
  console.log(`  - Inferred Match: ${result.matches.filter(m => m.matchType.includes('mapped')).length > 0 ? '10%' : '0%'} (weight: 10%)`);
  
  // Show matches
  printSection('✅ MATCHED CONCEPTS');
  console.log(`Found ${result.matches.length} matches:\n`);
  
  result.matches.forEach((match, i) => {
    const typeColor = match.matchType === 'exact' ? colors.green : 
                      match.matchType === 'semantic' ? colors.cyan :
                      colors.yellow;
    console.log(`${i + 1}. ${colors.bright}${match.jdConcept}${colors.reset}`);
    console.log(`   ${typeColor}↔ ${match.resumeConcept}${colors.reset}`);
    console.log(`   Type: ${match.matchType}, Confidence: ${(match.confidence * 100).toFixed(0)}%, Weight: ${match.weight}`);
  });
  
  // Show missing
  printSection('❌ MISSING CONCEPTS');
  console.log(`Found ${result.missing.length} missing:\n`);
  
  result.missing.forEach((item, i) => {
    const categoryColor = item.category === 'core' ? colors.red :
                          item.category === 'use-case' ? colors.yellow :
                          colors.blue;
    console.log(`${i + 1}. ${categoryColor}${item.concept}${colors.reset} (weight: ${item.weight}, category: ${item.category})`);
  });
  
  // Show tools
  printSection('🔧 TOOL MATCH');
  console.log(colors.green + `✅ Common: ${result.commonTools.join(', ')}` + colors.reset);
  if (result.missingTools.length > 0) {
    console.log(colors.red + `❌ Missing: ${result.missingTools.join(', ')}` + colors.reset);
  }
  
  // Verdict
  printSection('💡 VERDICT');
  if (result.finalScore >= 80) {
    console.log(colors.green + '✅ EXCELLENT MATCH! Your resume strongly aligns with this JD.' + colors.reset);
  } else if (result.finalScore >= 60) {
    console.log(colors.yellow + '⚠️  GOOD MATCH. Consider adding missing core concepts if you have them.' + colors.reset);
  } else {
    console.log(colors.red + '❌ FAIR MATCH. Significant tailoring needed or role may not align.' + colors.reset);
  }
  
  printHeader('✅ ANALYSIS COMPLETE');
}

main();
