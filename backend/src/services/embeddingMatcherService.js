/**
 * Embedding-Based Job Matching Service
 * Fast semantic similarity matching using embeddings and cosine similarity
 */

const { preprocessResume, preprocessJobDescription } = require('./textPreprocessor');
const { generateEmbedding, generateBatchEmbeddings } = require('./embeddingClient');

/**
 * Compute cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Cosine similarity (0-1)
 */
const cosineSimilarity = (vecA, vecB) => {
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
};

/**
 * Compute cosine similarity for normalized vectors (faster)
 * Since embeddings from the service are already normalized, we can use dot product directly
 * @param {Array<number>} vecA - First normalized vector
 * @param {Array<number>} vecB - Second normalized vector
 * @returns {number} - Cosine similarity (0-1)
 */
const cosineSimilarityNormalized = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  return dotProduct;
};

/**
 * Process jobs in batches for embedding generation
 * @param {Array<object>} jobs - Array of job objects
 * @param {number} batchSize - Number of jobs per batch
 * @returns {Promise<Array<{job: object, embedding: Array<number>, preprocessedText: string}>>}
 */
const processJobsInBatches = async (jobs, batchSize = 20) => {
  console.log(`📦 [Embedding Matcher] Processing ${jobs.length} jobs in batches of ${batchSize}`);
  
  const results = [];
  const startTime = Date.now();

  // Process jobs in batches
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(jobs.length / batchSize);

    console.log(`   🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);

    try {
      // Preprocess all jobs in batch
      const preprocessedTexts = batch.map(job => preprocessJobDescription(job));

      // Generate embeddings for batch
      const embeddings = await generateBatchEmbeddings(preprocessedTexts);

      // Combine results
      for (let j = 0; j < batch.length; j++) {
        results.push({
          job: batch[j],
          embedding: embeddings[j],
          preprocessedText: preprocessedTexts[j]
        });
      }

      console.log(`      ✓ Batch ${batchNum}/${totalBatches} complete`);
    } catch (error) {
      console.error(`      ✗ Batch ${batchNum}/${totalBatches} failed:`, error.message);
      // Add jobs with null embeddings (will be filtered later)
      for (const job of batch) {
        results.push({
          job: job,
          embedding: null,
          preprocessedText: preprocessJobDescription(job)
        });
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [Embedding Matcher] Processed ${jobs.length} jobs in ${totalTime}s`);

  return results;
};

/**
 * Calculate skills match percentage between resume and job
 * @param {Array<string>} resumeSkills - Skills from resume
 * @param {string} jobText - Preprocessed job text
 * @param {object} job - Original job object (for checking raw description)
 * @returns {number} - Skills match percentage (0-100)
 */
const calculateSkillsMatch = (resumeSkills, jobText, job) => {
  if (!resumeSkills || resumeSkills.length === 0) return 0;
  
  // Combine preprocessed text with raw job description for better matching
  const rawJobDesc = (job.job_description || '').toLowerCase();
  const rawJobTitle = (job.job_title || '').toLowerCase();
  const combinedText = (jobText + ' ' + rawJobDesc + ' ' + rawJobTitle).toLowerCase();
  
  let matchedCount = 0;
  const matchedSkills = [];
  
  for (const skill of resumeSkills) {
    const skillLower = skill.toLowerCase();
    
    // Handle multi-word skills (e.g., "React.js", "Node.js", "C++")
    const skillVariants = [
      skillLower,
      skillLower.replace(/\./g, ''),      // "react.js" → "reactjs"
      skillLower.replace(/\./g, ' '),     // "react.js" → "react js"
      skillLower.replace(/\+/g, 'plus'),  // "c++" → "cplus"
      skillLower.replace(/#/g, 'sharp'),  // "c#" → "csharp"
      skillLower.split('.')[0],           // "react.js" → "react"
      skillLower.split('/')[0]            // "html/css" → "html"
    ];
    
    // Check if any variant appears in job text
    let found = false;
    for (const variant of skillVariants) {
      if (variant && combinedText.includes(variant)) {
        found = true;
        matchedSkills.push(skill);
        break;
      }
    }
    
    if (found) {
      matchedCount++;
    }
  }
  
  const matchPercent = Math.round((matchedCount / resumeSkills.length) * 100);
  
  // Debug logging for first few jobs
  if (matchedCount > 0) {
    console.log(`      🔧 Skills match: ${matchPercent}% (${matchedCount}/${resumeSkills.length}) - Matched: ${matchedSkills.slice(0, 5).join(', ')}`);
  }
  
  return matchPercent;
};

/**
 * Determine experience level from years
 * @param {number} years - Years of experience
 * @returns {string} - Experience level
 */
const getExperienceLevel = (years) => {
  if (years === 0) return "Intern";
  if (years <= 2) return "Junior";
  if (years <= 5) return "Mid";
  return "Senior";
};

/**
 * Extract required experience years from job with improved parsing
 * Analyzes job description, qualifications, and responsibilities
 * @param {object} job - Job object
 * @returns {object} - {minYears, maxYears, level, confidence}
 */
const extractJobExperience = (job) => {
  // Combine all text sources for analysis
  const jobDesc = (job.job_description || '').toLowerCase();
  const jobTitle = (job.job_title || '').toLowerCase();
  
  let qualText = '';
  if (job.job_highlights?.Qualifications) {
    qualText = job.job_highlights.Qualifications.join(' ').toLowerCase();
  }
  
  let respText = '';
  if (job.job_highlights?.Responsibilities) {
    respText = job.job_highlights.Responsibilities.join(' ').toLowerCase();
  }
  
  // Combine all text for comprehensive analysis
  const combinedText = `${jobTitle} ${jobDesc} ${qualText} ${respText}`;
  
  // Check for experience level keywords
  const isIntern = /\b(intern|internship|trainee)\b/i.test(combinedText);
  const isFresher = /\b(fresher|fresh graduate|no experience|0 year)\b/i.test(combinedText);
  const isJunior = /\b(junior|entry.?level|graduate)\b/i.test(combinedText);
  const isMid = /\b(mid.?level|intermediate)\b/i.test(combinedText);
  const isSenior = /\b(senior|sr\.|lead|principal|staff|architect)\b/i.test(combinedText);
  
  let minYears = 0;
  let maxYears = 0;
  let level = "Any";
  let confidence = "low";
  let explicitYearsFound = false; // Track if we found explicit years
  
  // Pattern 1: Range with "years" (e.g., "2-4 years", "3 to 5 years", "6 10 years")
  // CRITICAL: Use global flag and find ALL matches, then pick the best one
  // This prevents single number patterns from matching before range patterns
  
  let rangeMatch = null;
  let bestMatch = null;
  
  // Try hyphen or "to" pattern (most explicit)
  const hyphenPattern = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:\+)?\s*years?/gi;
  const hyphenMatches = [...combinedText.matchAll(hyphenPattern)];
  
  if (hyphenMatches.length > 0) {
    // Use the first match (usually in qualifications section)
    rangeMatch = hyphenMatches[0];
    console.log(`   🔍 [DEBUG] Hyphen pattern matched: "${rangeMatch[0]}" (found ${hyphenMatches.length} matches)`);
  }
  
  // If no hyphen match, try space-separated pattern
  if (!rangeMatch) {
    const spacePattern = /(\d+)\s+(\d+)\s+years?/gi;
    const spaceMatches = [...combinedText.matchAll(spacePattern)];
    
    if (spaceMatches.length > 0) {
      rangeMatch = spaceMatches[0];
      console.log(`   🔍 [DEBUG] Space pattern matched: "${rangeMatch[0]}" (found ${spaceMatches.length} matches)`);
    }
  }
  
  if (rangeMatch) {
    const num1 = parseInt(rangeMatch[1]);
    const num2 = parseInt(rangeMatch[2]);
    
    console.log(`   🔍 [DEBUG] Extracted numbers: ${num1}, ${num2}`);
    
    // Validate it's actually a range (not just two separate numbers)
    // Check if the numbers are close together (within 15 years) and num2 > num1
    if (num2 > num1 && (num2 - num1) <= 15) {
      minYears = num1;
      maxYears = num2;
      confidence = "high";
      explicitYearsFound = true;
      console.log(`   📊 Found explicit range: ${minYears}-${maxYears} years`);
    } else {
      // If numbers don't make sense as a range, treat as single number
      const years = num2; // Use the second number (usually the max)
      minYears = Math.max(0, years - 1);
      maxYears = years + 1;
      confidence = "medium";
      console.log(`   📊 Found ambiguous range "${rangeMatch[0]}", using ${years} years → ${minYears}-${maxYears} years`);
    }
  }
  
  // Pattern 2: Single number with "years" (e.g., "3 years", "5+ years")
  if (!rangeMatch) {
    // First try to find written numbers with numeric in parentheses: "seven (7) years"
    const writtenPattern = /(?:at least|minimum of)?\s*(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\s*\((\d+)\)\s*years?/i;
    const writtenMatch = combinedText.match(writtenPattern);
    
    if (writtenMatch) {
      const years = parseInt(writtenMatch[1]);
      
      // ALL written patterns mean "X or more" (no upper limit)
      minYears = years;
      maxYears = 99; // No upper limit
      confidence = "high";
      explicitYearsFound = true;
      console.log(`   📊 Found explicit written number: "${writtenMatch[0]}" → ${minYears}+ years (no upper limit)`);
    } else {
      // Try standard numeric pattern
      const singlePattern = /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)?/i;
      const singleMatch = combinedText.match(singlePattern);
      
      if (singleMatch) {
        const years = parseInt(singleMatch[1]);
        
        // ALL single number patterns mean "X or more" (no upper limit)
        // "7 years" → 7+ (no upper limit)
        // "5+ years" → 5+ (no upper limit)
        minYears = years;
        maxYears = 99; // No upper limit
        confidence = "medium";
        explicitYearsFound = true;
        console.log(`   📊 Found explicit years: ${years} years → ${minYears}+ years (no upper limit)`);
      }
    }
  }
  
  // Pattern 3: No explicit years, infer from level keywords ONLY
  // CRITICAL: Only use level keywords if NO explicit years were found
  if (!explicitYearsFound && minYears === 0 && maxYears === 0) {
    if (isIntern || isFresher) {
      minYears = 0;
      maxYears = 0;
      level = "Intern/Fresher";
      confidence = "medium";
      console.log(`   📊 Detected level keyword (no explicit years): ${level} → 0 years`);
    } else if (isJunior) {
      minYears = 0;
      maxYears = 2;
      level = "Junior";
      confidence = "medium";
      console.log(`   📊 Detected level keyword (no explicit years): Junior → 0-2 years`);
    } else if (isMid) {
      minYears = 3;
      maxYears = 5;
      level = "Mid";
      confidence = "medium";
      console.log(`   📊 Detected level keyword (no explicit years): Mid → 3-5 years`);
    } else if (isSenior) {
      minYears = 5;
      maxYears = 15;
      level = "Senior";
      confidence = "medium";
      console.log(`   📊 Detected level keyword (no explicit years): Senior → 5-15 years`);
    } else {
      // No clear indication, assume entry to mid level
      minYears = 0;
      maxYears = 5;
      level = "Any";
      confidence = "low";
      console.log(`   📊 No experience requirement found → 0-5 years (default)`);
    }
  } else if (explicitYearsFound) {
    // Explicit years found - determine level from the years
    if (minYears >= 5) {
      level = "Senior";
    } else if (minYears >= 3) {
      level = "Mid";
    } else if (minYears > 0) {
      level = "Junior";
    } else {
      level = "Entry";
    }
    console.log(`   ℹ️  Level inferred from explicit years: ${level}`);
  }
  
  return { minYears, maxYears, level, confidence };
};

/**
 * Calculate experience score with custom logic
 * Rewards candidates with more experience, but keeps scores realistic
 * @param {number} candidateYears - Candidate's years of experience
 * @param {number} requiredYears - Job's required years (use average if range)
 * @returns {number} - Experience score (0 to 1.1, slight bonus for overqualified)
 */
const calculateExperienceScore = (candidateYears, requiredYears) => {
  const diff = candidateYears - requiredYears;
  
  if (diff === 0) {
    // Perfect match
    return 1.0;  // 100%
  }
  else if (diff === -1) {
    // 1 year less (acceptable)
    return 0.85;  // 85%
  }
  else if (diff === -2) {
    // 2 years less (still acceptable)
    return 0.60;  // 60%
  }
  else if (diff <= -3) {
    // 3+ years less (underqualified)
    return 0.0;  // 0%
  }
  else if (diff === 1) {
    // 1 year more (slightly overqualified - good)
    return 1.05;  // 105% (reduced from 125%)
  }
  else if (diff === 2) {
    // 2 years more (overqualified - good)
    return 1.10;  // 110% (reduced from 140%)
  }
  else if (diff >= 3) {
    // 3+ years more (very overqualified - may be too senior)
    return 1.05;  // 105% (reduced from 130%)
  }
  
  return 0.5; // Fallback
};

/**
 * Check if candidate experience matches job requirement
 * RULE: Show jobs from 0 to (candidate_exp + 1)
 * @param {number} candidateYears - Candidate's years of experience
 * @param {object} jobExp - Job experience requirement {minYears, maxYears}
 * @returns {boolean} - True if matches
 */
const isExperienceMatch = (candidateYears, jobExp) => {
  const { minYears, maxYears } = jobExp;
  
  // If no experience requirement specified, accept all
  if (minYears === 0 && maxYears === 0) return true;
  
  // NEW RULE: Show jobs from 0 to (candidate + 1)
  // Examples:
  // - 0 years → show 0-1 years jobs
  // - 2 years → show 0-3 years jobs
  // - 5 years → show 0-6 years jobs
  
  const allowedMin = 0;
  const allowedMax = candidateYears + 1;
  
  // Job must fall within allowed range
  // Check if there's any overlap between job range and allowed range
  const hasOverlap = !(maxYears < allowedMin || minYears > allowedMax);
  
  return hasOverlap;
};

/**
 * Match resume with jobs using embedding-based similarity
 * NEW FLOW: Skills Match → Experience Match → Content Scoring
 * @param {string} resumeText - Raw resume text
 * @param {Array<object>} jobs - Array of job objects from JSearch API
 * @param {object} resumeAnalysis - Parsed resume data from Groq
 * @param {object} options - Matching options
 * @returns {Promise<Array<object>>} - Matched jobs with similarity scores
 */
const matchJobsWithEmbeddings = async (resumeText, jobs, resumeAnalysis, options = {}) => {
  const {
    topN = 120,
    threshold = 60,
    batchSize = 20
  } = options;

  console.log(`⚡ [Embedding Matcher] Starting embedding-based matching for ${jobs.length} jobs`);
  console.log(`📋 [Embedding Matcher] Filters: Experience match ONLY (no skills filter)`);
  console.log(`🎯 [Embedding Matcher] Scoring: 100% Semantic Similarity (no experience bonus)`);
  console.log(`📊 [Embedding Matcher] Rescaling: [0.3-0.7] → [0-100%] (human-aligned perception)`);
  console.log(`⚙️  [Embedding Matcher] Preprocessing: Skills(4x), Qualifications(3x), Responsibilities(2x), Title(3x)`);
  const startTime = Date.now();

  try {
    // Step 1: Extract resume data
    console.log('📄 [Embedding Matcher] Extracting resume data...');
    const resumeSkills = resumeAnalysis.skills || [];
    const resumeYears = resumeAnalysis.experience_years || 0;
    const resumeLevel = getExperienceLevel(resumeYears);
    
    console.log(`   👤 Candidate: ${resumeYears} years (${resumeLevel}), ${resumeSkills.length} skills`);
    console.log(`   🔧 Skills: ${resumeSkills.slice(0, 10).join(', ')}${resumeSkills.length > 10 ? '...' : ''}`);

    // Step 2: Preprocess resume
    console.log('📄 [Embedding Matcher] Preprocessing resume...');
    const preprocessedResume = preprocessResume(resumeText);

    if (!preprocessedResume) {
      throw new Error('Resume preprocessing failed - empty result');
    }
    
    // Log preprocessed resume text for verification
    console.log('\n' + '='.repeat(80));
    console.log('📝 [RESUME TEXT - PREPROCESSED]');
    console.log('='.repeat(80));
    console.log(preprocessedResume);
    console.log('='.repeat(80));
    console.log(`📊 Resume length: ${preprocessedResume.length} characters`);
    
    // Extract and log technical keywords from resume
    const resumeTechKeywords = extractTechnicalKeywords(preprocessedResume);
    console.log('\n🔧 [RESUME TECHNICAL KEYWORDS]');
    console.log(`Found ${resumeTechKeywords.length} technical keywords:`);
    console.log(resumeTechKeywords.join(', '));
    console.log('='.repeat(80) + '\n');

    // Step 3: PHASE 1 - Experience Filtering ONLY (before embeddings)
    console.log('🔍 [Phase 1] Filtering by experience (0 to candidate+1 years)...');
    console.log(`   📊 Showing jobs: 0-${resumeYears + 1} years (candidate has ${resumeYears} years)`);
    
    const phase1Jobs = jobs.map((job, index) => {
      const jobExp = extractJobExperience(job);
      const preprocessedJob = preprocessJobDescription(job);
      const expMatch = isExperienceMatch(resumeYears, jobExp);
      
      // Log first 3 jobs' preprocessed text for verification
      if (index < 3) {
        console.log('\n' + '='.repeat(80));
        console.log(`📋 [JOB #${index + 1} - PREPROCESSED TEXT]`);
        console.log(`Title: ${job.job_title}`);
        console.log(`Company: ${job.employer_name}`);
        console.log(`Experience Required: ${jobExp.minYears}-${jobExp.maxYears} years`);
        console.log(`Experience Match: ${expMatch ? '✅ YES' : '❌ NO'}`);
        console.log('='.repeat(80));
        console.log(preprocessedJob);
        console.log('='.repeat(80));
        console.log(`📊 Job text length: ${preprocessedJob.length} characters`);
        
        // Extract and log technical keywords from job
        const jobTechKeywords = extractTechnicalKeywords(preprocessedJob);
        console.log(`\n🔧 [JOB #${index + 1} TECHNICAL KEYWORDS]`);
        console.log(`Found ${jobTechKeywords.length} technical keywords:`);
        console.log(jobTechKeywords.join(', '));
        
        // Find and log common keywords
        const commonKeywords = findCommonKeywords(resumeTechKeywords, jobTechKeywords);
        console.log(`\n✅ [COMMON KEYWORDS - JOB #${index + 1}]`);
        console.log(`${commonKeywords.length} keywords in common:`);
        console.log(commonKeywords.join(', ') || 'None');
        
        // Find missing keywords
        const missingKeywords = jobTechKeywords.filter(k => !commonKeywords.includes(k));
        console.log(`\n❌ [MISSING KEYWORDS - JOB #${index + 1}]`);
        console.log(`${missingKeywords.length} keywords missing from resume:`);
        console.log(missingKeywords.join(', ') || 'None');
        console.log('='.repeat(80) + '\n');
      }
      
      return {
        job,
        preprocessedText: preprocessedJob,
        expMatch,
        jobExp,
        passedPhase1: expMatch  // Only experience filter
      };
    });
    
    // Debug: Show experience distribution
    const expDistribution = {};
    phase1Jobs.forEach(item => {
      const key = `${item.jobExp.minYears}-${item.jobExp.maxYears}y`;
      expDistribution[key] = (expDistribution[key] || 0) + 1;
    });
    console.log('   📊 Experience distribution:', expDistribution);
    
    const phase1Passed = phase1Jobs.filter(item => item.passedPhase1);
    const phase1Failed = phase1Jobs.filter(item => !item.passedPhase1);
    
    console.log(`   ✅ Passed Phase 1: ${phase1Passed.length} jobs`);
    console.log(`   ❌ Failed Phase 1: ${phase1Failed.length} jobs (experience mismatch)`);

    if (phase1Passed.length === 0) {
      console.log('⚠️ [Embedding Matcher] No jobs passed Phase 1 filters');
      return [];
    }

    // Step 4: PHASE 2 - Generate embeddings only for passed jobs
    console.log('🧠 [Phase 2] Generating embeddings for filtered jobs...');
    const resumeEmbedding = await generateEmbedding(preprocessedResume);

    if (!resumeEmbedding || resumeEmbedding.length === 0) {
      throw new Error('Resume embedding generation failed');
    }

    console.log(`   ✓ Resume embedding generated (dimension: ${resumeEmbedding.length})`);

    // Generate embeddings in batches
    const jobsForEmbedding = phase1Passed.map(item => item.job);
    const jobsWithEmbeddings = await processJobsInBatches(jobsForEmbedding, batchSize);

    // Step 5: PHASE 2 - Content scoring with embeddings (100% semantic)
    console.log('🎯 [Phase 2] Scoring job content with embeddings (100% semantic)...');
    
    const scoredJobs = jobsWithEmbeddings
      .filter(item => item.embedding !== null)
      .map((item) => {
        const phase1Data = phase1Passed.find(p => p.job.job_id === item.job.job_id);
        
        // Compute cosine similarity
        let rawSimilarity = cosineSimilarityNormalized(resumeEmbedding, item.embedding);
        rawSimilarity = Math.max(0, Math.min(1, rawSimilarity));

        // HUMAN-ALIGNED RESCALING:
        // Maps raw embedding scores to human perception of match quality
        // Raw 70% → Rescaled 100% (human: "excellent match, definitely apply!")
        // Raw 62% → Rescaled 80% (human: "good match, should apply")
        // Raw 50% → Rescaled 50% (human: "fair match, worth considering")
        // Raw 40% → Rescaled 25% (human: "weak match")
        // Range: [0.3-0.7] → [0-1] for human-aligned perception
        const rescaledSimilarity = Math.max(0, Math.min(1, (rawSimilarity - 0.2) / 0.4));
        
        // Final score = 100% semantic similarity (no experience bonus)
        const finalScore = rescaledSimilarity;
        const finalScorePercent = Math.round(finalScore * 100);

        // Calculate required years for display purposes only
        const requiredYears = phase1Data.jobExp.minYears > 0 
          ? Math.round((phase1Data.jobExp.minYears + phase1Data.jobExp.maxYears) / 2)
          : phase1Data.jobExp.maxYears;

        return {
          ...item.job,
          embedding_match_score: finalScorePercent,
          content_similarity_percent: Math.round(rescaledSimilarity * 100),
          raw_similarity_percent: Math.round(rawSimilarity * 100),
          experience_match: {
            candidate_years: resumeYears,
            candidate_level: resumeLevel,
            required_min: phase1Data.jobExp.minYears,
            required_max: phase1Data.jobExp.maxYears,
            required_avg: requiredYears,
            required_level: phase1Data.jobExp.level,
            is_match: phase1Data.expMatch
          },
          _debug: {
            raw_similarity: rawSimilarity,
            rescaled_similarity: rescaledSimilarity,
            formula: '100% semantic similarity',
            rescaling_note: 'Human-aligned: [0.3-0.7] → [0-100%] matches human perception'
          }
        };
      })
      // STABLE SORT: Primary by score (descending), secondary by job_id (ascending)
      // This ensures consistent ordering even when scores are identical
      .sort((a, b) => {
        if (b.embedding_match_score !== a.embedding_match_score) {
          return b.embedding_match_score - a.embedding_match_score;
        }
        // Secondary sort by job_id for stability
        return a.job_id.localeCompare(b.job_id);
      });

    console.log(`✂️ [Embedding Matcher] Scored ${scoredJobs.length} jobs`);

    // Debug: Log ALL scored jobs (not just top 5)
    console.log(`\n🔍 [Debug] All ${scoredJobs.length} matched jobs:`);
    scoredJobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.job_title}`);
      console.log(`     Score: ${job.embedding_match_score}% | Semantic: ${job.content_similarity_percent}% | Raw: ${job.raw_similarity_percent}% | Exp: ${job.experience_match.required_min}-${job.experience_match.required_max}y`);
    });

    // Step 6: Filter by threshold and return top N
    const filteredJobs = scoredJobs
      .filter(job => job.embedding_match_score >= threshold)
      .slice(0, topN);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Embedding Matcher] Matching complete in ${totalTime}s!`);
    console.log(`   📊 Results: ${filteredJobs.length} jobs above ${threshold}% threshold`);
    console.log(`   🏆 Top score: ${filteredJobs[0]?.embedding_match_score || 0}%`);

    return filteredJobs;

  } catch (error) {
    console.error('[Embedding Matcher] Error during matching:', error.message);
    throw error;
  }
};

/**
 * Extract technical skills and keywords from text
 * Focuses on programming languages, frameworks, tools, and technologies
 * @param {string} text - Preprocessed text
 * @returns {Array<string>} - Technical keywords found
 */
const extractTechnicalKeywords = (text) => {
  if (!text) return [];

  // Common technical keywords (programming languages, frameworks, tools, cloud, databases, etc.)
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
};

/**
 * Find common technical keywords between resume and job
 * @param {Array<string>} resumeKeywords - Resume technical keywords
 * @param {Array<string>} jobKeywords - Job technical keywords
 * @returns {Array<string>} - Common keywords
 */
const findCommonKeywords = (resumeKeywords, jobKeywords) => {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  const common = jobKeywords.filter(k => resumeSet.has(k.toLowerCase()));
  return common;
};

/**
 * Analyze missing skills (skills in job but not in resume)
 * @param {string} resumeText - Preprocessed resume text
 * @param {string} jobText - Preprocessed job text
 * @param {number} topN - Number of top missing skills
 * @returns {Array<string>} - Missing skills
 */
const findMissingSkills = (resumeText, jobText, topN = 5) => {
  if (!resumeText || !jobText) return [];

  const resumeWords = new Set(resumeText.split(' ').filter(w => w.length > 2));
  const jobWords = jobText.split(' ').filter(w => w.length > 2);

  // Find words in job but not in resume
  const missing = jobWords.filter(word => !resumeWords.has(word));

  // Count frequency in job description
  const wordFreq = {};
  missing.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Sort by frequency and return top N unique
  const uniqueMissing = [...new Set(missing)];
  const sortedMissing = uniqueMissing
    .sort((a, b) => (wordFreq[b] || 0) - (wordFreq[a] || 0))
    .slice(0, topN);

  return sortedMissing;
};

module.exports = {
  matchJobsWithEmbeddings,
  cosineSimilarity,
  cosineSimilarityNormalized,
  findMissingSkills,
  calculateSkillsMatch,
  getExperienceLevel,
  extractJobExperience,
  isExperienceMatch,
  calculateExperienceScore,
  extractTechnicalKeywords,
  findCommonKeywords
};
