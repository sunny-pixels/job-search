/**
 * Extract minimum experience required from job title and description
 */
const extractRequiredExperience = (job) => {
  const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();
  
  // Patterns to match experience requirements
  const patterns = [
    /(\d+)\s*\+\s*(?:yoe|years?(?:\s+of)?\s+(?:experience|exp))/i,
    /(\d+)\s*[-–]\s*\d+\s*(?:yoe|years?(?:\s+of)?\s+(?:experience|exp))/i,
    /(?:minimum|at\s+least|requires?)\s+(\d+)\s*\+?\s*years?/i,
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  
  // Check job title for level indicators
  if (job.title.toLowerCase().includes('staff') || job.title.toLowerCase().includes('principal')) return 7;
  if (job.title.toLowerCase().includes('senior') || job.title.toLowerCase().includes('lead')) return 4;
  if (job.title.toLowerCase().includes('mid') || job.title.toLowerCase().includes('ii')) return 2;
  if (job.title.toLowerCase().includes('junior') || job.title.toLowerCase().includes('associate') || job.title.toLowerCase().includes('entry')) return 0;
  if (job.title.toLowerCase().includes('intern')) return 0;
  
  return null; // No requirement found
};

/**
 * Hard filter: Check if job is relevant to candidate's role
 */
const isJobRelevant = (job, resumeAnalysis) => {
  const jobTitle = (job.title || "").toLowerCase();
  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => String(r || "").toLowerCase()).filter(Boolean);
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => String(k || "").toLowerCase()).filter(Boolean);
  const languages = (resumeAnalysis.programming_languages || []).map(l => String(l || "").toLowerCase()).filter(Boolean);
  const frameworks = (resumeAnalysis.frameworks || []).map(f => String(f || "").toLowerCase()).filter(Boolean);
  
  // Define technical keywords that indicate a technical role
  const technicalKeywords = [
    'software', 'developer', 'engineer', 'programmer', 'coding', 'programming', 
    'web', 'mobile', 'frontend', 'backend', 'fullstack', 'full-stack', 'full stack',
    'data', 'ai', 'machine learning', 'ml', 'devops', 'qa', 'testing', 'architect', 
    'technical', 'tech', 'sre', 'cloud', 'infrastructure', 'security', 'cyber',
    'java', 'python', 'javascript', 'react', 'node', 'angular', 'vue', '.net',
    'ios', 'android', 'embedded', 'firmware', 'hardware', 'robotics', 'automation'
  ];
  
  // Define non-technical keywords that indicate a non-technical role
  const nonTechnicalKeywords = [
    'marketing', 'sales', 'hr', 'human resources', 'finance', 'accounting', 
    'legal', 'law', 'clerk', 'administrative', 'admin', 'customer service', 
    'support', 'business development', 'operations', 'logistics', 'procurement',
    'content writer', 'copywriter', 'graphic design', 'ui designer', 'ux designer',
    'social media', 'seo', 'sem', 'digital marketing', 'brand', 'communications',
    'recruiter', 'talent', 'payroll', 'compliance', 'audit', 'paralegal',
    'manufacturing', 'production', 'supply chain', 'warehouse', 'inventory',
    'e-commerce', 'ecommerce', 'retail', 'merchandising', 'buyer', 'purchasing',
    'media', 'journalism', 'editorial', 'publishing', 'advertising', 'ads',
    'event', 'hospitality', 'tourism', 'travel', 'real estate', 'property',
    'healthcare', 'medical', 'nursing', 'clinical', 'pharmaceutical', 'biotech',
    'education', 'teaching', 'training', 'instructor', 'tutor', 'academic'
  ];
  
  // Check if candidate has technical background
  const candidateIsTechnical = 
    primaryRoles.some(role => technicalKeywords.some(tech => role.includes(tech))) ||
    jobKeywords.some(keyword => technicalKeywords.some(tech => keyword.includes(tech))) ||
    languages.length > 0 || 
    frameworks.length > 0;
  
  // If candidate is NOT technical, allow all jobs
  if (!candidateIsTechnical) {
    return true;
  }
  
  // Candidate IS technical - now we need stricter filtering
  
  // Check if job has ANY technical keywords
  const jobHasTechnicalKeywords = technicalKeywords.some(tech => jobTitle.includes(tech));
  
  // Check if job has non-technical keywords
  const jobHasNonTechnicalKeywords = nonTechnicalKeywords.some(nonTech => jobTitle.includes(nonTech));
  
  // RULE 1: If job has technical keywords, it's relevant (even if it also has non-technical words)
  // Example: "Software Engineer - Marketing Team" is still technical
  if (jobHasTechnicalKeywords) {
    return true;
  }
  
  // RULE 2: If job has NO technical keywords but HAS non-technical keywords, filter it out
  // Example: "Marketing Intern", "HR Intern", "Legal Intern" - all filtered
  if (!jobHasTechnicalKeywords && jobHasNonTechnicalKeywords) {
    console.log(`  🚫 Filtered: "${job.title}" (non-technical role for technical candidate)`);
    return false;
  }
  
  // RULE 3: If job has neither technical nor non-technical keywords, allow it
  // This catches generic roles that might be relevant
  return true;
};

/**
 * Hard filter: Check if candidate meets minimum experience requirement
 */
const meetsExperienceRequirement = (job, candidateYears) => {
  const requiredYears = extractRequiredExperience(job);
  
  // If no requirement found, candidate qualifies
  if (requiredYears === null) return true;
  
  // Candidate must meet or exceed requirement
  return candidateYears >= requiredYears;
};

const calculateJobMatchScore = (job, resumeAnalysis) => {
  let score = 0;
  const jobTitle = (job.title || "").toLowerCase();
  const jobDepartment = (job.department || "").toLowerCase();
  const jobLocation = (job.location || "").toLowerCase();
  
  // Normalize and prepare resume data with safety checks
  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => String(r || "").toLowerCase()).filter(Boolean);
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => String(k || "").toLowerCase()).filter(Boolean);
  const skills = (resumeAnalysis.skills || []).map(s => String(s || "").toLowerCase()).filter(Boolean);
  const languages = (resumeAnalysis.programming_languages || []).map(l => String(l || "").toLowerCase()).filter(Boolean);
  const frameworks = (resumeAnalysis.frameworks || []).map(f => String(f || "").toLowerCase()).filter(Boolean);
  const tools = (resumeAnalysis.tools || []).map(t => String(t || "").toLowerCase()).filter(Boolean);
  
  // 1. EXACT ROLE MATCH (40 points) - Highest priority
  let roleScore = 0;
  for (const role of [...primaryRoles, ...jobKeywords]) {
    const roleWords = role.split(/[\s\-]/);
    let matchedWords = 0;
    
    for (const word of roleWords) {
      if (word.length > 3 && jobTitle.includes(word)) {
        matchedWords++;
      }
    }
    
    const matchRatio = matchedWords / roleWords.length;
    if (matchRatio >= 0.8) {
      roleScore = 40;
      break;
    } else if (matchRatio >= 0.5) {
      roleScore = Math.max(roleScore, 30);
    } else if (matchRatio > 0) {
      roleScore = Math.max(roleScore, 15);
    }
  }
  score += roleScore;
  
  // 2. TECH STACK MATCH (30 points) - Skills, Languages, Frameworks
  const allTech = [...skills, ...languages, ...frameworks, ...tools];
  let techMatches = 0;
  let techMatchQuality = 0;
  
  for (const tech of allTech) {
    const techWords = tech.split(/[\s\-\.]/);
    
    for (const word of techWords) {
      if (word.length > 2) {
        if (jobTitle.includes(word)) {
          techMatches++;
          techMatchQuality += 2; // Title match is more valuable
          break;
        } else if (jobDepartment.includes(word)) {
          techMatches++;
          techMatchQuality += 1;
          break;
        }
      }
    }
  }
  
  if (allTech.length > 0) {
    const techScore = Math.min(30, (techMatchQuality / allTech.length) * 30);
    score += techScore;
  } else {
    score += 15; // No tech specified, give partial credit
  }
  
  // 3. EXPERIENCE LEVEL MATCH (20 points)
  const experienceLevel = (resumeAnalysis.experience_level || "mid-level").toLowerCase();
  const experienceYears = resumeAnalysis.experience_years || 0;
  
  let expScore = 0;
  
  if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal') || jobTitle.includes('staff')) {
    if (experienceLevel === 'senior' || experienceYears >= 5) {
      expScore = 20;
    } else if (experienceYears >= 3) {
      expScore = 14;
    } else if (experienceYears >= 2) {
      expScore = 8;
    } else {
      expScore = 4;
    }
  } else if (jobTitle.includes('junior') || jobTitle.includes('associate') || jobTitle.includes('entry')) {
    if (experienceLevel === 'junior' || experienceYears <= 2) {
      expScore = 20;
    } else if (experienceYears <= 4) {
      expScore = 16;
    } else {
      expScore = 12;
    }
  } else if (jobTitle.includes('intern')) {
    if (experienceLevel === 'intern' || experienceYears === 0) {
      expScore = 20;
    } else {
      expScore = 8;
    }
  } else {
    // No level specified - match based on years
    if (experienceYears >= 3) {
      expScore = 18;
    } else if (experienceYears >= 1) {
      expScore = 16;
    } else {
      expScore = 14;
    }
  }
  score += expScore;
  
  // 4. EDUCATION MATCH (10 points)
  if (resumeAnalysis.education && Array.isArray(resumeAnalysis.education) && resumeAnalysis.education.length > 0) {
    const hasRelevantEducation = resumeAnalysis.education.some(edu => {
      if (typeof edu !== 'string') return false;
      const eduLower = edu.toLowerCase();
      return eduLower.includes('bachelor') || 
             eduLower.includes('master') || 
             eduLower.includes('phd') ||
             eduLower.includes('computer') ||
             eduLower.includes('engineering') ||
             eduLower.includes('science') ||
             eduLower.includes('technology');
    });
    
    score += hasRelevantEducation ? 10 : 5;
  } else {
    score += 5;
  }
  
  return Math.min(100, Math.round(score));
};

const scoreAndSortJobs = (jobs, resumeAnalysis) => {
  console.log(`⚡ Filtering and scoring ${jobs.length} jobs...`);
  
  const experienceYears = resumeAnalysis.experience_years || 0;
  
  // HARD FILTER 1: Remove irrelevant jobs (technical vs non-technical mismatch)
  const relevantJobs = jobs.filter(job => isJobRelevant(job, resumeAnalysis));
  console.log(`✅ Relevant: ${relevantJobs.length}/${jobs.length} jobs (filtered out ${jobs.length - relevantJobs.length} irrelevant)`);
  
  // HARD FILTER 2: Remove jobs candidate doesn't qualify for by experience
  const qualifyingJobs = relevantJobs.filter(job => {
    const qualifies = meetsExperienceRequirement(job, experienceYears);
    if (!qualifies) {
      const required = extractRequiredExperience(job);
      console.log(`  ⏭️  Skipped: "${job.title}" (requires ${required}y, you have ${experienceYears}y)`);
    }
    return qualifies;
  });
  
  console.log(`✅ Qualified: ${qualifyingJobs.length}/${relevantJobs.length} jobs (after experience filter)`);
  
  // Score all qualifying jobs with fast rule-based algorithm
  const scoredJobs = qualifyingJobs.map(job => ({
    ...job,
    match_score: calculateJobMatchScore(job, resumeAnalysis)
  }));
  
  // Sort by score (highest first)
  scoredJobs.sort((a, b) => b.match_score - a.match_score);
  
  console.log(`✅ Scoring complete. Top score: ${scoredJobs[0]?.match_score}% | Total results: ${scoredJobs.length}`);
  
  return scoredJobs;
};

module.exports = {
  scoreAndSortJobs
};
