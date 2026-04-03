import { useState, useEffect, useContext } from "react";
import { AppliedJobsContext } from "../App.jsx";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      const res = await fetch(`${API_URL}/api/resume/all`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAppliedJobs = async (resumeId, force = false) => {
    if (appliedJobs[resumeId] && !force) return;
    try {
      const res = await fetch(`${API_URL}/api/applied-jobs/${resumeId}`);
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
      const res = await fetch(`${API_URL}/api/applied-jobs/update-status`, {
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
    <div className="library-page">
      <div className="page-center">
        <div className="state-spinner" />
        <div className="state-text">Loading your resume library…</div>
      </div>
    </div>
  );

  if (resumes.length === 0) return (
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
  );

  return (
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
  );
}