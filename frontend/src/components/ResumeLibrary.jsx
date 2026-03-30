import { useState, useEffect } from "react";

const styles = `
  .library-root {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 2rem;
  }

  .library-header {
    margin-bottom: 32px;
  }

  .library-title {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111;
    margin-bottom: 8px;
  }

  .library-subtitle {
    font-size: 0.95rem;
    color: #666;
  }

  .resume-grid {
    display: grid;
    gap: 24px;
  }

  .resume-card {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.2s;
  }

  .resume-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .resume-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .resume-info {
    flex: 1;
  }

  .resume-filename {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 6px;
  }

  .resume-date {
    font-size: 0.82rem;
    color: #999;
  }

  .resume-badge {
    background: #f0f0eb;
    color: #666;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 100px;
    white-space: nowrap;
  }

  .resume-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .detail-item {
    background: #fafaf8;
    border: 1px solid #e8e8e3;
    border-radius: 10px;
    padding: 14px;
  }

  .detail-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 6px;
  }

  .detail-value {
    font-size: 0.88rem;
    font-weight: 500;
    color: #222;
  }

  .skills-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .skill-tag {
    background: #111;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 100px;
  }

  .applied-jobs-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e8e8e3;
  }

  .applied-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    cursor: pointer;
    user-select: none;
  }

  .applied-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .applied-count {
    background: #22c55e;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 100px;
  }

  .toggle-icon {
    font-size: 0.9rem;
    color: #666;
    transition: transform 0.2s;
  }

  .toggle-icon.open {
    transform: rotate(180deg);
  }

  .applied-jobs-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .applied-job-item {
    background: #f9f9f7;
    border: 1px solid #e8e8e3;
    border-radius: 10px;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .job-item-info {
    flex: 1;
  }

  .job-item-title {
    font-weight: 600;
    font-size: 0.88rem;
    color: #111;
    margin-bottom: 4px;
  }

  .job-item-company {
    font-size: 0.78rem;
    color: #666;
  }

  .job-item-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .job-item-date {
    font-size: 0.72rem;
    color: #999;
    white-space: nowrap;
  }

  .job-link-btn {
    padding: 8px 16px;
    background: #111;
    color: #fff;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .job-link-btn:hover {
    background: #333;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-text {
    font-size: 0.95rem;
    color: #888;
  }

  @media (max-width: 768px) {
    .library-root {
      padding: 24px 1rem;
    }
    .resume-details {
      grid-template-columns: 1fr;
    }
  }
`;

export default function ResumeLibrary() {
  const [resumes, setResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [expandedResumes, setExpandedResumes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllResumes();
  }, []);

  const fetchAllResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/resume/all");
      if (!res.ok) throw new Error("Failed to fetch resumes");
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async (resumeId) => {
    if (appliedJobs[resumeId]) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/applied-jobs/${resumeId}`);
      if (!res.ok) throw new Error("Failed to fetch applied jobs");
      const data = await res.json();
      setAppliedJobs(prev => ({ ...prev, [resumeId]: data.jobs || [] }));
    } catch (err) {
      console.error("Error fetching applied jobs:", err);
      setAppliedJobs(prev => ({ ...prev, [resumeId]: [] }));
    }
  };

  const toggleExpanded = (resumeId) => {
    const newExpanded = new Set(expandedResumes);
    if (newExpanded.has(resumeId)) {
      newExpanded.delete(resumeId);
    } else {
      newExpanded.add(resumeId);
      fetchAppliedJobs(resumeId);
    }
    setExpandedResumes(newExpanded);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="library-root">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading resumes...</div>
          </div>
        </div>
      </>
    );
  }

  if (resumes.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="library-root">
          <div className="library-header">
            <h1 className="library-title">Resume Library</h1>
            <p className="library-subtitle">All your uploaded resumes in one place</p>
          </div>
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-text">No resumes uploaded yet. Upload your first resume to get started!</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="library-root">
        <div className="library-header">
          <h1 className="library-title">Resume Library</h1>
          <p className="library-subtitle">{resumes.length} resume{resumes.length !== 1 ? "s" : ""} stored</p>
        </div>

        <div className="resume-grid">
          {resumes.map((resume) => {
            const isExpanded = expandedResumes.has(resume._id);
            const jobs = appliedJobs[resume._id] || [];
            
            return (
              <div key={resume._id} className="resume-card">
                <div className="resume-card-header">
                  <div className="resume-info">
                    <div className="resume-filename">{resume.filename}</div>
                    <div className="resume-date">Uploaded {formatDate(resume.uploadedAt)}</div>
                  </div>
                  <div className="resume-badge">
                    {resume.extractedData?.experience_level || "N/A"}
                  </div>
                </div>

                <div className="resume-details">
                  <div className="detail-item">
                    <div className="detail-label">Name</div>
                    <div className="detail-value">{resume.extractedData?.name || "—"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{resume.extractedData?.email || "—"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Experience</div>
                    <div className="detail-value">{resume.extractedData?.experience_years || 0} years</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Primary Role</div>
                    <div className="detail-value">
                      {resume.extractedData?.primary_roles?.[0] || "—"}
                    </div>
                  </div>
                </div>

                {resume.extractedData?.skills && resume.extractedData.skills.length > 0 && (
                  <div className="detail-item">
                    <div className="detail-label">Skills ({resume.extractedData.skills.length})</div>
                    <div className="skills-tags">
                      {resume.extractedData.skills.slice(0, 10).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                      {resume.extractedData.skills.length > 10 && (
                        <span className="skill-tag">+{resume.extractedData.skills.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="applied-jobs-section">
                  <div className="applied-header" onClick={() => toggleExpanded(resume._id)}>
                    <div className="applied-title">
                      Applied Jobs
                      {jobs.length > 0 && <span className="applied-count">{jobs.length}</span>}
                    </div>
                    <span className={`toggle-icon ${isExpanded ? "open" : ""}`}>▼</span>
                  </div>

                  {isExpanded && (
                    <div className="applied-jobs-list">
                      {jobs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "0.85rem" }}>
                          No jobs applied yet
                        </div>
                      ) : (
                        jobs.map((job, idx) => (
                          <div key={idx} className="applied-job-item">
                            <div className="job-item-info">
                              <div className="job-item-title">{job.jobTitle}</div>
                              <div className="job-item-company">{job.company}</div>
                            </div>
                            <div className="job-item-actions">
                              <div className="job-item-date">{formatDate(job.appliedAt)}</div>
                              <a 
                                href={job.jobUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="job-link-btn"
                              >
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
    </>
  );
}
