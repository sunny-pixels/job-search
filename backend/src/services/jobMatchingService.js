const { spawn } = require("child_process");
const path = require("path");

const SCRAPER_DIR = path.join(__dirname, "../../../scraper-service");

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
  const scriptPath = path.join(SCRAPER_DIR, "jobspy_scraper.py");
  return runPython(scriptPath, [JSON.stringify(primaryRoles)]);
};

/**
 * Fetch jobs from Greenhouse API — SECONDARY source
 */
const searchGreenhouseJobs = (jobKeywords, primaryRoles) => {
  console.log("🏢 [Greenhouse] Fetching from company boards...");
  const searchTerms = [...new Set([...jobKeywords, ...primaryRoles])];
  const scriptPath = path.join(SCRAPER_DIR, "greenhouse_matcher.py");
  return runPython(scriptPath, [JSON.stringify(searchTerms)]);
};

/**
 * Fetch all jobs: JobSpy first (priority), Greenhouse second.
 * Deduplicates by job URL.
 * Returns merged array with source tag.
 */
const fetchAllJobs = async (jobKeywords, primaryRoles) => {
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
  return merged;
};

module.exports = { fetchAllJobs, searchGreenhouseJobs };
