/**
 * Test Citizenship & Clearance Filtering
 * Tests the new checkCitizenshipRestrictions() function
 */

const { checkCitizenshipRestrictions } = require('../src/services/embeddingMatcherService');

console.log('='.repeat(80));
console.log('🧪 TESTING CITIZENSHIP & CLEARANCE FILTER');
console.log('='.repeat(80));

// Test Case 1: US Citizenship Required
const job1 = {
  job_title: 'Software Engineer',
  employer_name: 'Defense Company',
  job_description: 'We are looking for a software engineer. Must be a US Citizen to apply.',
  job_highlights: {
    Qualifications: [
      'Bachelor\'s degree in Computer Science',
      'US Citizenship required',
      '3+ years of experience'
    ]
  }
};

console.log('\n📋 Test 1: US Citizenship Required');
console.log('Job:', job1.job_title);
console.log('Description:', job1.job_description);
const result1 = checkCitizenshipRestrictions(job1);
console.log('Result:', result1);
console.log('Expected: hasRestriction=true, type=US Citizenship');
console.log(result1.hasRestriction && result1.restrictionType === 'US Citizenship' ? '✅ PASS' : '❌ FAIL');

// Test Case 2: Green Card Required
const job2 = {
  job_title: 'Data Scientist',
  employer_name: 'Tech Corp',
  job_description: 'Join our data science team. Green card or US citizenship required.',
  job_highlights: {
    Qualifications: [
      'Master\'s degree preferred',
      'Green card required',
      'Python and R experience'
    ]
  }
};

console.log('\n📋 Test 2: Green Card Required');
console.log('Job:', job2.job_title);
console.log('Description:', job2.job_description);
const result2 = checkCitizenshipRestrictions(job2);
console.log('Result:', result2);
console.log('Expected: hasRestriction=true, type=Green Card');
console.log(result2.hasRestriction && result2.restrictionType === 'Green Card' ? '✅ PASS' : '❌ FAIL');

// Test Case 3: Security Clearance Required
const job3 = {
  job_title: 'Systems Engineer',
  employer_name: 'Government Contractor',
  job_description: 'Work on classified systems. Active security clearance required.',
  job_highlights: {
    Qualifications: [
      'Bachelor\'s degree',
      'Must have active Secret clearance',
      '5+ years experience'
    ]
  }
};

console.log('\n📋 Test 3: Security Clearance Required');
console.log('Job:', job3.job_title);
console.log('Description:', job3.job_description);
const result3 = checkCitizenshipRestrictions(job3);
console.log('Result:', result3);
console.log('Expected: hasRestriction=true, type=Security Clearance');
console.log(result3.hasRestriction && result3.restrictionType === 'Security Clearance' ? '✅ PASS' : '❌ FAIL');

// Test Case 4: DoD Contractor
const job4 = {
  job_title: 'Network Engineer',
  employer_name: 'Defense Solutions',
  job_description: 'Support DoD networks. DoD contractor clearance required.',
  job_highlights: {
    Qualifications: [
      'CCNA certification',
      'DoD contractor experience required',
      'TS/SCI clearance'
    ]
  }
};

console.log('\n📋 Test 4: DoD Contractor Required');
console.log('Job:', job4.job_title);
console.log('Description:', job4.job_description);
const result4 = checkCitizenshipRestrictions(job4);
console.log('Result:', result4);
console.log('Expected: hasRestriction=true, type=DoD Contractor or Security Clearance');
console.log(result4.hasRestriction ? '✅ PASS' : '❌ FAIL');

// Test Case 5: No Restrictions (Should PASS)
const job5 = {
  job_title: 'Full Stack Developer',
  employer_name: 'Startup Inc',
  job_description: 'Build amazing products. Work authorization required (H1B, OPT, CPT welcome).',
  job_highlights: {
    Qualifications: [
      'Bachelor\'s degree',
      'React and Node.js experience',
      'Authorized to work in the US'
    ]
  }
};

console.log('\n📋 Test 5: No Restrictions (Should PASS)');
console.log('Job:', job5.job_title);
console.log('Description:', job5.job_description);
const result5 = checkCitizenshipRestrictions(job5);
console.log('Result:', result5);
console.log('Expected: hasRestriction=false');
console.log(!result5.hasRestriction ? '✅ PASS' : '❌ FAIL');

// Test Case 6: Multiple Restrictions
const job6 = {
  job_title: 'Cybersecurity Analyst',
  employer_name: 'Federal Agency',
  job_description: 'Protect critical infrastructure. US citizenship and Top Secret clearance required.',
  job_highlights: {
    Qualifications: [
      'US Citizenship mandatory',
      'Top Secret/SCI clearance required',
      'CISSP certification preferred'
    ]
  }
};

console.log('\n📋 Test 6: Multiple Restrictions');
console.log('Job:', job6.job_title);
console.log('Description:', job6.job_description);
const result6 = checkCitizenshipRestrictions(job6);
console.log('Result:', result6);
console.log('Expected: hasRestriction=true (catches first match)');
console.log(result6.hasRestriction ? '✅ PASS' : '❌ FAIL');

console.log('\n' + '='.repeat(80));
console.log('✅ CITIZENSHIP & CLEARANCE FILTER TEST COMPLETE');
console.log('='.repeat(80));
