const axios = require('axios');
const config = require('../config/config');

/**
 * JSearch API Service - Fetch jobs from RapidAPI JSearch
 */

const JSEARCH_API_URL = 'https://jsearch.p.rapidapi.com/search';
const JSEARCH_DETAILS_API_URL = 'https://jsearch.p.rapidapi.com/job-details';

/**
 * Search jobs using JSearch API
 * @param {string} query - Job search query (e.g., "software engineer in New York")
 * @param {object} options - Additional search options
 * @returns {Promise<Array>} - Array of job objects
 */
const searchJobs = async (query, options = {}) => {
  try {
    const params = {
      query: query,
      page: options.page || 1,
      num_pages: options.num_pages || 1,
      country: options.country || 'us',
      language: options.language || 'en',
      date_posted: options.date_posted || 'week',
      ...options
    };

    console.log(`🔍 [JSearch] Searching: "${query}"`);
    console.log(`📋 [JSearch] Params:`, params);

    const response = await axios.get(JSEARCH_API_URL, {
      params,
      headers: {
        'X-RapidAPI-Key': config.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      timeout: 60000 // 60 second timeout for large page requests
    });

    if (response.data.status === 'OK' && response.data.data) {
      const jobs = response.data.data;
      console.log(`✅ [JSearch] Found ${jobs.length} jobs`);
      return jobs;
    }

    console.log(`⚠️ [JSearch] No jobs found`);
    return [];

  } catch (error) {
    console.error(`❌ [JSearch] Error:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return [];
  }
};

/**
 * Fetch detailed job information using job-details API
 * @param {string} jobId - Job ID
 * @returns {Promise<object|null>} - Detailed job object or null if error
 */
const fetchJobDetails = async (jobId) => {
  try {
    const response = await axios.get(JSEARCH_DETAILS_API_URL, {
      params: {
        job_id: jobId,
        country: 'us'
      },
      headers: {
        'X-RapidAPI-Key': config.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      timeout: 10000
    });

    if (response.data.status === 'OK' && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }

    return null;

  } catch (error) {
    console.error(`   ⚠️ Error fetching details for job ${jobId}:`, error.message);
    return null;
  }
};

/**
 * Enrich jobs with detailed information from job-details API
 * Fetches Qualifications, Responsibilities, and Benefits arrays
 * @param {Array<object>} jobs - Array of job objects from search API
 * @param {object} options - Enrichment options
 * @returns {Promise<Array<object>>} - Enriched jobs with detailed highlights
 */
const enrichJobsWithDetails = async (jobs, options = {}) => {
  const {
    batchSize = 10,
    delayMs = 200
  } = options;

  console.log(`🔍 [JSearch] Enriching ${jobs.length} jobs with detailed information...`);
  const startTime = Date.now();
  
  const enrichedJobs = [];
  let successCount = 0;
  let failCount = 0;
  let alreadyDetailedCount = 0;

  // Process jobs in batches to avoid rate limiting
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(jobs.length / batchSize);

    console.log(`   📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);

    // Fetch details for each job in batch
    const detailsPromises = batch.map(async (job) => {
      // Check if job already has detailed highlights
      const hasQualifications = job.job_highlights?.Qualifications?.length > 0;
      const hasResponsibilities = job.job_highlights?.Responsibilities?.length > 0;
      
      if (hasQualifications && hasResponsibilities) {
        alreadyDetailedCount++;
        return job; // Already has details, no need to fetch
      }

      // Fetch detailed information
      const detailedJob = await fetchJobDetails(job.job_id);
      
      if (detailedJob && detailedJob.job_highlights) {
        // Merge detailed highlights into original job
        const enrichedJob = {
          ...job,
          job_highlights: detailedJob.job_highlights
        };
        successCount++;
        return enrichedJob;
      } else {
        // Keep original job if details fetch failed
        failCount++;
        return job;
      }
    });

    const batchResults = await Promise.all(detailsPromises);
    enrichedJobs.push(...batchResults);

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [JSearch] Enrichment complete in ${totalTime}s`);
  console.log(`   ✅ Successfully enriched: ${successCount} jobs`);
  console.log(`   ℹ️  Already detailed: ${alreadyDetailedCount} jobs`);
  console.log(`   ⚠️  Failed to enrich: ${failCount} jobs`);

  return enrichedJobs;
};

/**
 * Search jobs for multiple queries and combine results
 * @param {Array<string>} queries - Array of search queries
 * @param {object} options - Search options (can include job_requirements)
 * @returns {Promise<Array>} - Combined array of unique jobs
 */
const searchMultipleQueries = async (queries, options = {}) => {
  console.log(`🚀 [JSearch] Searching ${queries.length} queries with ${options.num_pages || 1} pages each...`);
  if (options.job_requirements) {
    console.log(`   📋 With requirements filter: ${options.job_requirements}`);
  }
  
  const allJobs = [];
  const seenJobIds = new Set();
  let totalFetched = 0;
  let duplicatesRemoved = 0;

  for (const query of queries) {
    const jobs = await searchJobs(query, options);
    totalFetched += jobs.length;
    
    // Deduplicate by job_id
    for (const job of jobs) {
      if (!seenJobIds.has(job.job_id)) {
        seenJobIds.add(job.job_id);
        allJobs.push(job);
      } else {
        duplicatesRemoved++;
      }
    }
  }

  console.log(`✅ [JSearch] Total fetched: ${totalFetched} jobs`);
  console.log(`   🔄 Duplicates removed: ${duplicatesRemoved}`);
  console.log(`   ✨ Unique jobs: ${allJobs.length}`);
  return allJobs;
};

/**
 * Normalize search term to avoid duplicates
 * @param {string} term - Search term
 * @returns {string} - Normalized term
 */
const normalizeSearchTerm = (term) => {
  return term
    .toLowerCase()
    .replace(/[-_]/g, ' ')  // "full-stack" → "full stack"
    .replace(/\s+/g, ' ')   // Multiple spaces → single space
    .trim();
};

/**
 * Build search queries from resume analysis
 * @param {object} resumeAnalysis - Parsed resume data
 * @returns {object} - { queries: Array<string>, requirements: string }
 */
const buildSearchQueries = (resumeAnalysis) => {
  const queries = [];
  
  // Use primary roles and job keywords
  const roles = resumeAnalysis.primary_roles || [];
  const keywords = resumeAnalysis.job_keywords || [];
  
  // Get candidate experience
  const experienceYears = resumeAnalysis.experience_years || 0;
  
  // Determine job_requirements parameter based on experience
  let jobRequirements = '';
  if (experienceYears === 0) {
    // 0 years: No experience + under 3 years (cast wider net for entry-level)
    jobRequirements = 'no_experience,under_3_years_experience';
    console.log(`   🎯 Job requirements: no_experience,under_3_years_experience (${experienceYears} years)`);
  } else if (experienceYears === 1) {
    // 1 year: Under 3 years experience
    jobRequirements = 'under_3_years_experience';
    console.log(`   🎯 Job requirements: under_3_years_experience (${experienceYears} year)`);
  } else if (experienceYears === 2) {
    // 2 years: Under 3 years experience (junior level)
    jobRequirements = 'under_3_years_experience';
    console.log(`   🎯 Job requirements: under_3_years_experience (${experienceYears} years)`);
  } else if (experienceYears >= 3) {
    // 3+ years: More than 3 years experience (mid to senior)
    jobRequirements = 'more_than_3_years_experience';
    console.log(`   🎯 Job requirements: more_than_3_years_experience (${experienceYears} years)`);
  }
  
  // Combine roles and keywords
  let searchTerms = [...roles, ...keywords];
  
  // Filter out intern positions if experience > 0
  if (experienceYears > 0) {
    searchTerms = searchTerms.filter(term => {
      const termLower = term.toLowerCase();
      return !termLower.includes('intern') && !termLower.includes('internship');
    });
    console.log(`   ⚠️ Filtered out intern positions (candidate has ${experienceYears} years experience)`);
  } else {
    console.log(`   ℹ️ Including intern positions (candidate has 0 years experience)`);
  }
  
  // Normalize and deduplicate
  const normalizedMap = new Map();
  for (const term of searchTerms) {
    const normalized = normalizeSearchTerm(term);
    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, term); // Keep original casing for display
    }
  }
  
  // Get unique terms (use original casing)
  const uniqueTerms = Array.from(normalizedMap.values());
  
  // Limit to top 3 search terms to avoid too many API calls
  const topTerms = uniqueTerms.slice(0, 3);
  
  console.log(`🔍 [JSearch] Built ${topTerms.length} unique search queries:`, topTerms);
  
  return {
    queries: topTerms,
    requirements: jobRequirements
  };
};

module.exports = {
  searchJobs,
  searchMultipleQueries,
  buildSearchQueries,
  normalizeSearchTerm,
  fetchJobDetails,
  enrichJobsWithDetails
};
