import { useState, useEffect, useContext } from "react";
import { AppliedJobsContext } from "../App.jsx";

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
  );
}