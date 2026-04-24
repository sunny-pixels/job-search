/**
 * Text Preprocessing Service for Embedding-Based Job Matching
 * Cleans and normalizes resume and job description text
 */

// Common English stopwords
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
  'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
  'just', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
  'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'him', 'his',
  'himself', 'she', 'her', 'hers', 'herself', 'them', 'their', 'theirs',
  'themselves', 'am', 'been', 'being', 'do', 'does', 'did', 'doing', 'would',
  'could', 'ought', 'im', 'youre', 'hes', 'shes', 'its', 'were', 'theyre',
  'ive', 'youve', 'weve', 'theyve', 'id', 'youd', 'hed', 'shed', 'wed',
  'theyd', 'ill', 'youll', 'hell', 'shell', 'well', 'theyll', 'isnt', 'arent',
  'wasnt', 'werent', 'hasnt', 'havent', 'hadnt', 'doesnt', 'dont', 'didnt',
  'wont', 'wouldnt', 'shant', 'shouldnt', 'cant', 'cannot', 'couldnt',
  'mustnt', 'lets', 'thats', 'whos', 'whats', 'heres', 'theres', 'whens',
  'wheres', 'whys', 'hows'
]);

/**
 * Clean and preprocess text for embedding generation
 * @param {string} text - Raw text to preprocess
 * @param {object} options - Preprocessing options
 * @returns {string} - Cleaned text
 */
const preprocessText = (text, options = {}) => {
  const {
    removeStopwords = true,
    preserveTechnicalTerms = true,
    maxLength = 15000 // 15k character --> approx 1500 words
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  // Step 1: Normalize whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim();

  // Step 2: Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // Step 3: Remove email addresses
  cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, '');

  // Step 4: Remove phone numbers
  cleaned = cleaned.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '');

  // Step 5: Normalize case to lowercase
  cleaned = cleaned.toLowerCase();
  
  // Step 5.5: Normalize all dash types to regular hyphen
  // Convert en-dash (–), em-dash (—), and other dash variants to regular hyphen (-)
  cleaned = cleaned.replace(/[–—−]/g, '-');

  // Step 6: Remove special characters but preserve technical terms
  if (preserveTechnicalTerms) {
    // Keep alphanumeric, spaces, hyphens, dots, plus, sharp (for C#, C++, .NET, etc.)
    cleaned = cleaned.replace(/[^a-z0-9\s\-\.+#]/g, ' ');
  } else {
    // Remove all special characters
    cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ');
  }

  // Step 7: Remove excessive whitespace again
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Step 8: Remove stopwords if enabled
  if (removeStopwords) {
    const words = cleaned.split(' ');
    const filteredWords = words.filter(word => {
      // Keep words that are:
      // - Not stopwords
      // - Technical terms (contain numbers, dots, or are longer than 2 chars)
      // - Acronyms (all caps in original, but we're lowercase now, so check length)
      return !STOPWORDS.has(word) || word.length > 2 || /\d/.test(word) || /[.+#-]/.test(word);
    });
    cleaned = filteredWords.join(' ');
  }

  // Step 9: Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
};

/**
 * Preprocess resume text
 * @param {string} resumeText - Raw resume text
 * @returns {string} - Cleaned resume text
 */
const preprocessResume = (resumeText) => {
  return preprocessText(resumeText, {
    removeStopwords: true,
    preserveTechnicalTerms: true,
    maxLength: 15000  // Increased from 5000 to capture full resumes
  });
};

/**
 * Preprocess job description text
 * Focuses on extracting relevant sections (skills, requirements, responsibilities)
 * OPTIMIZED: Adjusted repetition weights for better matching
 * @param {object} job - Job object from JSearch API
 * @returns {string} - Cleaned job text
 */
const preprocessJobDescription = (job) => {
  if (!job) return '';

  let jobText = '';

  // 1. Job Title (3x) - Very important for role matching
  if (job.job_title) {
    jobText += `${job.job_title} ${job.job_title} ${job.job_title} `;
  }

  // 2. Required Skills (4x) - MOST IMPORTANT for technical matching
  if (job.job_required_skills && Array.isArray(job.job_required_skills)) {
    const skills = job.job_required_skills.join(' ');
    jobText += `${skills} ${skills} ${skills} ${skills} `;
  }

  // 3. Qualifications (3x) - VERY IMPORTANT - defines must-haves
  if (job.job_highlights?.Qualifications) {
    const quals = job.job_highlights.Qualifications.join(' ');
    jobText += `${quals} ${quals} ${quals} `;
  }

  // 4. Responsibilities (2x) - IMPORTANT - shows what you'll actually do
  if (job.job_highlights?.Responsibilities) {
    const resp = job.job_highlights.Responsibilities.join(' ');
    jobText += `${resp} ${resp} `;
  }

  // 5. Job Description (1x) - Provides context
  if (job.job_description) {
    jobText += job.job_description + ' ';
  }

  // 6. Benefits (0x) - REMOVED - Not important for matching
  // 7. Employer Name (0x) - REMOVED - Not important for matching

  // Preprocess the combined text
  return preprocessText(jobText, {
    removeStopwords: true,
    preserveTechnicalTerms: true,
    maxLength: 15000  // Increased from 3000 to capture full job descriptions
  });
};

/**
 * Extract keywords from text (for matched keywords feature)
 * @param {string} text - Preprocessed text
 * @param {number} topN - Number of top keywords to return
 * @returns {Array<string>} - Top keywords
 */
const extractKeywords = (text, topN = 10) => {
  if (!text) return [];

  // Split into words
  const words = text.split(' ').filter(w => w.length > 2);

  // Count word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Sort by frequency and return top N
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);

  return sortedWords;
};

/**
 * Find common keywords between resume and job description
 * @param {string} resumeText - Preprocessed resume text
 * @param {string} jobText - Preprocessed job text
 * @param {number} topN - Number of top matched keywords
 * @returns {Array<string>} - Matched keywords
 */
const findMatchedKeywords = (resumeText, jobText, topN = 5) => {
  if (!resumeText || !jobText) return [];

  const resumeWords = new Set(resumeText.split(' ').filter(w => w.length > 2));
  const jobWords = jobText.split(' ').filter(w => w.length > 2);

  // Find common words
  const matched = jobWords.filter(word => resumeWords.has(word));

  // Count frequency in job description
  const wordFreq = {};
  matched.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Sort by frequency and return top N unique
  const uniqueMatched = [...new Set(matched)];
  const sortedMatched = uniqueMatched
    .sort((a, b) => (wordFreq[b] || 0) - (wordFreq[a] || 0))
    .slice(0, topN);

  return sortedMatched;
};

module.exports = {
  preprocessText,
  preprocessResume,
  preprocessJobDescription,
  extractKeywords,
  findMatchedKeywords
};
