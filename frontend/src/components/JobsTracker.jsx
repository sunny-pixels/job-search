import { useState, useEffect, useContext } from "react";
import { AppliedJobsContext } from "../App.jsx";

const styles = `
  .tracker-page {
    width: 100%;
    min-height: calc(100vh - 68px);
    background: var(--bg);
  }

  /* ── PAGE HEADER ── */
  .tracker-page-header {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 40px 40px 36px;
    width: 100%;
  }

  .tracker-page-header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }

  .tracker-page-title {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 8px;
  }

  .tracker-page-sub {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  /* ── BODY ── */
  .tracker-body {
    padding: 32px 40px 64px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── STATS STRIP ── */
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }

  .stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.18s;
  }

  .stat-card:hover { box-shadow: var(--shadow-md); }

  .stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .stat-icon-wrap.gray { background: #f3f4f6; }
  .stat-icon-wrap.blue { background: #dbeafe; }
  .stat-icon-wrap.orange { background: #fed7aa; }
  .stat-icon-wrap.purple { background: #e9d5ff; }
  .stat-icon-wrap.red { background: #fecaca; }

  .stat-content {}

  .stat-number {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .stat-number.gray { color: #4b5563; }
  .stat-number.blue { color: #1d4ed8; }
  .stat-number.orange { color: #c2410c; }
  .stat-number.purple { color: #7c3aed; }
  .stat-number.red { color: #dc2626; }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 3px;
  }

  /* ── FILTER SECTION ── */
  .filter-section {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .search-row {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-light);
    position: relative;
  }

  .search-icon-left {
    position: absolute;
    left: 40px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 13px 44px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-family: var(--font-sans);
    color: var(--text-primary);
    background: var(--bg);
    transition: all 0.18s;
    outline: none;
  }

  .search-input:focus {
    border-color: #2563eb;
    background: var(--white);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
  }

  .search-input::placeholder { color: var(--text-muted); }

  .clear-btn {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1rem;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
    line-height: 1;
  }

  .clear-btn:hover { color: var(--text-primary); background: var(--bg); }

  .filter-tabs-row {
    padding: 14px 24px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .filter-tab {
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;
    border: 1.5px solid var(--border);
    background: var(--white);
    transition: all 0.14s;
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-sans);
  }

  .filter-tab:hover { background: var(--bg); border-color: #bbb; color: var(--text-primary); }

  .filter-tab.active { background: var(--text-primary); color: var(--white); border-color: var(--text-primary); }

  .tab-count {
    font-size: 0.72rem;
    font-weight: 700;
    opacity: 0.65;
    background: rgba(255,255,255,0.15);
    padding: 1px 7px;
    border-radius: 100px;
  }

  .filter-tab.active .tab-count { opacity: 0.8; background: rgba(255,255,255,0.2); }
  .filter-tab:not(.active) .tab-count { background: var(--bg); color: var(--text-muted); opacity: 1; }

  /* ── JOB CARDS ── */
  .jobs-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 16px;
  }

  .job-track-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
  }

  .job-track-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .job-track-header {
    padding: 22px 24px 18px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--border-light);
  }

  .job-track-info { flex: 1; min-width: 0; }

  .job-track-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 5px;
    letter-spacing: -0.01em;
  }

  .job-track-company {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 5px;
    font-weight: 500;
  }

  .job-track-resume {
    font-size: 0.78rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .status-badge {
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .status-badge.applied { background: #dbeafe; color: #1d4ed8; }
  .status-badge.shortlisted { background: #fed7aa; color: #c2410c; }
  .status-badge.interview { background: #e9d5ff; color: #7c3aed; }
  .status-badge.rejected { background: #fecaca; color: #dc2626; }

  .job-track-footer {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .job-track-date {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  .status-mini-row {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .mini-btn {
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 0.71rem;
    font-weight: 700;
    border: 1.5px solid;
    cursor: pointer;
    transition: all 0.14s;
    background: var(--white);
    font-family: var(--font-sans);
    letter-spacing: 0.01em;
  }

  .mini-btn.applied { border-color: #3b82f6; color: #3b82f6; }
  .mini-btn.applied.active { background: #3b82f6; color: #fff; }
  .mini-btn.shortlisted { border-color: #f59e0b; color: #f59e0b; }
  .mini-btn.shortlisted.active { background: #f59e0b; color: #fff; }
  .mini-btn.interview { border-color: #8b5cf6; color: #8b5cf6; }
  .mini-btn.interview.active { background: #8b5cf6; color: #fff; }
  .mini-btn.rejected { border-color: #ef4444; color: #ef4444; }
  .mini-btn.rejected.active { background: #ef4444; color: #fff; }
  .mini-btn:hover:not(.active) { opacity: 0.65; }

  .view-btn {
    padding: 10px 18px;
    background: var(--text-primary);
    color: var(--white);
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: var(--font-sans);
    flex-shrink: 0;
  }

  .view-btn:hover { background: var(--accent-hover); box-shadow: var(--shadow-sm); }

  /* ── STATES ── */
  .page-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
    gap: 12px;
  }

  .state-icon { font-size: 2.8rem; opacity: 0.3; }
  .state-text { font-size: 0.92rem; color: var(--text-muted); text-align: center; max-width: 340px; line-height: 1.6; }

  .empty-state-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .state-icon-inline {
    color: var(--text-muted);
    opacity: 0.6;
    flex-shrink: 0;
    font-weight-500;
  }

  .state-text-inline {
    font-size: 0.95rem; 
    color: var(--text-secondary); 
    line-height: 1.6; 
    font-weight: 500;
  }

  .state-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin-t 0.8s linear infinite;
  }

  @keyframes spin-t { to { transform: rotate(360deg); } }

  .empty-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 72px 24px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 1100px) {
    .stats-strip { grid-template-columns: repeat(3, 1fr); }
    .jobs-list { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .tracker-page-header { padding: 28px 16px 24px; }
    .tracker-body { padding: 20px 16px 48px; }
    .stats-strip { grid-template-columns: repeat(2, 1fr); }
    .tracker-page-header-inner { flex-direction: column; align-items: flex-start; }
    .search-icon-left { left: 36px; }
    .clear-btn { right: 36px; }
    .search-row { padding: 16px 20px; }
    .search-icon-left { left: 36px; }
    .filter-tabs-row { padding: 12px 20px; }
  }
`;

export default function JobsTracker() {
  const { appliedJobsRefreshTrigger, triggerAppliedJobsRefresh } = useContext(AppliedJobsContext);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllJobs(); }, []);

  useEffect(() => {
    if (appliedJobsRefreshTrigger > 0) fetchAllJobs(searchTerm);
  }, [appliedJobsRefreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAllJobs(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAllJobs = async (search = "") => {
    setLoading(true);
    try {
      const url = search
        ? `http://localhost:3001/api/applied-jobs/all?search=${encodeURIComponent(search)}`
        : `http://localhost:3001/api/applied-jobs/all`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateJobStatus = async (resumeId, jobId, status) => {
    try {
      const res = await fetch("http://localhost:3001/api/applied-jobs/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId, status })
      });
      if (res.ok) {
        setJobs(prev => prev.map(job =>
          job.resumeId._id === resumeId && job.jobId === jobId
            ? { ...job, status, statusUpdatedAt: new Date().toISOString() }
            : job
        ));
        triggerAppliedJobsRefresh();
      }
    } catch (err) { console.error(err); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const filteredJobs = statusFilter === "all" ? jobs : jobs.filter(j => j.status === statusFilter);

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === "applied").length,
    shortlisted: jobs.filter(j => j.status === "shortlisted").length,
    interview: jobs.filter(j => j.status === "interview").length,
    rejected: jobs.filter(j => j.status === "rejected").length,
  };

  const statItems = [
    { 
      key: "total", 
      label: "Total", 
      color: "gray", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    },
    { 
      key: "applied", 
      label: "Applied", 
      color: "blue", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      )
    },
    { 
      key: "shortlisted", 
      label: "Shortlisted", 
      color: "orange", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      )
    },
    { 
      key: "interview", 
      label: "Interview", 
      color: "purple", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )
    },
    { 
      key: "rejected", 
      label: "Rejected", 
      color: "red", 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      )
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="tracker-page">

        {/* Page Header */}
        <div className="tracker-page-header">
          <div className="tracker-page-header-inner">
            <div>
              <h1 className="tracker-page-title">Jobs Tracker</h1>
              <p className="tracker-page-sub">Track and manage all your job applications</p>
            </div>
          </div>
        </div>

        <div className="tracker-body">

          {/* Stats Strip */}
          <div className="stats-strip">
            {statItems.map(item => (
              <div key={item.key} className="stat-card">
                <div className={`stat-icon-wrap ${item.color}`}>{item.icon}</div>
                <div className="stat-content">
                  <div className={`stat-number ${item.color}`}>{stats[item.key]}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="filter-section">
            <div className="search-row">
              <span className="search-icon-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by job title or company…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => setSearchTerm("")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="filter-tabs-row">
              {[
                { id: "all", label: "All Jobs", count: stats.total },
                { id: "applied", label: "Applied", count: stats.applied },
                { id: "shortlisted", label: "Shortlisted", count: stats.shortlisted },
                { id: "interview", label: "Interview", count: stats.interview },
                { id: "rejected", label: "Rejected", count: stats.rejected },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`filter-tab ${statusFilter === tab.id ? "active" : ""}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                  <span className="tab-count">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="page-center">
              <div className="state-spinner" />
              <div className="state-text">Loading your applications…</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-card">
              <div className="empty-state-content">
                <div className="state-icon-inline">
                  {searchTerm ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  )}
                </div>
                <div className="state-text-inline">
                  {searchTerm
                    ? `No jobs found matching "${searchTerm}"`
                    : statusFilter === "all"
                    ? "No applications yet. Upload a resume and start applying to jobs!"
                    : `No jobs with status "${statusFilter}"`
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="jobs-list">
              {filteredJobs.map((job, idx) => (
                <div key={idx} className="job-track-card">
                  <div className="job-track-header">
                    <div className="job-track-info">
                      <div className="job-track-title">{job.jobTitle}</div>
                      <div className="job-track-company">{job.company}</div>
                      <div className="job-track-resume">
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </span>
                        <span>{job.resumeId?.extractedData?.name || job.resumeId?.filename || "Unknown"}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                  </div>

                  <div className="job-track-footer">
                    <div>
                      <div className="job-track-date">Applied {formatDate(job.appliedAt)}</div>
                      <div className="status-mini-row">
                        {["applied", "shortlisted", "interview", "rejected"].map(s => (
                          <button
                            key={s}
                            className={`mini-btn ${s} ${job.status === s ? "active" : ""}`}
                            onClick={() => updateJobStatus(job.resumeId._id, job.jobId, s)}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="view-btn">
                      View Job →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}