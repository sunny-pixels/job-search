/**
 * Production-Ready Job Scoring Service
 * Fast rule-based scoring optimized for scale
 * No AI calls - instant results
 */

const calculateJobMatchScore = (job, resumeAnalysis) => {
  let score = 0;
  const jobTitle = job.title.toLowerCase();
  const jobDepartment = job.department.toLowerCase();
  const jobLocation = job.location.toLowerCase();
  
  // Normalize and prepare resume data
  const primaryRoles = (resumeAnalysis.primary_roles || []).map(r => String(r).toLowerCase());
  const jobKeywords = (resumeAnalysis.job_keywords || []).map(k => String(k).toLowerCase());
  const skills = (resumeAnalysis.skills || []).map(s => String(s).toLowerCase());
  const languages = (resumeAnalysis.programming_languages || []).map(l => String(l).toLowerCase());
  const frameworks = (resumeAnalysis.frameworks || []).map(f => String(f).toLowerCase());
  const tools = (resumeAnalysis.tools || []).map(t => String(t).toLowerCase());
  
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
  const experienceLevel = resumeAnalysis.experience_level.toLowerCase();
  const experienceYears = resumeAnalysis.experience_years;
  
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
  console.log(`⚡ Fast scoring ${jobs.length} jobs...`);
  
  // Score all jobs with fast rule-based algorithm
  const scoredJobs = jobs.map(job => ({
    ...job,
    match_score: calculateJobMatchScore(job, resumeAnalysis)
  }));
  
  // Sort by score (highest first)
  scoredJobs.sort((a, b) => b.match_score - a.match_score);
  
  console.log(`✅ Scoring complete in < 1s. Top score: ${scoredJobs[0]?.match_score}%`);
  
  return scoredJobs;
};

module.exports = {
  scoreAndSortJobs
};
