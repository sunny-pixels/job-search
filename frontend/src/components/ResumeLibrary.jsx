import { useState, useEffect, useContext } from "react";
import { AppliedJobsContext } from "../App.jsx";

const styles = `
  .library-page {
    width: 100%;
    min-height: calc(100vh - 68px);
    background: var(--bg);
  }

  /* ── PAGE HEADER ── */
  .library-page-header {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 40px 40px 36px;
    width: 100%;
  }

  .library-page-header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }

  .library-page-title {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 8px;
  }

  .library-page-sub {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .header-stat-row {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .header-stat {
    text-align: right;
  }

  .header-stat-num {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    line-height: 1;
  }

  .header-stat-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 3px;
  }

  /* ── BODY ── */
  .library-body {
    padding: 32px 40px 64px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── RESUME CARDS ── */
  .resume-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .resume-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s;
  }

  .resume-card:hover {
    box-shadow: var(--shadow-md);
  }

  /* Card Top */
  .resume-card-top {
    padding: 28px 32px;
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid var(--border-light);
  }

  .resume-avatar {
    width: 52px;
    height: 52px;
    background: var(--text-primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: white;
    flex-shrink: 0;
  }

  .resume-card-info {
    flex: 1;
    min-width: 0;
  }

  .resume-filename {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .resume-meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .resume-date {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .resume-level-badge {
    background: var(--bg);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 100px;
    letter-spacing: 0.02em;
  }

  .resume-card-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  /* Details Grid */
  .resume-details-grid {
    padding: 24px 32px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1px;
    background: var(--border-light);
    border-bottom: 1px solid var(--border-light);
  }

  .detail-cell {
    background: var(--white);
    padding: 18px 20px;
  }

  .detail-cell-label {
    font-size: 0.69rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .detail-cell-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
  }

  /* Skills Row */
  .skills-row {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .skills-row-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .skills-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .skill-tag {
    background: var(--text-primary);
    color: var(--white);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 100px;
  }

  .skill-tag-more {
    background: var(--bg);
    color: var(--text-muted);
    border: 1px solid var(--border);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 100px;
  }

  /* Applied Section */
  .applied-section {
    padding: 0;
  }

  .applied-toggle {
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }

  .applied-toggle:hover {
    background: var(--bg);
  }

  .applied-toggle-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .applied-toggle-title {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--text-primary);
  }

  .applied-count-pill {
    background: #22c55e;
    color: var(--white);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 100px;
  }

  .chevron {
    font-size: 0.8rem;
    color: var(--text-muted);
    transition: transform 0.2s;
  }

  .chevron.open { transform: rotate(180deg); }

  .applied-list {
    border-top: 1px solid var(--border-light);
    padding: 16px 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .applied-empty {
    text-align: center;
    padding: 28px 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .applied-job-row {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 16px;
  }

  .applied-job-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-primary);
    margin-bottom: 3px;
    letter-spacing: -0.01em;
  }

  .applied-job-company {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .status-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .status-group-label {
    font-size: 0.69rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .status-buttons {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-btn {
    padding: 6px 13px;
    border-radius: var(--radius-sm);
    font-size: 0.74rem;
    font-weight: 700;
    border: 1.5px solid;
    cursor: pointer;
    transition: all 0.14s;
    background: var(--white);
    font-family: var(--font-sans);
  }

  .status-btn.applied { border-color: #3b82f6; color: #3b82f6; }
  .status-btn.applied.active { background: #3b82f6; color: #fff; }
  .status-btn.shortlisted { border-color: #f59e0b; color: #f59e0b; }
  .status-btn.shortlisted.active { background: #f59e0b; color: #fff; }
  .status-btn.interview { border-color: #8b5cf6; color: #8b5cf6; }
  .status-btn.interview.active { background: #8b5cf6; color: #fff; }
  .status-btn.rejected { border-color: #ef4444; color: #ef4444; }
  .status-btn.rejected.active { background: #ef4444; color: #fff; }
  .status-btn:hover:not(.active) { opacity: 0.7; }

  .applied-job-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    flex-shrink: 0;
  }

  .applied-date {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .view-job-btn {
    padding: 8px 16px;
    background: var(--text-primary);
    color: var(--white);
    border-radius: var(--radius-sm);
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: var(--font-sans);
  }

  .view-job-btn:hover {
    background: var(--accent-hover);
    box-shadow: var(--shadow-sm);
  }

  /* ── STATES ── */
  .page-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 12px;
  }

  .state-icon { font-size: 2.8rem; opacity: 0.3; }

  .state-text { font-size: 0.92rem; color: var(--text-muted); text-align: center; max-width: 320px; line-height: 1.6; }

  .state-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .library-page-header { padding: 28px 16px 24px; }
    .library-body { padding: 20px 16px 48px; }
    .resume-card-top { padding: 20px; }
    .applied-list { padding: 12px 16px 20px; }
    .applied-toggle { padding: 16px 20px; }
    .skills-row { padding: 16px 20px; }
    .library-page-header-inner { flex-direction: column; align-items: flex-start; }
    .header-stat-row { flex-direction: row; }
    .header-stat { text-align: left; }
    .applied-job-row { grid-template-columns: 1fr; }
    .applied-job-right { align-items: flex-start; flex-direction: row; }
  }
`;

export default function ResumeLibrary() {
  const { appliedJobsRefreshTrigger, resumeUploadTrigger, activeTab } = useContext(AppliedJobsContext);
  const [resumes, setResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [expandedResumes, setExpandedResumes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllResumes(); }, []);
  useEffect(() => { if (resumeUploadTrigger > 0) fetchAllResumes(); }, [resumeUploadTrigger]);
  useEffect(() => {
    if (activeTab === "library" && expandedResumes.size > 0) {
      expandedResumes.forEach(id => fetchAppliedJobs(id, true));
    }
  }, [activeTab]);
  useEffect(() => {
    if (appliedJobsRefreshTrigger > 0) {
      expandedResumes.forEach(id => fetchAppliedJobs(id, true));
    }
  }, [appliedJobsRefreshTrigger]);

  const fetchAllResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/resume/all");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAppliedJobs = async (resumeId, force = false) => {
    if (appliedJobs[resumeId] && !force) return;
    try {
      const res = await fetch(`http://localhost:3001/api/applied-jobs/${resumeId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAppliedJobs(prev => ({ ...prev, [resumeId]: data.jobs || [] }));
    } catch (err) {
      console.error(err);
      setAppliedJobs(prev => ({ ...prev, [resumeId]: [] }));
    }
  };

  const toggleExpanded = (resumeId) => {
    const next = new Set(expandedResumes);
    if (next.has(resumeId)) { next.delete(resumeId); }
    else { next.add(resumeId); fetchAppliedJobs(resumeId); }
    setExpandedResumes(next);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const updateJobStatus = async (resumeId, jobId, status) => {
    try {
      const res = await fetch("http://localhost:3001/api/applied-jobs/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId, status })
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedJobs(prev => {
          const updated = { ...prev };
          if (updated[resumeId]) {
            updated[resumeId] = updated[resumeId].map(job =>
              job.jobId === jobId ? { ...job, status, statusUpdatedAt: data.job?.statusUpdatedAt || new Date().toISOString() } : job
            );
          }
          return updated;
        });
      }
    } catch (err) { console.error(err); }
  };

  // Count total applied jobs
  const totalApplied = Object.values(appliedJobs).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="library-page">
        <div className="page-center">
          <div className="state-spinner" />
          <div className="state-text">Loading your resume library…</div>
        </div>
      </div>
    </>
  );

  if (resumes.length === 0) return (
    <>
      <style>{styles}</style>
      <div className="library-page">
        <div className="library-page-header">
          <div className="library-page-header-inner">
            <div>
              <h1 className="library-page-title">Resume Library</h1>
              <p className="library-page-sub">All your uploaded resumes in one place</p>
            </div>
          </div>
        </div>
        <div className="page-center">
          <div className="state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div className="state-text">No resumes uploaded yet. Upload your first resume to get started!</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="library-page">
        <div className="library-page-header">
          <div className="library-page-header-inner">
            <div>
              <h1 className="library-page-title">Resume Library</h1>
              <p className="library-page-sub">Manage your uploaded resumes and track applications</p>
            </div>
            <div className="header-stat-row">
              <div className="header-stat">
                <div className="header-stat-num">{resumes.length}</div>
                <div className="header-stat-label">Resumes</div>
              </div>
              <div style={{ width: 1, background: "var(--border)", height: 36 }} />
              <div className="header-stat">
                <div className="header-stat-num">{totalApplied}</div>
                <div className="header-stat-label">Applications</div>
              </div>
            </div>
          </div>
        </div>

        <div className="library-body">
          <div className="resume-grid">
            {resumes.map((resume) => {
              const isExpanded = expandedResumes.has(resume._id);
              const jobs = appliedJobs[resume._id] || [];
              const skills = resume.extractedData?.skills || [];

              return (
                <div key={resume._id} className="resume-card">
                  {/* Top Row */}
                  <div className="resume-card-top">
                    <div className="resume-avatar">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                    <div className="resume-card-info">
                      <div className="resume-filename">{resume.filename}</div>
                      <div className="resume-meta-row">
                        <span className="resume-date">Uploaded {formatDate(resume.uploadedAt)}</span>
                        <span className="resume-level-badge">{resume.extractedData?.experience_level || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="resume-details-grid">
                    <div className="detail-cell">
                      <div className="detail-cell-label">Name</div>
                      <div className="detail-cell-value">{resume.extractedData?.name || "—"}</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-cell-label">Email</div>
                      <div className="detail-cell-value">{resume.extractedData?.email || "—"}</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-cell-label">Experience</div>
                      <div className="detail-cell-value">{resume.extractedData?.experience_years || 0} years</div>
                    </div>
                    <div className="detail-cell">
                      <div className="detail-cell-label">Primary Role</div>
                      <div className="detail-cell-value">{resume.extractedData?.primary_roles?.[0] || "—"}</div>
                    </div>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="skills-row">
                      <span className="skills-row-label">Skills</span>
                      <div className="skills-tags">
                        {skills.slice(0, 12).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                        {skills.length > 12 && (
                          <span className="skill-tag-more">+{skills.length - 12} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Applied Jobs Toggle */}
                  <div className="applied-section">
                    <div className="applied-toggle" onClick={() => toggleExpanded(resume._id)}>
                      <div className="applied-toggle-left">
                        <span className="applied-toggle-title">Applied Jobs</span>
                        {jobs.length > 0 && <span className="applied-count-pill">{jobs.length}</span>}
                      </div>
                      <span className={`chevron ${isExpanded ? "open" : ""}`}>▼</span>
                    </div>

                    {isExpanded && (
                      <div className="applied-list">
                        {jobs.length === 0 ? (
                          <div className="applied-empty">No applications yet for this resume.</div>
                        ) : (
                          jobs.map((job, idx) => (
                            <div key={idx} className="applied-job-row">
                              <div>
                                <div className="applied-job-title">{job.jobTitle}</div>
                                <div className="applied-job-company">{job.company}</div>
                                <div className="status-group">
                                  <div className="status-group-label">Application Status</div>
                                  <div className="status-buttons">
                                    {["applied", "shortlisted", "interview", "rejected"].map(s => (
                                      <button
                                        key={s}
                                        className={`status-btn ${s} ${job.status === s ? "active" : ""}`}
                                        onClick={() => updateJobStatus(resume._id, job.jobId, s)}
                                      >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="applied-job-right">
                                <span className="applied-date">{formatDate(job.appliedAt)}</span>
                                <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="view-job-btn">
                                  View Job →
                                </a>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}