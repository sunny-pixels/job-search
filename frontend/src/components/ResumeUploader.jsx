import { useState, useRef, useCallback, useContext, useEffect } from "react";
import { AppliedJobsContext } from "../App.jsx";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ResumeUploader() {
  const { triggerAppliedJobsRefresh, triggerResumeUpload } = useContext(AppliedJobsContext);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [resumeId, setResumeId] = useState(null);
  const [savedFileName, setSavedFileName] = useState(null);

  const pageCache = useRef({});
  const prefetchingPages = useRef(new Set());

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('resumeUploaderState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('Loading saved state:', parsed); // Debug log
        if (parsed.analysis) setAnalysis(parsed.analysis);
        if (parsed.resumeId) setResumeId(parsed.resumeId);
        if (parsed.jobs && Array.isArray(parsed.jobs)) setJobs(parsed.jobs);
        if (parsed.pagination) setPagination(parsed.pagination);
        if (parsed.scoreDistribution) setScoreDistribution(parsed.scoreDistribution);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
        if (parsed.appliedJobs && Array.isArray(parsed.appliedJobs)) {
          setAppliedJobs(new Set(parsed.appliedJobs));
        }
        if (parsed.fileName) {
          console.log('Restoring filename:', parsed.fileName); // Debug log
          setSavedFileName(parsed.fileName);
        }
      }
    } catch (err) {
      console.error("Failed to load saved state:", err);
      localStorage.removeItem('resumeUploaderState');
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (analysis || jobs.length > 0) {
      try {
        const stateToSave = {
          analysis,
          resumeId,
          jobs: jobs.slice(0, 50),
          pagination,
          scoreDistribution,
          currentPage,
          appliedJobs: Array.from(appliedJobs),
          fileName: file?.name || savedFileName || null
        };
        localStorage.setItem('resumeUploaderState', JSON.stringify(stateToSave));
      } catch (err) {
        console.error("Failed to save state:", err);
      }
    }
  }, [analysis, resumeId, jobs, pagination, scoreDistribution, currentPage, appliedJobs, file, savedFileName]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const checkAppliedStatus = useCallback(async () => {
    if (!resumeId || jobs.length === 0) return;
    const jobIds = jobs.map(job => `${job.company}_${job.title}_${job.location}`);
    try {
      const res = await fetch(`${API_URL}/api/applied-jobs/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobIds })
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedJobs(new Set(data.appliedJobIds));
      }
    } catch (err) {
      console.error("Failed to check applied status:", err);
    }
  }, [resumeId, jobs]);

  const markAsApplied = async (job) => {
    if (!resumeId) return;
    const jobId = `${job.company}_${job.title}_${job.location}`;
    try {
      const res = await fetch(`${API_URL}/api/applied-jobs/mark-applied`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId, jobTitle: job.title, company: job.company, jobUrl: job.job_url })
      });
      if (res.ok) {
        setAppliedJobs(prev => new Set([...prev, jobId]));
        triggerAppliedJobsRefresh();
      }
    } catch (err) { console.error(err); }
  };

  const unmarkAsApplied = async (job) => {
    if (!resumeId) return;
    const jobId = `${job.company}_${job.title}_${job.location}`;
    try {
      const res = await fetch(`${API_URL}/api/applied-jobs/unmark-applied`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId })
      });
      if (res.ok) {
        setAppliedJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
        triggerAppliedJobsRefresh();
      }
    } catch (err) { console.error(err); }
  };

  const prefetchPage = useCallback(async (page) => {
    if (pageCache.current[page] || prefetchingPages.current.has(page)) return;
    prefetchingPages.current.add(page);
    try {
      const res = await fetch(`${API_URL}/api/resume/jobs?page=${page}&limit=12`);
      if (!res.ok) return;
      const data = await res.json();
      pageCache.current[page] = { jobs: data.jobs || [], pagination: data.pagination, scoreDistribution: data.score_distribution };
    } catch {} finally { prefetchingPages.current.delete(page); }
  }, []);

  const showPage = useCallback(async (page, showLoader = true) => {
    setCurrentPage(page);
    if (pageCache.current[page]) {
      const cached = pageCache.current[page];
      setJobs(cached.jobs);
      setPagination(cached.pagination);
      setScoreDistribution(cached.scoreDistribution);
      setTimeout(() => prefetchPage(page + 1), 200);
      setTimeout(() => prefetchPage(page - 1), 400);
      return;
    }
    if (showLoader) setLoadingJobs(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/jobs?page=${page}&limit=12`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      const entry = { jobs: data.jobs || [], pagination: data.pagination, scoreDistribution: data.score_distribution };
      pageCache.current[page] = entry;
      setJobs(entry.jobs);
      setPagination(entry.pagination);
      setScoreDistribution(entry.scoreDistribution);
      if (entry.jobs.length) setTimeout(() => document.getElementById("jobs-anchor")?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => prefetchPage(page + 1), 300);
      setTimeout(() => prefetchPage(page - 1), 600);
    } catch (err) { console.error(err); }
    finally { if (showLoader) setLoadingJobs(false); }
  }, [prefetchPage]);

  const fetchMatchingJobs = useCallback(async (page = 1) => {
    pageCache.current = {};
    prefetchingPages.current.clear();
    await showPage(page, true);
    if (resumeId) checkAppliedStatus();
  }, [showPage, resumeId]);

  const handlePageChange = useCallback(async (page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    await showPage(page, true);
    if (resumeId) checkAppliedStatus();
  }, [showPage, resumeId]);

  const handleUpload = async () => {
    if (!file) { setMessage({ text: "Please select a file first.", type: "error" }); return; }
    setLoading(true);
    setMessage({ text: "", type: "" });
    setAnalysis(null);
    setJobs([]);
    // Don't clear savedFileName here - let it be updated when file is uploaded
    pageCache.current = {};
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      setMessage({ text: "Resume analysed successfully!", type: "success" });
      setAnalysis(data.analysis);
      setResumeId(data._id);
      setSavedFileName(file.name); // Save the filename immediately after successful upload
      fetchMatchingJobs();
      triggerResumeUpload();
    } catch (err) {
      setMessage({ text: `Upload failed: ${err.message}`, type: "error" });
    } finally { setLoading(false); }
  };

  const getScoreClass = (s) => s >= 90 ? "score-excellent" : s >= 80 ? "score-great" : s >= 70 ? "score-good" : s >= 60 ? "score-fair" : "score-low";
  const getScoreLabel = (s) => s >= 90 ? "Excellent" : s >= 80 ? "Great" : s >= 70 ? "Good" : s >= 60 ? "Fair" : "Low";
  const getCompanyLogo = (company) => `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=f5f5f3&color=0f0f0f&size=80&bold=true&font-size=0.45`;

  const renderPageNumbers = () => {
    if (!pagination) return null;
    const total = pagination.total_pages;
    const pages = [];
    for (let i = 1; i <= Math.min(total, 10); i++) {
      const show = i <= 2 || i > total - 2 || Math.abs(i - currentPage) <= 1;
      if (!show && i === 3) { pages.push(<span key="el" style={{ padding: "0 4px", color: "#bbb", display: "flex", alignItems: "center" }}>…</span>); continue; }
      if (!show) continue;
      pages.push(<button key={i} className={`pg-btn ${currentPage === i ? "active" : ""}`} onClick={() => handlePageChange(i)}>{i}</button>);
    }
    return pages;
  };

  return (
    <div className="uploader-page">

        {/* HERO */}
        <div className="hero-section">
          <div className="hero-inner">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Smart Resume Matching
            </div>
            <h1 className="hero-title">Find jobs that actually <em>fit you</em></h1>
            <p className="hero-desc">Upload your resume and let our Software match you to thousands of curated roles — ranked by how well they align with your experience.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-num">10K+</div>
                <div className="hero-stat-label">Active Jobs</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-num">500+</div>
                <div className="hero-stat-label">Companies</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-num">&lt;30s</div>
                <div className="hero-stat-label">Get Results</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="uploader-body">
          <div className="uploader-body-inner">
            {!analysis ? (
              <div className="full-width-upload">
                <div className="upload-card">
                  <div className="upload-card-header">
                    <div className="upload-card-title">Upload Your Resume</div>
                    <div className="upload-card-subtitle">PDF, DOC or DOCX format supported</div>
                  </div>
                  <div className={`upload-zone ${file ? "has-file" : ""}`}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="file-input" />
                    <div className="upload-icon-wrap">
                      {file ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      )}
                    </div>
                    <div className="upload-title">{file ? "File ready" : "Drop your resume here"}</div>
                    {file ? (
                      <div className="upload-filename">📎 {file.name}</div>
                    ) : (
                      <>
                        <div className="upload-hint">Click to browse or drag & drop</div>
                        <div className="upload-formats">
                          <span className="format-tag">PDF</span>
                          <span className="format-tag">DOC</span>
                          <span className="format-tag">DOCX</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button className="btn-analyse" onClick={handleUpload} disabled={loading}>
                    {loading ? (<><div className="spinner" /><span>Analysing your resume…</span></>) : (<span>Analyse & Find Matches →</span>)}
                  </button>
                  {message.text && (
                    <div className={`msg-box ${message.type}`}>
                      {message.type === "error" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      )}{message.text}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="content-grid">
                {/* LEFT: Upload + Analysis */}
                <div>
                  <div className="upload-card">
                    <div className="upload-card-header">
                      <div className="upload-card-title">Upload Resume</div>
                    </div>
                    <div className={`upload-zone ${file ? "has-file" : ""}`}>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="file-input" />
                      <div className="upload-icon-wrap">
                        {file ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                          </svg>
                        )}
                      </div>
                      <div className="upload-title">{file ? "File ready" : "Upload a new resume"}</div>
                      {file && <div className="upload-filename">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                        </svg>
                        {file.name}
                      </div>}
                    </div>
                    <button className="btn-analyse" onClick={handleUpload} disabled={loading}>
                      {loading ? (<><div className="spinner" /><span>Analysing…</span></>) : (<span>Analyse & Find Matches →</span>)}
                    </button>
                    {message.text && (
                      <div className={`msg-box ${message.type}`}>
                        {message.type === "error" ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        )}{message.text}
                      </div>
                    )}
                  </div>

                  {/* Analysis Panel */}
                  <div style={{ marginTop: 20 }}>
                    <div className="analysis-panel">
                      <div className="panel-header">
                        <div className="panel-header-icon">✦</div>
                        <div className="panel-title">Resume Insights</div>
                      </div>
                      <div className="panel-body">
                        {(file?.name || savedFileName || analysis?.fileName) && (
                          <div className="detail-row">
                            <div className="detail-label">Resume File</div>
                            <div className="detail-value" style={{ color: '#16a34a', fontWeight: 600 }}>
                              {file?.name || savedFileName || analysis?.fileName || 'Resume File'}
                            </div>
                          </div>
                        )}
                        <div className="detail-row">
                          <div className="detail-label">Primary Roles</div>
                          <div className="detail-value">{analysis.primary_roles.join(", ")}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Experience</div>
                          <div className="detail-value">{analysis.experience_level} · {analysis.experience_years} years</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Languages</div>
                          <div className="detail-value">{analysis.programming_languages.join(", ") || "—"}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Frameworks</div>
                          <div className="detail-value">{analysis.frameworks.join(", ") || "—"}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Keywords ({analysis.job_keywords.length})</div>
                          <div className="keyword-cloud">
                            {analysis.job_keywords.map((k, i) => <span key={i} className="kw-tag">{k}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Jobs */}
                <div className="jobs-panel" id="jobs-anchor">
                  {loadingJobs && (
                    <div className="loading-block">
                      <div className="loading-dots">
                        <div className="dot" /><div className="dot" /><div className="dot" />
                      </div>
                      <div className="loading-text">Searching for your best matches…</div>
                    </div>
                  )}

                  {!loadingJobs && jobs.length > 0 && (
                    <>
                      <div className="jobs-section-header">
                        <div>
                          <div className="jobs-section-title">
                            Matched Roles <span>({pagination?.total_jobs || jobs.length} found)</span>
                          </div>
                          {pagination && (
                            <div className="jobs-meta-line">
                              Page {pagination.current_page} of {pagination.total_pages} · Sorted by match score
                            </div>
                          )}
                        </div>
                        {/* <button className="btn-refresh" onClick={() => fetchMatchingJobs(1)}>
                          ↻ Refresh
                        </button> */}
                      </div>

                      {scoreDistribution && (
                        <div className="dist-strip">
                          <div className="dist-item"><div className="dist-num green">{scoreDistribution.excellent}</div><div className="dist-label">90–100%</div></div>
                          <div className="dist-item"><div className="dist-num blue">{scoreDistribution.great}</div><div className="dist-label">80–89%</div></div>
                          <div className="dist-item"><div className="dist-num yellow">{scoreDistribution.good}</div><div className="dist-label">70–79%</div></div>
                          <div className="dist-item"><div className="dist-num orange">{scoreDistribution.fair}</div><div className="dist-label">60–69%</div></div>
                          <div className="dist-item"><div className="dist-num gray">{scoreDistribution.low}</div><div className="dist-label">&lt;60%</div></div>
                        </div>
                      )}

                      <div className="jobs-grid">
                        {jobs.map((job, idx) => {
                          const jobId = `${job.company}_${job.title}_${job.location}`;
                          const isApplied = appliedJobs.has(jobId);
                          return (
                            <div key={idx} className="job-card">
                              <div className="job-card-top">
                                <div className="company-row">
                                  <img src={getCompanyLogo(job.company)} alt={job.company} className="company-logo" />
                                  <div>
                                    <div className="company-name">{job.company}</div>
                                    <div className="company-source">{job.source}</div>
                                  </div>
                                </div>
                                <span className={`score-badge ${getScoreClass(job.match_score)}`}>
                                  {job.match_score}% {getScoreLabel(job.match_score)}
                                </span>
                              </div>

                              <div className="job-title">{job.title}</div>

                              <div className="job-location">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span>{job.location || "Location N/A"}</span>
                              </div>

                              <div className="spacer" />

                              <div className="job-actions">
                                <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="btn-apply">
                                  Apply Now →
                                </a>
                                {isApplied ? (
                                  <button className="btn-mark applied-state" onClick={() => unmarkAsApplied(job)} title="Click to undo">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20,6 9,17 4,12"/>
                                    </svg>
                                    <span>Applied — Undo</span>
                                  </button>
                                ) : (
                                  <button className="btn-mark" onClick={() => markAsApplied(job)}>
                                    <span>Mark as Applied</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {pagination && pagination.total_pages > 1 && (
                        <div className="pagination">
                          <button className="pg-btn wide" disabled={!pagination.has_prev} onClick={() => handlePageChange(currentPage - 1)}>← Prev</button>
                          {renderPageNumbers()}
                          <button className="pg-btn wide" disabled={!pagination.has_next} onClick={() => handlePageChange(currentPage + 1)}>Next →</button>
                        </div>
                      )}
                    </>
                  )}

                  {!loadingJobs && jobs.length === 0 && analysis && (
                    <div className="empty-card">
                      <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                      </div>
                      <div className="empty-text">No matching jobs found right now. Try uploading a different resume or check back later.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
  );
}