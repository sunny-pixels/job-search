/**
 * Test: "Active US Security clearance" Detection
 * Verifies that jobs with "Active US Security clearance" are filtered out
 */

const { checkCitizenshipRestrictions } = require('../src/services/embeddingMatcherService');

console.log('🧪 Testing "Active US Security clearance" Detection\n');

// Test Case: Exact text from the screenshot
const job = {
  job_title: "Senior AI Engineer with Security Clearance",
  employer_name: "ChatGPT Jobs",
  job_description: "We are looking for a senior AI engineer...",
  job_highlights: {
    Qualifications: [
      "5+ years of experience in software engineering and machine learning.",
      "Active US Security clearance.",
      "Proven track record of deploying and maintaining ML/AI systems in production.",
      "Strong expertise in ML frameworks (PyTorch, TensorFlow, ONNX, JAX).",
      "Experience debugging complex systems.",
      "Exceptional communication skills.",
      "Comfortable working in dynamic environments with high customer exposure."
    ]
  }
};

console.log('Job Title:', job.job_title);
console.log('Qualifications:');
job.job_highlights.Qualifications.forEach((q, i) => {
  console.log(`  ${i + 1}. ${q}`);
});
console.log();

const result = checkCitizenshipRestrictions(job);

console.log('═'.repeat(60));
console.log('RESULT:');
console.log(`Status: ${result.hasRestriction ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
console.log(`Restriction Type: ${result.restrictionType || 'None'}`);
console.log(`Confidence: ${result.confidence}`);
console.log('═'.repeat(60));
console.log();

if (result.hasRestriction && result.restrictionType === 'Security Clearance') {
  console.log('✅ TEST PASSED: Job correctly blocked due to security clearance requirement');
} else {
  console.log('❌ TEST FAILED: Job should have been blocked but was not');
}
