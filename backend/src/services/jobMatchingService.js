const { spawn } = require("child_process");
const path = require("path");

const SCRAPER_DIR = path.join(__dirname, "../../../scraper-service");

// Job cache: { key: { jobs: [], timestamp: Date } }
const jobCache = new Map();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Run a Python script and return parsed JSON from stdout
 */
const runPython = (scriptPath, args = []) => {
  return new Promise((resolve) => {
    const proc = spawn("python3", [scriptPath, ...args]);
    let out = "";
    let err = "";

    proc.stdout.on("data", d => { out += d.toString(); });
    proc.stderr.on("data", d => {
      err += d.toString();
      // Print progress lines (non-JSON stderr) to console
      d.toString().split("\n").forEach(line => {
        if (line.trim()) console.log("  [py]", line.trim());
      });
    });

    proc.on("close", () => {
      try {
        // Extract JSON between sentinel markers
        const start = out.indexOf('__JSON_START__');
        const end = out.indexOf('__JSON_END__');
        if (start !== -1 && end !== -1) {
          const jsonStr = out.substring(start + '__JSON_START__'.length, end).trim();
          resolve(JSON.parse(jsonStr));
        } else {
          // Fallback: try to find last JSON array
          const lastBracket = out.lastIndexOf('[');
          if (lastBracket !== -1) {
            resolve(JSON.parse(out.substring(lastBracket)));
          } else {
            console.log("  [warn] No JSON found in stdout");
            resolve([]);
          }
        }
      } catch (e) {
        console.log("  [warn] JSON parse failed:", e.message);
        resolve([]);
      }
    });

    proc.on("error", () => resolve([]));
  });
};

/**
 * Fetch jobs from JobSpy (Indeed + LinkedIn) — PRIMARY source
 */
const searchJobSpyJobs = (primaryRoles) => {
  console.log("🚀 [JobSpy] Fetching from Indeed + LinkedIn...");
  
  // Improve search terms by combining role components intelligently
  const improvedSearchTerms = [];
  
  for (const role of primaryRoles) {
    const roleLower = role.toLowerCase();
    
    // For compound roles like "software developer, intern", create specific combinations
    if (roleLower.includes(',')) {
      const parts = roleLower.split(',').map(p => p.trim());
      if (parts.length === 2) {
        // Create combined search term: "software developer intern"
        const combined = parts.join(' ');
        improvedSearchTerms.push(combined);
        console.log(`  🔄 Transformed "${role}" → "${combined}"`);
      } else {
        // Multiple parts, just join them
        improvedSearchTerms.push(parts.join(' '));
      }
    } else {
      // No comma, use as-is
      improvedSearchTerms.push(role);
    }
  }
  
  // Remove duplicates and use improved search terms
  const uniqueSearchTerms = [...new Set(improvedSearchTerms)];
  console.log("🔍 Final search terms:", uniqueSearchTerms);
  
  const scriptPath = path.join(SCRAPER_DIR, "jobspy_scraper.py");
  return runPython(scriptPath, [JSON.stringify(uniqueSearchTerms)]);
};

/**
 * Fetch jobs from Greenhouse API — SECONDARY source
 */
const searchGreenhouseJobs = (jobKeywords, primaryRoles) => {
  console.log("🏢 [Greenhouse] Fetching from company boards...");
  
  // Process primary roles to combine comma-separated parts
  const processedRoles = [];
  for (const role of primaryRoles) {
    if (role.toLowerCase().includes(',')) {
      const parts = role.split(',').map(p => p.trim());
      processedRoles.push(parts.join(' ')); // Combine parts
    } else {
      processedRoles.push(role);
    }
  }
  
  const searchTerms = [...new Set([...jobKeywords, ...processedRoles])];
  console.log("🔍 Greenhouse search terms:", searchTerms);
  
  const scriptPath = path.join(SCRAPER_DIR, "greenhouse_matcher.py");
  return runPython(scriptPath, [JSON.stringify(searchTerms)]);
};

/**
 * Fetch all jobs: JobSpy first (priority), Greenhouse second.
 * Deduplicates by job URL.
 * Returns merged array with source tag.
 * Implements 1-hour caching to avoid re-scraping.
 */
const fetchAllJobs = async (jobKeywords, primaryRoles) => {
  // Create cache key from search terms
  const cacheKey = JSON.stringify({ jobKeywords: jobKeywords.sort(), primaryRoles: primaryRoles.sort() });
  
  // Check cache first
  const cached = jobCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS)) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000 / 60);
    console.log(`💾 Using cached jobs (${cached.jobs.length} jobs, ${age} min old)`);
    return cached.jobs;
  }
  
  console.log("🔍 Cache miss or expired, fetching fresh jobs...");
  
  // Run both in parallel
  const [jobSpyJobs, greenhouseJobs] = await Promise.all([
    searchJobSpyJobs(primaryRoles),
    searchGreenhouseJobs(jobKeywords, primaryRoles)
  ]);

  console.log(`📊 JobSpy: ${jobSpyJobs.length} | Greenhouse: ${greenhouseJobs.length}`);

  const seen = new Set();
  const merged = [];

  // JobSpy first — higher priority
  for (const job of jobSpyJobs) {
    const key = job.job_url || `${job.title}-${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...job, source_type: "jobspy" });
    }
  }

  // Greenhouse second — fills in more results
  for (const job of greenhouseJobs) {
    const key = job.job_url || `${job.title}-${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ ...job, source_type: "greenhouse" });
    }
  }

  console.log(`✅ Total merged: ${merged.length} unique jobs`);
  
  // Store in cache
  jobCache.set(cacheKey, { jobs: merged, timestamp: Date.now() });
  console.log(`💾 Cached ${merged.length} jobs for 1 hour`);
  
  return merged;
};

module.exports = { fetchAllJobs, searchGreenhouseJobs };
