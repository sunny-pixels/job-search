/**
 * Test: Security Clearance Detection in Job Title
 * Verifies that jobs with "Security Clearance" in the title are filtered out
 */

const { checkCitizenshipRestrictions } = require('../src/services/embeddingMatcherService');

console.log('🧪 Testing Security Clearance Detection in Job Title\n');

// Test Case 1: "with Security Clearance" in title
const job1 = {
  job_title: "Senior AI Engineer with Security Clearance",
  employer_name: "ChatGPT Jobs",
  job_description: "We are looking for a senior AI engineer...",
  job_highlights: {
    Qualifications: [
      "5+ years of AI/ML experience",
      "Strong Python skills",
      "Experience with deep learning"
    ]
  }
};

console.log('Test 1: Job title contains "with Security Clearance"');
console.log(`Title: ${job1.job_title}`);
const result1 = checkCitizenshipRestrictions(job1);
console.log(`Result: ${result1.hasRestriction ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
console.log(`Type: ${result1.restrictionType || 'None'}`);
console.log(`Expected: 🚫 BLOCKED (Security Clearance)\n`);

// Test Case 2: "Clearance holder" in qualifications
const job2 = {
  job_title: "Machine Learning Engineer",
  employer_name: "Defense Tech",
  job_description: "Join our ML team...",
  job_highlights: {
    Qualifications: [
      "3+ years ML experience",
      "Clearance holder preferred",
      "Python and TensorFlow"
    ]
  }
};

console.log('Test 2: Qualifications contain "Clearance holder"');
console.log(`Title: ${job2.job_title}`);
const result2 = checkCitizenshipRestrictions(job2);
console.log(`Result: ${result2.hasRestriction ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
console.log(`Type: ${result2.restrictionType || 'None'}`);
console.log(`Expected: 🚫 BLOCKED (Security Clearance)\n`);

// Test Case 3: No clearance requirement (should pass)
const job3 = {
  job_title: "AI Engineer",
  employer_name: "Tech Startup",
  job_description: "Build AI models for our platform...",
  job_highlights: {
    Qualifications: [
      "2+ years AI experience",
      "Work authorization required",
      "Python and ML frameworks"
    ]
  }
};

console.log('Test 3: No clearance requirement');
console.log(`Title: ${job3.job_title}`);
const result3 = checkCitizenshipRestrictions(job3);
console.log(`Result: ${result3.hasRestriction ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
console.log(`Type: ${result3.restrictionType || 'None'}`);
console.log(`Expected: ✅ ALLOWED (No restrictions)\n`);

// Test Case 4: "Security clearance required" in description
const job4 = {
  job_title: "Senior ML Engineer",
  employer_name: "Government Contractor",
  job_description: "Security clearance required. Build ML systems...",
  job_highlights: {
    Qualifications: [
      "5+ years experience",
      "Python and TensorFlow"
    ]
  }
};

console.log('Test 4: "Security clearance required" in description');
console.log(`Title: ${job4.job_title}`);
const result4 = checkCitizenshipRestrictions(job4);
console.log(`Result: ${result4.hasRestriction ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
console.log(`Type: ${result4.restrictionType || 'None'}`);
console.log(`Expected: 🚫 BLOCKED (Security Clearance)\n`);

// Summary
console.log('═'.repeat(60));
console.log('SUMMARY:');
console.log(`Test 1: ${result1.hasRestriction && result1.restrictionType === 'Security Clearance' ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Test 2: ${result2.hasRestriction && result2.restrictionType === 'Security Clearance' ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Test 3: ${!result3.hasRestriction ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Test 4: ${result4.hasRestriction && result4.restrictionType === 'Security Clearance' ? '✅ PASS' : '❌ FAIL'}`);
console.log('═'.repeat(60));
