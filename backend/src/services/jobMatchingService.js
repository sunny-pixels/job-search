const { spawn } = require("child_process");
const path = require("path");

/**
 * Search for jobs using greenhouse.py based on resume analysis
 * @param {Array} jobKeywords - Job titles to search for
 * @param {Array} primaryRoles - Primary roles from resume
 * @returns {Promise<Array>} - Array of matched jobs
 */
const searchGreenhouseJobs = (jobKeywords, primaryRoles) => {
  return new Promise((resolve, reject) => {
    // Combine job keywords and primary roles for searching
    const searchTerms = [...new Set([...jobKeywords, ...primaryRoles])];
    
    console.log("🔍 Searching for jobs with keywords:", searchTerms);

    // Path to the Python script
    const scriptPath = path.join(__dirname, "../../../scraper-service/greenhouse_matcher.py");
    
    // Spawn Python process
    const pythonProcess = spawn("python3", [
      scriptPath,
      JSON.stringify(searchTerms)
    ]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
      console.error("Python stderr:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python process exited with code:", code);
        console.error("Error output:", errorString);
        return reject(new Error(`Job search failed with code ${code}`));
      }

      try {
        const jobs = JSON.parse(dataString);
        console.log(`✅ Found ${jobs.length} matching jobs`);
        resolve(jobs);
      } catch (error) {
        console.error("Failed to parse Python output:", dataString);
        reject(new Error("Failed to parse job search results"));
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      reject(error);
    });
  });
};

module.exports = {
  searchGreenhouseJobs
};
