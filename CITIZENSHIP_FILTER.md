# Citizenship & Clearance Filter

## Overview
Added automatic filtering to **discard jobs** that require US citizenship, green cards, security clearances, or DoD contractor status. This helps international candidates (H1B, OPT, CPT) avoid wasting time on jobs they cannot apply for.

## Implementation

### Location
`backend/src/services/embeddingMatcherService.js`

### New Function: `checkCitizenshipRestrictions(job)`

Analyzes job descriptions, titles, and qualifications to detect restricted requirements.

### Patterns Detected

#### 1. **US Citizenship Required**
- "US citizenship required"
- "Must be a US citizen"
- "Only US citizens may apply"
- "Citizenship: US required"
- "US citizenship is mandatory"

#### 2. **Green Card Required**
- "Green card required"
- "Permanent resident required"
- "Must have green card"
- "Only green card holders eligible"

#### 3. **Security Clearance Required**
- "Security clearance required"
- "Active Secret clearance"
- "Active US Security clearance"
- "Top Secret clearance needed"
- "TS/SCI clearance"
- "Must obtain clearance"
- "with Security Clearance" (in job title)
- "Clearance holder"

#### 4. **DoD Contractor**
- "DoD contractor required"
- "Department of Defense clearance"
- "Government contractor only"
- "Federal contractor required"

## Integration

### Phase 1 Filtering
The filter is applied in **Phase 1** (before embedding generation) alongside experience filtering:

```javascript
const phase1Jobs = jobs.map((job) => {
  const jobExp = extractJobExperience(job);
  const expMatch = isExperienceMatch(resumeYears, jobExp);
  
  // NEW: Check citizenship restrictions
  const restrictionCheck = checkCitizenshipRestrictions(job);
  const noRestrictions = !restrictionCheck.hasRestriction;
  
  return {
    job,
    expMatch,
    noRestrictions,
    passedPhase1: expMatch && noRestrictions  // Both must pass
  };
});
```

### Statistics Logged
```
🚫 Restriction statistics: {
  noRestrictions: 45,
  usCitizen: 12,
  greenCard: 3,
  clearance: 8,
  dod: 2
}
```

### Filter Results
```
✅ Passed Phase 1: 45 jobs
❌ Failed (experience): 10 jobs
❌ Failed (restrictions): 25 jobs
❌ Failed (both): 5 jobs
```

## Benefits

1. **Saves Time**: International candidates don't see jobs they can't apply for
2. **Better Matches**: Focus on jobs that are actually accessible
3. **Transparent**: Logs show exactly why jobs were filtered out
4. **Comprehensive**: Checks job title, description, qualifications, and responsibilities

## Testing

Run the test suite:
```bash
cd backend/test
node test-citizenship-filter.js
```

### Test Results
- ✅ US Citizenship detection
- ✅ Green Card detection
- ✅ Security Clearance detection
- ✅ DoD Contractor detection
- ✅ No false positives (jobs with "work authorization" pass through)
- ✅ Multiple restrictions handled correctly

## Example Output

```
📋 [JOB #1]
Title: Software Engineer
Company: Defense Solutions Inc
Experience Required: 3-5 years
Experience Match: ✅ YES
Citizenship Check: 🚫 RESTRICTED (US Citizenship)
   🚫 DISCARD: US Citizenship required - "us citizenship required"
```

## Future Enhancements

Potential additions:
- Add user preference to toggle this filter on/off
- Support for specific visa types (H1B sponsor, OPT friendly)
- Country-specific filtering (UK, Canada, etc.)
- Clearance level granularity (Secret vs Top Secret)
