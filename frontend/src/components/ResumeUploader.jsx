import { useState, useRef, useCallback, useContext, useEffect } from "react";
import { AppliedJobsContext } from "../App.jsx";

const styles = `
  /* ── PAGE ── */
  .uploader-page {
    min-height: calc(100vh - 68px);
    background: var(--bg);
    width: 100%;
  }

  /* ── HERO ── */
  .hero-section {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 72px 40px 64px;
    width: 100%;
  }

  .hero-inner {
    max-width: 960px;
    margin: 0 auto;
    text-align: center;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #15803d;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 100px;
    margin-bottom: 28px;
  }

  .hero-eyebrow-dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
    50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
  }

  .hero-title {
    font-family: var(--font-sans);
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.1;
    color: var(--text-primary);
    margin-bottom: 20px;
  }

  .hero-title em {
    font-style: italic;
    font-family: var(--font-serif);
    font-weight: 400;
    color: #2563eb;
    font-size: 1.08em;
  }

  .hero-desc {
    font-size: 1.05rem;
    color: var(--text-secondary);
    line-height: 1.75;
    font-weight: 400;
    max-width: 560px;
    margin: 0 auto;
  }

  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid var(--border-light);
  }

  .hero-stat {
    text-align: center;
  }

  .hero-stat-num {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    line-height: 1;
  }

  .hero-stat-label {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 4px;
    font-weight: 500;
  }

  .hero-stat-divider {
    width: 1px;
    background: var(--border);
    align-self: stretch;
  }

  /* ── MAIN CONTENT ── */
  .uploader-body {
    width: 100%;
    padding: 40px 40px 64px;
  }

  .uploader-body-inner {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* ── UPLOAD CARD ── */
  .upload-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 40px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 32px;
  }

  .upload-card-header {
    margin-bottom: 24px;
  }

  .upload-card-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }

  .upload-card-subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .upload-zone {
    border: 2px dashed #d4d4d0;
    border-radius: var(--radius-lg);
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.22s ease;
    background: var(--bg);
    position: relative;
  }

  .upload-zone:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .upload-zone.has-file {
    border-color: #16a34a;
    background: #f0fdf4;
  }

  .upload-icon-wrap {
    width: 60px;
    height: 60px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin: 0 auto 16px;
    box-shadow: var(--shadow-sm);
  }

  .upload-zone.has-file .upload-icon-wrap {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }

  .upload-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  .upload-hint {
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .upload-filename {
    font-size: 0.88rem;
    font-weight: 600;
    color: #15803d;
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .upload-formats {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }

  .format-tag {
    background: var(--white);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .btn-analyse {
    width: 100%;
    margin-top: 20px;
    padding: 16px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--text-primary);
    color: var(--white);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .btn-analyse:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .btn-analyse:disabled {
    background: #d4d4d0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .msg-box {
    margin-top: 16px;
    padding: 14px 18px;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .msg-box.success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #15803d;
  }

  .msg-box.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  /* ── TWO COLUMN LAYOUT ── */
  .content-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: start;
  }

  /* ── ANALYSIS PANEL ── */
  .analysis-panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 88px;
  }

  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .panel-header-icon {
    width: 32px;
    height: 32px;
    background: var(--text-primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: white;
  }

  .panel-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .panel-body {
    padding: 20px 24px;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border-light);
  }

  .detail-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .detail-row:first-child {
    padding-top: 0;
  }

  .detail-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .detail-value {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.5;
  }

  .keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .kw-tag {
    background: var(--text-primary);
    color: var(--white);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 100px;
    letter-spacing: 0.01em;
  }

  /* ── JOBS SECTION ── */
  .jobs-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .jobs-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 20px 28px;
    box-shadow: var(--shadow-sm);
  }

  .jobs-section-title {
    font-weight: 900;
    font-size: 1.25rem;
    letter-spacing: -0.03em;
    color: var(--text-primary);
  }

  .jobs-section-title span {
    color: var(--text-muted);
    font-weight: 900;
    font-size: 0.9rem;
  }

  .jobs-meta-line {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-top: 3px;
  }

  .btn-refresh {
    padding: 9px 18px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-sans);
  }

  .btn-refresh:hover {
    background: var(--white);
    border-color: #bbb;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
  }

  /* ── SCORE DISTRIBUTION ── */
  .dist-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  .dist-item {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px 12px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.15s;
  }

  .dist-item:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .dist-num {
    font-family: var(--font-sans);
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 4px;
  }

  .dist-num.green { color: #16a34a; }
  .dist-num.blue { color: #2563eb; }
  .dist-num.yellow { color: #ca8a04; }
  .dist-num.orange { color: #ea580c; }
  .dist-num.gray { color: #6b7280; }

  .dist-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* ── JOB CARDS GRID ── */
  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .job-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 24px;
    transition: all 0.22s ease;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .job-card:hover {
    border-color: #c7c7c4;
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .job-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
  }

  .company-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .company-logo {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    border: 1px solid var(--border-light);
    flex-shrink: 0;
  }

  .company-name {
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 130px;
  }

  .company-source {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 1px;
  }

  .score-badge {
    font-size: 0.74rem;
    font-weight: 700;
    padding: 5px 11px;
    border-radius: 100px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .score-excellent { background: #dcfce7; color: #15803d; }
  .score-great { background: #dbeafe; color: #1d4ed8; }
  .score-good { background: #fef9c3; color: #854d0e; }
  .score-fair { background: #ffedd5; color: #c2410c; }
  .score-low { background: #f3f4f6; color: #4b5563; }

  .job-title {
    font-weight: 700;
    font-size: 0.98rem;
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    letter-spacing: -0.01em;
  }

  .job-location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  .spacer { flex: 1; }

  .job-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn-apply {
    display: block;
    width: 100%;
    text-align: center;
    padding: 12px;
    background: var(--text-primary);
    color: var(--white);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 0.85rem;
    text-decoration: none;
    transition: all 0.18s ease;
    letter-spacing: -0.01em;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
  }

  .btn-apply:hover {
    background: var(--accent-hover);
    box-shadow: var(--shadow-md);
  }

  .btn-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    text-align: center;
    padding: 11px;
    background: var(--white);
    color: var(--text-secondary);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.18s ease;
    cursor: pointer;
    font-family: var(--font-sans);
  }

  .btn-mark:hover {
    border-color: var(--text-primary);
    color: var(--text-primary);
    background: var(--bg);
  }

  .btn-mark.applied-state {
    background: #f0fdf4;
    border-color: #16a34a;
    color: #15803d;
    font-weight: 700;
  }

  .btn-mark.applied-state:hover {
    background: #dcfce7;
  }

  /* ── LOADING ── */
  .loading-block {
    text-align: center;
    padding: 80px 0;
  }

  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .dot {
    width: 9px;
    height: 9px;
    background: var(--text-primary);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes bounce {
    0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }

  .loading-text {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  /* ── PAGINATION ── */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    margin-top: 32px;
  }

  .pg-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--white);
    font-size: 0.83rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-sans);
  }

  .pg-btn:hover:not(:disabled) {
    border-color: var(--text-primary);
    color: var(--text-primary);
    background: var(--bg);
  }

  .pg-btn.active {
    background: var(--text-primary);
    color: var(--white);
    border-color: var(--text-primary);
  }

  .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .pg-btn.wide { width: auto; padding: 0 14px; }

  /* ── EMPTY ── */
  .empty-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    text-align: center;
    padding: 72px 24px;
    box-shadow: var(--shadow-sm);
  }

  .empty-icon { font-size: 2.8rem; opacity: 0.35; margin-bottom: 16px; }
  .empty-text { font-size: 0.92rem; color: var(--text-muted); line-height: 1.6; }

  /* ── FULL WIDTH (no analysis yet) ── */
  .full-width-upload {
    max-width: 640px;
    margin: 0 auto;
  }

  @media (max-width: 1100px) {
    .content-grid { grid-template-columns: 1fr; }
    .analysis-panel { position: static; }
    .dist-strip { grid-template-columns: repeat(5, 1fr); }
  }

  @media (max-width: 768px) {
    .uploader-body { padding: 24px 16px 48px; }
    .hero-section { padding: 48px 16px 40px; }
    .hero-stats { gap: 20px; }
    .jobs-grid { grid-template-columns: 1fr; }
    .dist-strip { grid-template-columns: repeat(3, 1fr); }
    .upload-card { padding: 24px; }
  }
`;

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
      const res = await fetch("http://localhost:3001/api/applied-jobs/check", {
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
      const res = await fetch("http://localhost:3001/api/applied-jobs/mark-applied", {
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
      const res = await fetch("http://localhost:3001/api/applied-jobs/unmark-applied", {
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
      const res = await fetch(`http://localhost:3001/api/resume/jobs?page=${page}&limit=12`);
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
      const res = await fetch(`http://localhost:3001/api/resume/jobs?page=${page}&limit=12`);
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
      const res = await fetch("http://localhost:3001/api/resume/upload", { method: "POST", body: formData });
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
    <>
      <style>{styles}</style>
      <div className="uploader-page">

        {/* HERO */}
        <div className="hero-section">
          <div className="hero-inner">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Powered by AI Resume Analysis
            </div>
            <h1 className="hero-title">Find jobs that actually <em>fit you</em></h1>
            <p className="hero-desc">Upload your resume and let our AI match you to thousands of curated roles — ranked by how well they align with your experience.</p>
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
                <div className="hero-stat-num">AI</div>
                <div className="hero-stat-label">Powered Matching</div>
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
    </>
  );
}