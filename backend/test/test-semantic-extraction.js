/**
 * ENHANCED Feature Extraction Debug Script
 * 
 * Extracts both TOOL KEYWORDS and SEMANTIC CONCEPTS
 * Shows what the AI actually understands from your resume and JD
 * 
 * Usage: node test/test-semantic-extraction.js
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

// Extract semantic concepts (NEW!)
function extractSemanticConcepts(text) {
  if (!text) return { all: [], byCategory: {} };
  
  const textLower = text.toLowerCase();
  
  const categories = {
    '🧠 AI/ML Core': [
      'machine learning', 'deep learning', 'artificial intelligence', 'ai systems',
      'neural networks', 'reinforcement learning', 'supervised learning', 'unsupervised learning',
      'feature engineering', 'model training', 'model deployment', 'model optimization',
      'hyperparameter tuning', 'transfer learning', 'fine-tuning', 'zero-shot learning',
      'few-shot learning', 'generative ai', 'llm', 'large language models',
      'computer vision', 'natural language processing', 'nlp', 'sentiment analysis',
      'object detection', 'image classification', 'text classification',
      'recommendation systems', 'anomaly detection', 'time series forecasting',
      'model evaluation', 'model monitoring', 'model versioning', 'model performance',
      'embeddings', 'transformers', 'attention mechanisms', 'pattern recognition',
      'target detection', 'decision systems'
    ],
    '⚙️ MLOps & Systems': [
      'mlops', 'ci/cd', 'continuous integration', 'continuous deployment',
      'model lifecycle', 'experiment tracking', 'model registry',
      'distributed computing', 'distributed training', 'parallel processing',
      'scalability', 'high availability', 'fault tolerance',
      'latency optimization', 'performance optimization', 'inference optimization',
      'production systems', 'production deployment', 'real-time inference',
      'batch processing', 'stream processing', 'containerization', 'orchestration',
      'monitoring', 'logging', 'alerting', 'observability',
      'cloud-native', 'serverless', 'infrastructure as code',
      'multi-agent', 'system-of-systems'
    ],
    '📊 Data Engineering': [
      'data engineering', 'data pipelines', 'data processing', 'etl pipelines',
      'big data', 'data warehousing', 'data lakes', 'data ingestion',
      'data quality', 'data validation', 'data cleaning', 'data preprocessing',
      'data transformation', 'data integration', 'data migration',
      'real-time data', 'streaming data', 'batch data',
      'data governance', 'data security', 'data privacy',
      'large-scale data', 'distributed data', 'data architecture',
      'feature extraction', 'data analysis', 'data drift'
    ],
    '🏗️ Architecture & Design': [
      'system design', 'system architecture', 'software architecture',
      'distributed systems', 'event-driven architecture', 'message queues',
      'load balancing', 'caching', 'database optimization',
      'horizontal scaling', 'vertical scaling', 'auto-scaling',
      'high-performance computing', 'gpu computing', 'parallel computing',
      'api development', 'rest apis', 'api integration', 'microservices'
    ],
    '🤝 Collaboration & Process': [
      'cross-functional teams', 'agile development', 'scrum',
      'code review', 'technical documentation', 'stakeholder management',
      'requirements gathering', 'problem solving', 'research and development',
      'proof of concept', 'prototyping', 'a/b testing', 'experimentation',
      'benchmarking'
    ]
  };
  
  const foundConcepts = { all: [], byCategory: {} };
  
  // Find matching concepts
  for (const [category, patterns] of Object.entries(categories)) {
    const matches = [];
    for (const pattern of patterns) {
      if (textLower.includes(pattern)) {
        matches.push(pattern);
        if (!foundConcepts.all.includes(pattern)) {
          foundConcepts.all.push(pattern);
        }
      }
    }
    if (matches.length > 0) {
      foundConcepts.byCategory[category] = matches;
    }
  }
  
  return foundConcepts;
}

// Extract tool keywords
function extractToolKeywords(text) {
  if (!text) return { all: [], byCategory: {} };
  
  const textLower = text.toLowerCase();
  
  const categories = {
    '🐍 Programming Languages': [
      'python', 'java', 'javascript', 'typescript', 'go', 'golang', 'rust', 'scala', 'r'
    ],
    '🤖 ML/AI Frameworks': [
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy',
      'opencv', 'bert', 'gpt', 'transformers', 'huggingface', 'llm'
    ],
    '☁️ Cloud Platforms': [
      'aws', 'azure', 'gcp', 'google cloud', 'lambda', 'ec2', 's3', 'sagemaker', 'bedrock'
    ],
    '🗄️ Databases': [
      'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch'
    ],
    '🔧 DevOps Tools': [
      'docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github', 'git', 'ci/cd'
    ],
    '🔨 Other Tools': [
      'kafka', 'spark', 'airflow', 'mlflow', 'fastapi', 'flask', 'rest', 'api', 'linux', 'bash'
    ]
  };
  
  const foundTools = { all: [], byCategory: {} };
  
  for (const [category, patterns] of Object.entries(categories)) {
    const matches = [];
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(textLower)) {
        matches.push(pattern);
        if (!foundTools.all.includes(pattern)) {
          foundTools.all.push(pattern);
        }
      }
    }
    if (matches.length > 0) {
      foundTools.byCategory[category] = matches;
    }
  }
  
  return foundTools;
}

// Analyze text
function analyzeText(text, label) {
  printHeader(`${label} ANALYSIS`);
  
  // Preprocess
  const preprocessed = preprocessResume(text);
  console.log(`Original length: ${text.length} characters`);
  console.log(`Preprocessed length: ${preprocessed.length} characters`);
  
  // Extract semantic concepts
  printSection('🧠 SEMANTIC CONCEPTS EXTRACTED');
  const concepts = extractSemanticConcepts(preprocessed);
  console.log(`Found ${concepts.all.length} semantic concepts:\n`);
  
  for (const [category, items] of Object.entries(concepts.byCategory)) {
    console.log(colors.bright + category + colors.reset);
    items.forEach(item => console.log(`  • ${item}`));
    console.log('');
  }
  
  // Extract tool keywords
  printSection('🔧 TOOL KEYWORDS EXTRACTED');
  const tools = extractToolKeywords(preprocessed);
  console.log(`Found ${tools.all.length} tool keywords:\n`);
  
  for (const [category, items] of Object.entries(tools.byCategory)) {
    console.log(colors.bright + category + colors.reset);
    console.log(`  ${items.join(', ')}`);
  }
  
  return { preprocessed, concepts, tools };
}

// Compare
function compareFeatures(resumeData, jdData) {
  printHeader('🔄 COMPARISON');
  
  // Compare semantic concepts
  printSection('🧠 SEMANTIC CONCEPTS MATCH');
  const resumeConcepts = new Set(resumeData.concepts.all);
  const jdConcepts = new Set(jdData.concepts.all);
  
  const commonConcepts = [...jdConcepts].filter(c => resumeConcepts.has(c));
  const missingConcepts = [...jdConcepts].filter(c => !resumeConcepts.has(c));
  
  console.log(colors.green + `✅ Common: ${commonConcepts.length}/${jdConcepts.size}` + colors.reset);
  commonConcepts.forEach(c => console.log(`  • ${c}`));
  
  console.log(colors.red + `\n❌ Missing: ${missingConcepts.length}` + colors.reset);
  missingConcepts.forEach(c => console.log(`  • ${c}`));
  
  // Compare tools
  printSection('🔧 TOOL KEYWORDS MATCH');
  const resumeTools = new Set(resumeData.tools.all);
  const jdTools = new Set(jdData.tools.all);
  
  const commonTools = [...jdTools].filter(t => resumeTools.has(t));
  const missingTools = [...jdTools].filter(t => !resumeTools.has(t));
  
  console.log(colors.green + `✅ Common: ${commonTools.length}/${jdTools.size}` + colors.reset);
  console.log(`  ${commonTools.join(', ')}`);
  
  console.log(colors.red + `\n❌ Missing: ${missingTools.length}` + colors.reset);
  console.log(`  ${missingTools.join(', ')}`);
  
  // Overall match
  printSection('📊 OVERALL MATCH SCORE');
  const conceptMatch = jdConcepts.size > 0 ? (commonConcepts.length / jdConcepts.size * 100).toFixed(1) : 0;
  const toolMatch = jdTools.size > 0 ? (commonTools.length / jdTools.size * 100).toFixed(1) : 0;
  const overallMatch = ((parseFloat(conceptMatch) + parseFloat(toolMatch)) / 2).toFixed(1);
  
  console.log(`Semantic Concepts Match: ${conceptMatch}%`);
  console.log(`Tool Keywords Match: ${toolMatch}%`);
  console.log(colors.bright + `Overall Match: ${overallMatch}%` + colors.reset);
  
  if (overallMatch >= 80) {
    console.log(colors.green + '\n✅ Excellent match!' + colors.reset);
  } else if (overallMatch >= 60) {
    console.log(colors.yellow + '\n⚠️  Good match, consider adding missing items' + colors.reset);
  } else {
    console.log(colors.red + '\n❌ Low match, significant tailoring needed' + colors.reset);
  }
}

// Main
function main() {
  printHeader('🔬 SEMANTIC FEATURE EXTRACTION DEBUG TOOL');
  
  // Read files
  const resumePath = path.join(__dirname, 'resume.txt');
  const jdPath = path.join(__dirname, 'jd.txt');
  
  const resumeText = fs.readFileSync(resumePath, 'utf-8');
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  
  // Analyze
  const resumeData = analyzeText(resumeText, '📝 RESUME');
  const jdData = analyzeText(jdText, '📋 JOB DESCRIPTION');
  
  // Compare
  compareFeatures(resumeData, jdData);
  
  printHeader('✅ ANALYSIS COMPLETE');
}

main();
