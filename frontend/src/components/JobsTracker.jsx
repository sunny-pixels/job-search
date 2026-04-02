import { useState, useEffect, useContext } from "react";
import { AppliedJobsContext } from "../App.jsx";

const styles = `
  .jobs-tracker-root {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 2rem;
  }

  .jobs-header {
    margin-bottom: 32px;
  }

  .jobs-title {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111;
    margin-bottom: 8px;
  }

  .jobs-subtitle {
    font-size: 0.95rem;
    color: #666;
  }

  .search-filter-section {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .search-bar {
    position: relative;
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    padding: 14px 48px 14px 48px;
    border: 1.5px solid #e0e0d8;
    border-radius: 12px;
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.1rem;
    color: #999;
  }

  .clear-search {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #999;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-search:hover {
    color: #111;
  }

  .filter-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-tab {
    padding: 10px 18px;
    background: #fafaf8;
    border: 1.5px solid #e0e0d8;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-tab:hover {
    background: #f0f0eb;
    border-color: #ccc;
  }

  .filter-tab.active {
    background: #111;
    color: #fff;
    border-color: #111;
  }

  .filter-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .filter-tab.active .filter-count {
    background: rgba(255, 255, 255, 0.25);
  }

  .stats-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 14px;
    padding: 18px;
    text-align: center;
  }

  .stat-number {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-number.blue { color: #3b82f6; }
  .stat-number.orange { color: #f59e0b; }
  .stat-number.purple { color: #8b5cf6; }
  .stat-number.red { color: #ef4444; }
  .stat-number.gray { color: #6b7280; }

  .stat-label {
    font-size: 0.75rem;
    color: #999;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .jobs-grid {
    display: grid;
    gap: 16px;
  }

  .job-tracker-card {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.2s;
  }

  .job-tracker-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .job-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 16px;
  }

  .job-info {
    flex: 1;
    min-width: 0;
  }

  .job-tracker-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 6px;
    line-height: 1.3;
  }

  .job-company {
    font-size: 0.88rem;
    color: #666;
    margin-bottom: 4px;
  }

  .job-resume-holder {
    font-size: 0.82rem;
    color: #999;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-badge {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
    text-transform: capitalize;
  }

  .status-badge.applied {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-badge.shortlisted {
    background: #fed7aa;
    color: #c2410c;
  }

  .status-badge.interview {
    background: #e9d5ff;
    color: #7c3aed;
  }

  .status-badge.rejected {
    background: #fecaca;
    color: #dc2626;
  }

  .job-card-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e3;
  }

  .job-date {
    font-size: 0.8rem;
    color: #999;
  }

  .job-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .status-update-section {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-mini-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    border: 1.5px solid;
    cursor: pointer;
    transition: all 0.15s;
    background: #fff;
  }

  .status-mini-btn.applied {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .status-mini-btn.applied.active {
    background: #3b82f6;
    color: #fff;
  }

  .status-mini-btn.shortlisted {
    border-color: #f59e0b;
    color: #f59e0b;
  }

  .status-mini-btn.shortlisted.active {
    background: #f59e0b;
    color: #fff;
  }

  .status-mini-btn.interview {
    border-color: #8b5cf6;
    color: #8b5cf6;
  }

  .status-mini-btn.interview.active {
    background: #8b5cf6;
    color: #fff;
  }

  .status-mini-btn.rejected {
    border-color: #ef4444;
    color: #ef4444;
  }

  .status-mini-btn.rejected.active {
    background: #ef4444;
    color: #fff;
  }

  .status-mini-btn:hover:not(.active) {
    opacity: 0.7;
  }

  .view-job-btn {
    padding: 8px 16px;
    background: #111;
    color: #fff;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
    display: inline-block;
  }

  .view-job-btn:hover {
    background: #333;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-text {
    font-size: 1rem;
    color: #888;
    line-height: 1.6;
  }

  .loading-state {
    text-align: center;
    padding: 60px 20px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e8e8e3;
    border-top-color: #111;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 0.95rem;
    color: #888;
  }

  @media (max-width: 768px) {
    .jobs-tracker-root {
      padding: 24px 1rem;
    }

    .job-card-header {
      flex-direction: column;
    }

    .job-card-body {
      flex-direction: column;
      align-items: flex-start;
    }

    .stats-strip {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export default function JobsTracker() {
  const { appliedJobsRefreshTrigger, triggerAppliedJobsRefresh } = useContext(AppliedJobsContext);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllJobs();
  }, []);

  // Refresh when jobs are updated from other sections
  useEffect(() => {
    if (appliedJobsRefreshTrigger > 0) {
      fetchAllJobs(searchTerm);
    }
  }, [appliedJobsRefreshTrigger]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllJobs(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAllJobs = async (search = "") => {
    setLoading(true);
    try {
      const url = search 
        ? `http://localhost:3001/api/applied-jobs/all?search=${encodeURIComponent(search)}`
        : `http://localhost:3001/api/applied-jobs/all`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (resumeId, jobId, status) => {
    try {
      const res = await fetch("http://localhost:3001/api/applied-jobs/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId, status })
      });

      if (res.ok) {
        // Update local state
        setJobs(prev => prev.map(job => 
          job.resumeId._id === resumeId && job.jobId === jobId 
            ? { ...job, status, statusUpdatedAt: new Date().toISOString() }
            : job
        ));
        // Trigger refresh in other sections
        triggerAppliedJobsRefresh();
      }
    } catch (err) {
      console.error("Failed to update job status:", err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  // Filter jobs by status
  const filteredJobs = statusFilter === "all" 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);

  // Calculate stats
  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === "applied").length,
    shortlisted: jobs.filter(j => j.status === "shortlisted").length,
    interview: jobs.filter(j => j.status === "interview").length,
    rejected: jobs.filter(j => j.status === "rejected").length
  };

  return (
    <>
      <style>{styles}</style>
      <div className="jobs-tracker-root">
        <div className="jobs-header">
          <h1 className="jobs-title">Jobs Tracker</h1>
          <p className="jobs-subtitle">Track all your job applications in one place</p>
        </div>

        {/* Stats */}
        <div className="stats-strip">
          <div className="stat-card">
            <div className="stat-number gray">{stats.total}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number blue">{stats.applied}</div>
            <div className="stat-label">Applied</div>
          </div>
          <div className="stat-card">
            <div className="stat-number orange">{stats.shortlisted}</div>
            <div className="stat-label">Shortlisted</div>
          </div>
          <div className="stat-card">
            <div className="stat-number purple">{stats.interview}</div>
            <div className="stat-label">Interview</div>
          </div>
          <div className="stat-card">
            <div className="stat-number red">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Jobs
              <span className="filter-count">{stats.total}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === "applied" ? "active" : ""}`}
              onClick={() => setStatusFilter("applied")}
            >
              Applied
              <span className="filter-count">{stats.applied}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === "shortlisted" ? "active" : ""}`}
              onClick={() => setStatusFilter("shortlisted")}
            >
              Shortlisted
              <span className="filter-count">{stats.shortlisted}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === "interview" ? "active" : ""}`}
              onClick={() => setStatusFilter("interview")}
            >
              Interview
              <span className="filter-count">{stats.interview}</span>
            </button>
            <button
              className={`filter-tab ${statusFilter === "rejected" ? "active" : ""}`}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
              <span className="filter-count">{stats.rejected}</span>
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading jobs...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {searchTerm ? "🔍" : "📋"}
            </div>
            <div className="empty-text">
              {searchTerm 
                ? `No jobs found matching "${searchTerm}"`
                : statusFilter === "all"
                ? "No jobs applied yet. Start by uploading a resume and applying to jobs!"
                : `No jobs with status "${statusFilter}"`
              }
            </div>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job, idx) => (
              <div key={idx} className="job-tracker-card">
                <div className="job-card-header">
                  <div className="job-info">
                    <div className="job-tracker-title">{job.jobTitle}</div>
                    <div className="job-company">{job.company}</div>
                    <div className="job-resume-holder">
                      <span>👤</span>
                      <span>{job.resumeId?.extractedData?.name || job.resumeId?.filename || "Unknown"}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${job.status}`}>
                    {job.status}
                  </span>
                </div>

                <div className="job-card-body">
                  <div>
                    <div className="job-date">
                      Applied {formatDate(job.appliedAt)}
                    </div>
                    <div className="status-update-section" style={{ marginTop: "12px" }}>
                      <button
                        className={`status-mini-btn applied ${job.status === 'applied' ? 'active' : ''}`}
                        onClick={() => updateJobStatus(job.resumeId._id, job.jobId, 'applied')}
                      >
                        Applied
                      </button>
                      <button
                        className={`status-mini-btn shortlisted ${job.status === 'shortlisted' ? 'active' : ''}`}
                        onClick={() => updateJobStatus(job.resumeId._id, job.jobId, 'shortlisted')}
                      >
                        Shortlisted
                      </button>
                      <button
                        className={`status-mini-btn interview ${job.status === 'interview' ? 'active' : ''}`}
                        onClick={() => updateJobStatus(job.resumeId._id, job.jobId, 'interview')}
                      >
                        Interview
                      </button>
                      <button
                        className={`status-mini-btn rejected ${job.status === 'rejected' ? 'active' : ''}`}
                        onClick={() => updateJobStatus(job.resumeId._id, job.jobId, 'rejected')}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>
                  <div className="job-actions">
                    <a 
                      href={job.jobUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-job-btn"
                    >
                      View Job →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
