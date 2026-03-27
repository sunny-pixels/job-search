import { useState, useRef, useCallback } from "react";

const GOOGLE_FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
`;

const styles = `
  ${GOOGLE_FONTS}

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #f9f9f7;
    color: #111;
  }

  .page-root {
    min-height: 100vh;
    background: #f9f9f7;
  }

  /* ── NAV ── */
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(249,249,247,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid #e8e8e3;
    padding: 0 2rem;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.02em;
    color: #111;
  }
  .nav-logo-dot {
    width: 28px;
    height: 28px;
    background: #111;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-logo-dot svg { fill: #f9f9f7; }
  .nav-pill {
    background: #111;
    color: #f9f9f7;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
  }

  /* ── HERO ── */
  .hero {
    max-width: 860px;
    margin: 0 auto;
    padding: 80px 2rem 60px;
    text-align: center;
  }
  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #fff;
    border: 1px solid #e0e0d8;
    border-radius: 100px;
    padding: 6px 16px 6px 10px;
    font-size: 0.78rem;
    font-weight: 500;
    color: #555;
    margin-bottom: 28px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .hero-tag-dot {
    width: 6px; height: 6px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse-green 2s infinite;
  }
  @keyframes pulse-green {
    0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
    50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  }
  .hero h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.4rem, 5vw, 3.8rem);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.04em;
    color: #111;
    margin-bottom: 18px;
  }
  .hero h1 em {
    font-style: normal;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero p {
    font-size: 1.05rem;
    color: #666;
    line-height: 1.7;
    font-weight: 300;
    max-width: 540px;
    margin: 0 auto;
  }

  /* ── UPLOAD CARD ── */
  .card {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 20px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  }
  .upload-wrap {
    max-width: 700px;
    margin: 0 auto 64px;
    padding: 0 2rem;
  }
  .upload-card {
    padding: 36px;
  }
  .upload-zone {
    border: 2px dashed #d4d4cc;
    border-radius: 14px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafaf8;
    position: relative;
  }
  .upload-zone:hover {
    border-color: #6366f1;
    background: #f5f5ff;
  }
  .upload-zone.has-file {
    border-color: #22c55e;
    background: #f0fdf4;
  }
  .upload-icon {
    width: 52px; height: 52px;
    margin: 0 auto 14px;
    background: #f0f0eb;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  .upload-zone.has-file .upload-icon { background: #dcfce7; }
  .upload-label {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #222;
    margin-bottom: 6px;
  }
  .upload-sub {
    font-size: 0.82rem;
    color: #999;
  }
  .file-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #16a34a;
    margin-top: 8px;
  }
  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
  .btn-primary {
    width: 100%;
    margin-top: 20px;
    padding: 15px;
    border-radius: 12px;
    border: none;
    background: #111;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-primary:hover:not(:disabled) {
    background: #2d2d2d;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .success-msg {
    margin-top: 16px;
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    text-align: center;
    font-size: 0.88rem;
    font-weight: 500;
    color: #15803d;
  }
  .error-msg {
    margin-top: 16px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    text-align: center;
    font-size: 0.88rem;
    font-weight: 500;
    color: #dc2626;
  }

  /* ── ANALYSIS ── */
  .section-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem 64px;
  }
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .analysis-card {
    padding: 32px;
  }
  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .analysis-chip {
    background: #fafaf8;
    border: 1px solid #e8e8e3;
    border-radius: 14px;
    padding: 18px 20px;
  }
  .analysis-chip-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 8px;
  }
  .analysis-chip-value {
    font-size: 0.92rem;
    font-weight: 500;
    color: #222;
    line-height: 1.5;
  }
  .analysis-chip.wide { grid-column: 1 / -1; }
  .keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .kw-tag {
    background: #111;
    color: #f9f9f7;
    font-size: 0.77rem;
    font-weight: 500;
    padding: 5px 13px;
    border-radius: 100px;
  }

  /* ── DIST STRIP ── */
  .dist-strip {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .dist-item {
    flex: 1;
    min-width: 80px;
    background: #fafaf8;
    border: 1px solid #e8e8e3;
    border-radius: 12px;
    padding: 14px 12px;
    text-align: center;
  }
  .dist-num {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1;
  }
  .dist-num.green { color: #16a34a; }
  .dist-num.blue { color: #2563eb; }
  .dist-num.yellow { color: #ca8a04; }
  .dist-num.orange { color: #ea580c; }
  .dist-num.gray { color: #6b7280; }
  .dist-label {
    font-size: 0.72rem;
    color: #999;
    margin-top: 4px;
  }

  /* ── JOB CARDS ── */
  .jobs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .jobs-meta {
    font-size: 0.82rem;
    color: #888;
    margin-bottom: 24px;
  }
  .btn-ghost {
    padding: 8px 18px;
    background: #fafaf8;
    border: 1px solid #e0e0d8;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .btn-ghost:hover { background: #f0f0eb; border-color: #ccc; }
  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    align-items: stretch;
  }
  .job-card {
    background: #fff;
    border: 1px solid #e8e8e3;
    border-radius: 18px;
    padding: 28px;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .job-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 18px;
    border: 1.5px solid transparent;
    transition: border-color 0.25s;
    pointer-events: none;
  }
  .job-card:hover {
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    transform: translateY(-3px);
  }
  .job-card:hover::before { border-color: #6366f1; }

  .job-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .company-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .company-logo {
    width: 44px; height: 44px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid #f0f0eb;
  }
  .company-name {
    font-weight: 600;
    font-size: 0.88rem;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  .company-source {
    font-size: 0.72rem;
    color: #aaa;
  }
  .score-badge {
    font-family: 'Syne', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 100px;
    white-space: nowrap;
  }
  .score-excellent { background: #dcfce7; color: #15803d; }
  .score-great { background: #dbeafe; color: #1d4ed8; }
  .score-good { background: #fef9c3; color: #854d0e; }
  .score-fair { background: #ffedd5; color: #c2410c; }
  .score-low { background: #f3f4f6; color: #4b5563; }

  .job-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111;
    line-height: 1.35;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.6rem;
    max-height: 2.6rem;
  }
  .job-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 18px;
  }
  .job-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta-icon { font-size: 0.85rem; }
  .btn-apply {
    display: block;
    width: 100%;
    text-align: center;
    padding: 13px;
    background: #111;
    color: #fff;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.88rem;
    text-decoration: none;
    transition: all 0.2s;
    letter-spacing: 0.01em;
    margin-top: auto;
  }
  .btn-apply:hover {
    background: #333;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }

  /* ── LOADING ── */
  .loading-state {
    text-align: center;
    padding: 80px 0;
  }
  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  .loading-dot {
    width: 10px; height: 10px;
    background: #111;
    border-radius: 50%;
    animation: bounce-dot 1.2s infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce-dot {
    0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  .loading-text {
    font-size: 0.95rem;
    color: #888;
    font-weight: 400;
  }

  /* ── PAGINATION ── */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 40px;
  }
  .page-btn {
    width: 36px; height: 36px;
    border-radius: 9px;
    border: 1px solid #e0e0d8;
    background: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
  }
  .page-btn:hover:not(:disabled) { border-color: #111; color: #111; }
  .page-btn.active { background: #111; color: #fff; border-color: #111; }
  .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .page-btn.wide { width: auto; padding: 0 14px; font-size: 0.82rem; }

  /* ── EMPTY ── */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
  }
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  .empty-text {
    font-size: 0.95rem;
    color: #888;
    max-width: 320px;
    margin: 0 auto;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .nav { padding: 0 1rem; }
    .hero { padding: 48px 1rem 40px; }
    .upload-wrap, .section-wrap { padding: 0 1rem 48px; }
    .upload-card, .analysis-card { padding: 22px; }
  }
`;

export default function ResumeUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Stable ref-based page cache — survives re-renders, no stale closure issues
  const pageCache = useRef({});
  const prefetchingPages = useRef(new Set());

  const handleFileChange = (e) => setFile(e.target.files[0]);

  // Silently prefetch a page into cache without affecting UI
  const prefetchPage = useCallback(async (page) => {
    if (pageCache.current[page] || prefetchingPages.current.has(page)) return;
    prefetchingPages.current.add(page);
    try {
      const res = await fetch(`http://localhost:3001/api/resume/jobs?page=${page}&limit=12`);
      if (!res.ok) return;
      const data = await res.json();
      pageCache.current[page] = {
        jobs: data.jobs || [],
        pagination: data.pagination,
        scoreDistribution: data.score_distribution
      };
    } catch {
      // silent fail
    } finally {
      prefetchingPages.current.delete(page);
    }
  }, []);

  // Display a page — from cache if available, else fetch and show
  const showPage = useCallback(async (page, showLoader = true) => {
    setCurrentPage(page);

    // Instant from cache
    if (pageCache.current[page]) {
      const cached = pageCache.current[page];
      setJobs(cached.jobs);
      setPagination(cached.pagination);
      setScoreDistribution(cached.scoreDistribution);
      // Prefetch adjacent pages
      setTimeout(() => prefetchPage(page + 1), 200);
      setTimeout(() => prefetchPage(page - 1), 400);
      return;
    }

    // Not cached — fetch and display
    if (showLoader) setLoadingJobs(true);
    try {
      const res = await fetch(`http://localhost:3001/api/resume/jobs?page=${page}&limit=12`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();

      const entry = {
        jobs: data.jobs || [],
        pagination: data.pagination,
        scoreDistribution: data.score_distribution
      };
      pageCache.current[page] = entry;

      setJobs(entry.jobs);
      setPagination(entry.pagination);
      setScoreDistribution(entry.scoreDistribution);

      if (entry.jobs.length) {
        setTimeout(() => document.getElementById("jobs-section")?.scrollIntoView({ behavior: "smooth" }), 100);
      }

      // Prefetch next + prev in background
      setTimeout(() => prefetchPage(page + 1), 300);
      setTimeout(() => prefetchPage(page - 1), 600);

    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoadingJobs(false);
    }
  }, [prefetchPage]);

  const fetchMatchingJobs = useCallback(async (page = 1) => {
    // Clear cache on fresh fetch
    pageCache.current = {};
    prefetchingPages.current.clear();
    await showPage(page, true);
  }, [showPage]);

  const handlePageChange = useCallback(async (page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    await showPage(page, true);
  }, [showPage]);

  const handleUpload = async () => {
    if (!file) { setMessage({ text: "Please select a file first.", type: "error" }); return; }
    setLoading(true);
    setMessage({ text: "", type: "" });
    setAnalysis(null);
    setJobs([]);
    pageCache.current = {};
    prefetchingPages.current.clear();
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("http://localhost:3001/api/resume/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      setMessage({ text: "Resume analysed successfully!", type: "success" });
      setAnalysis(data.analysis);
      fetchMatchingJobs();
    } catch (err) {
      setMessage({ text: `Upload failed: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (s) => {
    if (s >= 90) return "score-excellent";
    if (s >= 80) return "score-great";
    if (s >= 70) return "score-good";
    if (s >= 60) return "score-fair";
    return "score-low";
  };
  const getScoreLabel = (s) => {
    if (s >= 90) return "Excellent";
    if (s >= 80) return "Great";
    if (s >= 70) return "Good";
    if (s >= 60) return "Fair";
    return "Low";
  };
  const getCompanyLogo = (company) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=f4f4f0&color=111&size=80&bold=true&font-size=0.45`;

  const renderPageNumbers = () => {
    if (!pagination) return null;
    const total = pagination.total_pages;
    const pages = [];
    for (let i = 1; i <= Math.min(total, 10); i++) {
      const show = i <= 2 || i > total - 2 || Math.abs(i - currentPage) <= 1;
      if (!show && i === 3) { pages.push(<span key="el" style={{ padding: "0 4px", color: "#bbb", display: "flex", alignItems: "center" }}>…</span>); continue; }
      if (!show) continue;
      pages.push(
        <button key={i} className={`page-btn ${currentPage === i ? "active" : ""}`} onClick={() => handlePageChange(i)}>{i}</button>
      );
    }
    return pages;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page-root">

        {/* NAV */}
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo-dot">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z"/></svg>
            </div>
            JobSphere
          </div>
          <div className="nav-pill">AI-Powered</div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-tag">
            <span className="hero-tag-dot" />
            Powered by AI Resume Analysis
          </div>
          <h1>Find jobs that actually <em>fit you</em></h1>
          <p>Upload your resume and let our AI match you to thousands of curated roles — ranked by how well they align with your experience.</p>
        </div>

        {/* UPLOAD */}
        <div className="upload-wrap">
          <div className="card upload-card">
            <div className={`upload-zone ${file ? "has-file" : ""}`}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="file-input" />
              <div className="upload-icon">{file ? "✅" : "📄"}</div>
              <div className="upload-label">{file ? "Resume ready" : "Drop your resume here"}</div>
              {file
                ? <div className="file-name">{file.name}</div>
                : <div className="upload-sub">PDF, DOC or DOCX · Click or drag & drop</div>
              }
            </div>

            <button className="btn-primary" onClick={handleUpload} disabled={loading}>
              {loading ? (<><div className="spinner" /><span>Analysing your resume…</span></>) : (<><span>✦</span><span>Analyse &amp; Find Matches</span></>)}
            </button>

            {message.text && (
              <div className={message.type === "error" ? "error-msg" : "success-msg"}>
                {message.type === "error" ? "⚠ " : "✓ "}{message.text}
              </div>
            )}
          </div>
        </div>

        {/* ANALYSIS */}
        {analysis && (
          <div className="section-wrap">
            <div className="section-title">
              <span>✦</span> Resume Insights
            </div>
            <div className="card analysis-card">
              <div className="analysis-grid">
                <div className="analysis-chip">
                  <div className="analysis-chip-label">Primary Roles</div>
                  <div className="analysis-chip-value">{analysis.primary_roles.join(", ")}</div>
                </div>
                <div className="analysis-chip">
                  <div className="analysis-chip-label">Experience</div>
                  <div className="analysis-chip-value">{analysis.experience_level} · {analysis.experience_years}y</div>
                </div>
                <div className="analysis-chip">
                  <div className="analysis-chip-label">Languages</div>
                  <div className="analysis-chip-value">{analysis.programming_languages.join(", ") || "—"}</div>
                </div>
                <div className="analysis-chip">
                  <div className="analysis-chip-label">Frameworks</div>
                  <div className="analysis-chip-value">{analysis.frameworks.join(", ") || "—"}</div>
                </div>
                <div className="analysis-chip wide">
                  <div className="analysis-chip-label">Keywords ({analysis.job_keywords.length})</div>
                  <div className="keyword-cloud">
                    {analysis.job_keywords.map((k, i) => <span key={i} className="kw-tag">{k}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOBS */}
        {(loadingJobs || jobs.length > 0 || (analysis && !loadingJobs)) && (
          <div className="section-wrap" id="jobs-section">

            {loadingJobs && (
              <div className="loading-state">
                <div className="loading-dots">
                  <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                </div>
                <div className="loading-text">Searching for your best matches…</div>
              </div>
            )}

            {!loadingJobs && jobs.length > 0 && (
              <>
                <div className="jobs-header">
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    <span>◈</span> Matched Roles {pagination && <span style={{ fontWeight: 400, fontSize: "1rem", color: "#aaa" }}>({pagination.total_jobs})</span>}
                  </div>
                  <button className="btn-ghost" onClick={() => fetchMatchingJobs(1)}>
                    <span style={{ fontSize: "0.9rem" }}>↻</span> Refresh
                  </button>
                </div>

                {pagination && (
                  <div className="jobs-meta">
                    Page {pagination.current_page} of {pagination.total_pages} · Showing {jobs.length} results · Sorted by match score
                  </div>
                )}

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
                  {jobs.map((job, idx) => (
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
                          {job.match_score}% · {getScoreLabel(job.match_score)}
                        </span>
                      </div>

                      <div className="job-title">{job.title}</div>

                      <div className="job-meta">
                        <div className="job-meta-row"><span className="meta-icon">📍</span><span>{job.location || "Location N/A"}</span></div>
                      </div>

                      <div style={{ flexGrow: 1 }} />

                      <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="btn-apply">
                        Apply Now →
                      </a>
                    </div>
                  ))}
                </div>

                {pagination && pagination.total_pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn wide" disabled={!pagination.has_prev} onClick={() => handlePageChange(currentPage - 1)}>← Prev</button>
                    {renderPageNumbers()}
                    <button className="page-btn wide" disabled={!pagination.has_next} onClick={() => handlePageChange(currentPage + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}

            {!loadingJobs && jobs.length === 0 && analysis && (
              <div className="card empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-text">No matching jobs found right now. Try uploading a different resume or check back later.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}