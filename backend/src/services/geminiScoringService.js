/**
 * Gemini Scoring Service
 * Scores jobs against resume using Google's Gemini LLM
 * 
 * Features:
 * - Score multiple jobs sequentially
 * - Detailed scoring breakdown (skills, experience, education, domain, soft signals)
 * - Role alignment classification (EXACT, STRONG_TRANSFERABLE, PARTIAL, MISMATCH)
 * - Key strengths & gaps analysis
 * - Recommendation classification
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

/**
 * Extract job description text from job object
 * @param {object} job - Job object from JSearch
 * @returns {string} - Job description text
 */
const extractJobDescriptionText = (job) => {
  const parts = [];

  if (job.job_title) parts.push(`Job Title: ${job.job_title}`);
  if (job.employer_name) parts.push(`Company: ${job.employer_name}`);
  if (job.job_location) parts.push(`Location: ${job.job_location}`);
  if (job.job_employment_type) parts.push(`Employment Type: ${job.job_employment_type}`);
  if (job.job_required_experience) parts.push(`Experience Required: ${job.job_required_experience}`);

  // Job description (usually the longest section)
  if (job.job_description) {
    parts.push(`\nDescription:\n${job.job_description}`);
  }

  // Job highlights
  if (job.job_highlights && Array.isArray(job.job_highlights)) {
    parts.push(`\nKey Highlights:\n${job.job_highlights.join('\n')}`);
  }

  // Job requirements (if separate)
  if (job.job_required_skills && Array.isArray(job.job_required_skills)) {
    parts.push(`\nRequired Skills:\n${job.job_required_skills.join('\n')}`);
  }

  return parts.join('\n');
};

/**
 * Build the scoring prompt for Gemini
 * @param {string} resumeText - Resume content
 * @param {string} jdText - Job description content
 * @returns {string} - Prompt for Gemini
 */
const buildScoringPrompt = (resumeText, jdText) => {
  return `You are a strict, accurate resume evaluator combining the precision of an ATS system with the judgment of a senior technical recruiter. Your scores must reflect ground truth — they should align with what a real hiring manager and a rigorous ATS platform would both agree on.

SCORING PHILOSOPHY:
- Be realistic and honest, not encouraging
- Missing critical role-specific skills = significant penalty, no exceptions
- Transferability credit applies ONLY when the skill gap is genuinely bridgeable on the job
- A developer with zero QA experience is NOT a match for a QA Automation role
- A marketer with zero finance experience is NOT a match for a CFO role
- Do NOT inflate scores to make candidates feel better
- Your score should predict interview likelihood, not potential

---

**RESUME:**
${resumeText}

**JOB DESCRIPTION:**
${jdText}

---

========================
EVALUATION FRAMEWORK
========================

Run all 5 steps internally before producing output.

---

STEP 1 — ROLE IDENTITY & ALIGNMENT CHECK

First, identify:
1. The PRIMARY role family of the JD (e.g., QA Engineer, Software Developer, Data Scientist, Product Manager)
2. The PRIMARY role family of the candidate (based on their actual experience, not aspirations)

Then apply this strict classification:

- EXACT
  Candidate's current role family directly matches the JD role family.
  Same function, same core responsibilities, same primary tools/skills.
  Example: QA Automation Engineer applying for QA Automation Engineer.

- STRONG_TRANSFERABLE
  Different role family BUT candidate has documented, hands-on experience with
  at least 60% of the JD's core technical requirements.
  Example: SDET applying for QA Automation Engineer.

- PARTIAL
  Adjacent role family with real but limited overlap.
  Candidate has 30–60% alignment with core JD requirements.
  Example: Manual QA applying for QA Automation Engineer.

- MISMATCH
  Fundamentally different role family. Candidate lacks the primary skills
  the role is built around. Overlap is superficial or incidental.
  Example: Full-Stack Developer with no testing experience applying for QA Automation Engineer.

SCORING CAPS (strictly enforced):
- EXACT → full range 0–100
- STRONG_TRANSFERABLE → max 85
- PARTIAL → max 65
- MISMATCH → max 45

HARD RULE: If the JD names specific mandatory technologies (e.g., C#, SpecFlow, Selenium)
and the resume has ZERO evidence of them or close equivalents, the role alignment
CANNOT be classified higher than PARTIAL. If the candidate's entire background is
a different role family, it MUST be MISMATCH.

---

STEP 2 — WEIGHTED SCORING

Before scoring each category, list the JD's explicit requirements for that category,
then match them against what the resume actually shows. Score based on evidence only.

---

Category 1 — Core Skills & Technical Competency (Weight: 35%)

Extract every explicit skill, tool, technology, and responsibility from the JD.
For each one, mark it as: PRESENT / PARTIAL / ABSENT in the resume.

Scoring:
- 90–100: 80%+ of core requirements present, including must-have tools
- 70–89: 60–79% present, missing items are learnable or secondary
- 50–69: 40–59% present, key technical gaps exist
- 30–49: 20–39% present, fundamental skills missing
- 0–29: Less than 20% present, role mismatch at skill level

STRICT RULE: If the JD requires a specific language or framework (e.g., C#, SpecFlow,
Python, Terraform) and the resume shows NONE of it or close equivalents,
Category 1 score must not exceed 35.

Transferability examples (acceptable):
- Selenium → Playwright/Cypress → transferable test automation
- NUnit/xUnit → JUnit/PyTest → transferable test framework experience
- AWS → Azure/GCP → transferable cloud
- React → Vue/Angular → transferable frontend

NOT transferable:
- Building web apps → writing QA test suites (different discipline)
- Frontend JavaScript → C# automation (different language AND domain)
- Solving LeetCode problems → QA automation engineering

---

Category 2 — Domain & Industry Relevance (Weight: 15%)

Score:
- 85–100: Same industry, same sub-domain
- 70–84: Different industry, highly transferable technical environment
- 50–69: Adjacent domain, some relevant context
- 30–49: Limited domain overlap
- 0–29: Unrelated domain

---

Category 3 — Functional Experience & Seniority (Weight: 25%)

Evaluate based on ACTUAL experience in the target role function, not general work experience.

Score:
- 85–100: Years of experience in same function, owns projects end-to-end
- 65–84: Meaningful adjacent experience, some direct overlap
- 40–64: Indirect experience only, significant functional gaps
- 20–39: Very limited relevant experience, mostly entry-level or unrelated
- 0–19: No experience in target function

STRICT RULE: General software development experience does NOT count as QA experience.
Project management experience does NOT count as data science experience.
Functional relevance to the specific role must be demonstrated explicitly.

---

Category 4 — Education & Eligibility (Weight: 10%)

Score:
- 85–100: Exact degree/certification match or stronger
- 70–84: Related field
- 55–69: Different field, compensated by strong relevant experience
- 30–54: Below stated requirements with limited compensation
- 0–29: Clearly ineligible

---

Category 5 — Soft Signals & Professional Fit (Weight: 15%)

Evaluate objectively:
- Resume clarity and quality
- Career trajectory and progression
- Evidence of ownership, initiative, and impact
- Stability and professionalism
- Collaboration and communication signals

Score:
- 85–100: Exceptional signals across all dimensions
- 70–84: Strong signals, minor gaps
- 50–69: Mixed signals, some concerns
- 30–49: Weak signals or red flags
- 0–29: Poor professional presentation

---

STEP 3 — CALCULATE FINAL SCORE

Weighted score =
(Cat1 × 0.35) +
(Cat2 × 0.15) +
(Cat3 × 0.25) +
(Cat4 × 0.10) +
(Cat5 × 0.15)

Apply role alignment cap strictly.
Round to nearest integer.

---

STEP 4 — CALIBRATION CHECK

85–100 → STRONG_MATCH
Candidate is highly interview-viable. Strong direct alignment. Hire confidently.

70–84 → GOOD_MATCH
Solid candidate with minor trainable gaps. Worth interviewing.

50–69 → MODERATE_MATCH
Partial alignment. Noticeable gaps in core requirements. Interview only if pipeline is thin.

35–49 → WEAK_MATCH
Significant missing requirements. Not recommended without major upskilling.

0–34 → POOR_MATCH
Fundamental role mismatch. Would not pass ATS screening.

CALIBRATION RULES:
- A score of 70+ means a real recruiter would send this resume to a hiring manager. Be sure that's true.
- A score of 50–69 means the recruiter is uncertain. That should reflect real uncertainty.
- A score below 50 means the recruiter would likely pass. Be honest when that is the case.
- Do NOT assign 70+ when core role-defining skills are absent.
- Do NOT assign 85+ unless the candidate is genuinely interview-ready for this specific role.

---

STEP 5 — FINAL RECRUITER JUDGMENT

Ask yourself:
1. Would an ATS with keyword matching pass this resume? (be honest)
2. Would a technical hiring manager see this resume as relevant?
3. Are the missing skills trainable within 1–2 weeks, or do they represent months of learning?
4. Is the role identity gap fundamental or superficial?

If the answer to 1 and 2 is NO — the score should be below 50, regardless of the candidate's general talent.

---

OUTPUT — return ONLY this JSON block with no extra text, no markdown fences:

{
  "overall_match_score": <integer 0-100>,
  "skills_match_score": <integer 0-100>,
  "experience_match_score": <integer 0-100>,
  "education_match_score": <integer 0-100>,
  "domain_match_score": <integer 0-100>,
  "soft_signals_score": <integer 0-100>,
  "role_identity_match": "<EXACT|STRONG_TRANSFERABLE|PARTIAL|MISMATCH>",
  "key_strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "key_gaps": [
    "<gap 1>",
    "<gap 2>",
    "<gap 3>"
  ],
  "recommendation": "<STRONG_MATCH|GOOD_MATCH|MODERATE_MATCH|WEAK_MATCH|POOR_MATCH>",
  "detailed_analysis": "<concise honest recruiter-style evaluation in 100-130 words>"
}`;
};

/**
 * Score a single job against resume using Gemini
 * @param {string} resumeText - Resume content
 * @param {object} job - Job object
 * @returns {Promise<object>} - Gemini scoring result
 */
const scoreJobWithGemini = async (resumeText, job) => {
  try {
    console.log(`   📊 Scoring: ${job.job_title} @ ${job.employer_name}`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0 }
    });

    // Extract job description text
    const jdText = extractJobDescriptionText(job);

    // Build prompt
    const prompt = buildScoringPrompt(resumeText, jdText);

    // Call Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in Gemini response');
    }

    const scoring = JSON.parse(jsonMatch[1]);

    console.log(`      ✅ Score: ${scoring.overall_match_score}% (${scoring.recommendation})`);

    return {
      ...scoring,
      job_id: job.job_id,
      job_title: job.job_title,
      employer_name: job.employer_name
    };

  } catch (error) {
    console.error(`      ❌ Error scoring job: ${error.message}`);
    throw error;
  }
};

/**
 * Score multiple jobs sequentially (respects rate limits)
 * @param {string} resumeText - Resume content
 * @param {array} jobs - Array of job objects
 * @returns {Promise<array>} - Array of scored jobs
 */
const scoreJobsWithGemini = async (resumeText, jobs) => {
  console.log(`\n🤖 [Gemini] Starting sequential job scoring...`);
  console.log(`   📝 Resume: ${resumeText.length} characters`);
  console.log(`   💼 Jobs to score: ${jobs.length}`);
  console.log();

  const scoredJobs = [];
  const failedJobs = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const progressPercent = Math.round(((i + 1) / jobs.length) * 100);

    console.log(`\n[${i + 1}/${jobs.length}] (${progressPercent}%)`);

    try {
      const scored = await scoreJobWithGemini(resumeText, job);
      scoredJobs.push(scored);

      // Add small delay between requests to avoid rate limiting
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`   ⚠️ Failed to score job: ${job.job_id}`);
      failedJobs.push({
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        error: error.message
      });
    }
  }

  console.log(`\n✅ [Gemini] Scoring complete!`);
  console.log(`   ✅ Scored: ${scoredJobs.length}/${jobs.length}`);
  if (failedJobs.length > 0) {
    console.log(`   ⚠️ Failed: ${failedJobs.length}`);
  }

  return {
    scored: scoredJobs,
    failed: failedJobs,
    total: jobs.length,
    success_count: scoredJobs.length,
    failure_count: failedJobs.length
  };
};

/**
 * Get color emoji for recommendation
 * @param {string} recommendation - Recommendation string
 * @returns {string} - Emoji
 */
const getRecommendationEmoji = (recommendation) => {
  const emojis = {
    'STRONG_MATCH': '🟢',
    'GOOD_MATCH': '🟡',
    'MODERATE_MATCH': '🟠',
    'WEAK_MATCH': '🔴',
    'POOR_MATCH': '⚫'
  };
  return emojis[recommendation] || '❓';
};

/**
 * Format score for display
 * @param {object} score - Gemini score object
 * @returns {object} - Formatted for frontend
 */
const formatScoreForFrontend = (score) => {
  return {
    job_id: score.job_id,
    job_title: score.job_title,
    employer_name: score.employer_name,
    gemini_score: score.overall_match_score,
    scores: {
      skills: score.skills_match_score,
      experience: score.experience_match_score,
      education: score.education_match_score,
      domain: score.domain_match_score,
      soft_signals: score.soft_signals_score
    },
    role_identity_match: score.role_identity_match,
    recommendation: score.recommendation,
    emoji: getRecommendationEmoji(score.recommendation),
    key_strengths: score.key_strengths,
    key_gaps: score.key_gaps,
    detailed_analysis: score.detailed_analysis
  };
};

module.exports = {
  scoreJobWithGemini,
  scoreJobsWithGemini,
  extractJobDescriptionText,
  formatScoreForFrontend,
  getRecommendationEmoji
};
