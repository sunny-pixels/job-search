/**
 * Test: LLM-Based Resume-JD Matching with Gemini
 * 
 * This test uses Google's Gemini AI to score how well a resume matches a job description,
 * similar to uploading both documents to Gemini's online platform.
 * 
 * The test:
 * 1. Reads resume.txt and jd.txt from the test folder
 * 2. Sends both to Gemini with a scoring prompt
 * 3. Gets back a match percentage and detailed analysis
 * 4. Displays the results in a formatted output
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../src/.env') });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Score resume-JD match using Gemini
 * @param {string} resumeText - Resume content
 * @param {string} jdText - Job description content
 * @returns {Promise<object>} - Match score and analysis
 */
async function scoreResumeWithGemini(resumeText, jdText) {
  console.log('🤖 [Gemini] Analyzing resume-JD match...\n');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0 }
    });
    
 // Replace the prompt variable inside your scoreResumeWithGemini function with this:

const prompt = `You are an experienced recruiter, hiring evaluator, and talent assessment specialist with deep experience evaluating resumes across multiple industries, domains, and job functions including engineering, AI/ML, data, product, business, operations, finance, marketing, healthcare, sales, cybersecurity, and enterprise technology.

Your evaluations should reflect how real hiring managers assess candidates:
- fair
- practical
- transferable-skill aware
- realistic
- balanced
- not overly strict
- not keyword-mechanical

You evaluate candidates holistically by considering:
- transferable experience
- practical capability
- role alignment
- business impact
- seniority
- adaptability
- learning potential
- technical and functional depth

Avoid bias toward any single industry, technology stack, or domain.

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

STEP 1 — ROLE ALIGNMENT CHECK

Identify:
1. The core professional identity of the role
2. The candidate's primary professional identity

Classify alignment as one of:

- EXACT
  Same role family and primary responsibilities

- STRONG_TRANSFERABLE
  Different but highly transferable background with strong overlap in skills, workflows, responsibilities, or business functions

- PARTIAL
  Adjacent role with some overlapping capabilities but noticeable gaps

- MISMATCH
  Different role family with limited transferable relevance

Scoring impact:
- EXACT → full scoring range allowed
- STRONG_TRANSFERABLE → score may go up to 95
- PARTIAL → cap overall score at 80
- MISMATCH → cap overall score at 55

IMPORTANT:
Prioritize transferable capability and practical experience over exact title matching.

---

STEP 2 — WEIGHTED SCORING

Category 1 — Core Skills & Functional Competency (Weight: 35%)

Evaluate the candidate’s alignment with the primary skills, tools, responsibilities, and functional competencies required for the role.

Scoring rules:
- Directly matching required skills/tools → full credit
- Closely related or equivalent skills → high partial credit
- Transferable experience → meaningful credit
- Completely absent critical capabilities → low/no credit

IMPORTANT:
- Reward practical real-world experience heavily
- Reward production ownership, implementation, execution, and measurable impact
- Do NOT over-penalize candidates for missing niche tools if core competencies clearly exist
- Consider equivalent platforms, frameworks, systems, or methodologies as transferable where appropriate

Examples:
- Tableau vs Power BI → transferable BI experience
- AWS vs Azure → transferable cloud experience
- React vs Angular → transferable frontend engineering experience
- Scrum vs Kanban → transferable agile experience

---

Category 2 — Domain & Industry Relevance (Weight: 15%)

Evaluate industry, business-domain, and environment alignment.

Scoring guidance:
- Same industry + same sub-domain → 90–100
- Different industry but highly transferable environment → 75–90
- Adjacent industry/domain → 60–75
- Limited transferable relevance → 40–60
- Completely unrelated background → 0–40

IMPORTANT:
Do NOT heavily penalize candidates for lacking exact industry experience unless domain expertise is explicitly mandatory in the JD.

Transferable business and technical experience should receive meaningful credit.

---

Category 3 — Functional Experience & Seniority (Weight: 25%)

Evaluate:
- years of experience
- project complexity
- scope of responsibilities
- ownership level
- leadership exposure
- business impact
- autonomy
- collaboration
- scalability of work
- operational responsibility

Reward:
- end-to-end ownership
- measurable achievements
- strategic contribution
- cross-functional collaboration
- leadership or mentoring
- process improvement
- initiative and innovation

Deduct only when:
- experience level is clearly below role expectations
- responsibilities are substantially less advanced than the JD

---

Category 4 — Education & Eligibility (Weight: 10%)

Compare education, certifications, and eligibility requirements against the JD.

Scoring:
- Exact or stronger match → 90–100
- Related field/background → 75–90
- Different background compensated by strong experience → 60–75
- Below minimum requirements → 30–60

Do not over-penalize experienced candidates for non-perfect academic alignment.

---

Category 5 — Soft Signals & Professional Fit (Weight: 15%)

Evaluate:
- communication clarity
- resume quality
- career progression
- collaboration signals
- ownership mindset
- adaptability
- initiative
- professionalism
- stability
- learning ability

Reward:
- strong communication
- measurable impact
- business awareness
- teamwork
- leadership potential
- growth trajectory
- adaptability across environments

Avoid excessive penalties for short tenures unless clearly problematic.

---

STEP 3 — CALCULATE FINAL SCORE

Weighted score =
(Cat1 × 0.35) +
(Cat2 × 0.15) +
(Cat3 × 0.25) +
(Cat4 × 0.10) +
(Cat5 × 0.15)

Apply role alignment cap if needed.

Round to nearest integer.

Show scoring math explicitly.

Example:
Cat1: 90 × 0.35 = 31.5
Cat2: 80 × 0.15 = 12
Cat3: 85 × 0.25 = 21.25
Cat4: 90 × 0.10 = 9
Cat5: 88 × 0.15 = 13.2

Weighted Total: 86.95
Role Alignment Cap: none
Final Score: 87

---

STEP 4 — CALIBRATION CHECK

Validate final score against these definitions:

85–100 → STRONG_MATCH
Candidate is highly viable for interviews and demonstrates strong alignment with the role.

70–84 → GOOD_MATCH
Candidate has strong foundational alignment with some trainable gaps.

55–69 → MODERATE_MATCH
Candidate has partial alignment or noticeable gaps but still demonstrates transferable capability.

40–54 → WEAK_MATCH
Significant missing requirements or limited transferable experience.

0–39 → POOR_MATCH
Major mismatch in role identity or required capabilities.

IMPORTANT CALIBRATION RULES:

- Strong transferable experience should outweigh exact industry mismatch
- Real-world execution and measurable impact matter more than keyword-only overlap
- Equivalent tools, frameworks, and methodologies should receive reasonable transferability credit
- Do not behave like a rigid ATS parser
- Evaluate like a practical recruiter and hiring manager
- Scores below 70 should generally indicate meaningful capability gaps

---

STEP 5 — FINAL RECRUITER JUDGMENT

Before finalizing:
- Ask whether this candidate would realistically receive an interview
- Consider whether missing skills are trainable
- Consider whether the candidate has demonstrated the ability to learn adjacent tools quickly
- Favor practical capability over exact buzzword matching

---

OUTPUT — return ONLY this JSON block:

\`\`\`json
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
  "detailed_analysis": "<concise recruiter-style evaluation>"
}
\`\`\`
`;


    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from end of response (after chain-of-thought reasoning)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) throw new Error('No JSON block found in response');
    
    const analysis = JSON.parse(jsonMatch[1]);
    return analysis;
    
  } catch (error) {
    console.error('❌ [Gemini] Error:', error.message);
    throw error;
  }
}

/**
 * Display results in a formatted way
 */
function displayResults(analysis) {
  console.log('═'.repeat(80));
  console.log('📊 GEMINI AI RESUME-JD MATCH ANALYSIS');
  console.log('═'.repeat(80));
  console.log();

  // Overall Score
  const overallScore = analysis.overall_match_score;
  const scoreEmoji = overallScore >= 80 ? '🟢' : overallScore >= 60 ? '🟡' : '🔴';
  console.log(`${scoreEmoji} OVERALL MATCH SCORE: ${overallScore}%`);
  console.log();

  // Detailed Scores
  console.log('📈 DETAILED SCORES:');
  console.log(`   Skills Match:     ${analysis.skills_match_score}%`);
  console.log(`   Experience Match: ${analysis.experience_match_score}%`);
  console.log(`   Education Match:  ${analysis.education_match_score}%`);
  console.log();

  // Add this after the detailed scores block:
console.log(`   Domain Penalty:   -${analysis.domain_penalty_applied || 0} pts`);

  // Recommendation
  const recEmoji = {
    'STRONG_MATCH': '✅',
    'GOOD_MATCH': '👍',
    'MODERATE_MATCH': '⚠️',
    'WEAK_MATCH': '❌'
  };
  console.log(`${recEmoji[analysis.recommendation] || '❓'} RECOMMENDATION: ${analysis.recommendation}`);
  console.log();

  // Detailed Analysis
  console.log('📝 ANALYSIS:');
  console.log(`   ${analysis.detailed_analysis}`);
  console.log();

  // Key Strengths
  console.log('✅ KEY STRENGTHS:');
  analysis.key_strengths.forEach((strength, i) => {
    console.log(`   ${i + 1}. ${strength}`);
  });
  console.log();

  // Key Gaps
  console.log('❌ KEY GAPS:');
  analysis.key_gaps.forEach((gap, i) => {
    console.log(`   ${i + 1}. ${gap}`);
  });
  console.log();

  console.log('═'.repeat(80));
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🧪 Starting LLM-Based Resume-JD Matching Test with Gemini\n');

  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in .env file');
    }

    console.log('✅ Gemini API key found');
    console.log();

    // Read resume and JD files
    console.log('📄 Reading test files...');
    const resumePath = path.join(__dirname, 'resume.txt');
    const jdPath = path.join(__dirname, 'jd.txt');

    const resumeText = await fs.readFile(resumePath, 'utf-8');
    const jdText = await fs.readFile(jdPath, 'utf-8');

    console.log(`   Resume: ${resumeText.length} characters`);
    console.log(`   Job Description: ${jdText.length} characters`);
    console.log();

    // Score with Gemini
    const startTime = Date.now();
    const analysis = await scoreResumeWithGemini(resumeText, jdText);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Analysis complete in ${duration}s\n`);

    // Display results
    displayResults(analysis);

    // Save results to file
    const outputPath = path.join(__dirname, 'gemini-match-result.json');
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
    console.log();

    // Summary
    console.log('═'.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
