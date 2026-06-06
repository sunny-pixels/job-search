import { useState, useRef, useCallback, useContext, useEffect } from "react";
import { AppliedJobsContext } from "../App.jsx";
import TailorResumeModal from "./TailorResumeModal.jsx";

// NEW: Embedding-based Resume Uploader (Fast Semantic Matching)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Gemini status helpers ────────────────────────────────────────────────────
const GEMINI_STATUS = {
  NOT_ANALYZED: 'not_analyzed',
  ANALYZING:    'analyzing',
  COMPLETED:    'completed',
  FAILED:       'failed',
};

const RECOMMENDATION_META = {
  STRONG_MATCH:   { emoji: '🟢', label: 'Strong Match',   color: 'gemini-strong'   },
  GOOD_MATCH:     { emoji: '🟡', label: 'Good Match',     color: 'gemini-good'     },
  MODERATE_MATCH: { emoji: '🟠', label: 'Moderate Match', color: 'gemini-moderate' },
  WEAK_MATCH:     { emoji: '🔴', label: 'Weak Match',     color: 'gemini-weak'     },
  POOR_MATCH:     { emoji: '⚫', label: 'Poor Match',     color: 'gemini-poor'     },
};

const getJobKey = (job) =>
  job.job_id || `${job.employer_name}_${job.job_title}_${job.job_location}`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResumeUploaderEmbedding() {
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
  const [jobProgress, setJobProgress] = useState({ message: '', progress: 0 });
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [resumeId, setResumeId] = useState(null);
  const [savedFileName, setSavedFileName] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // ── Gemini scoring state ──────────────────────────────────────────────────
  const [geminiScores, setGeminiScores] = useState({});   // keyed by job_key
  const [isAnalyzingPage, setIsAnalyzingPage] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ done: 0, total: 0 });
  const [analyzeNotification, setAnalyzeNotification] = useState(null); // {type, text}
  const [expandedGemini, setExpandedGemini] = useState({}); // keyed by job_key

  const pageCache = useRef({});
  const prefetchingPages = useRef(new Set());
  const notifyTimer = useRef(null);

  // ── Notification auto-dismiss ─────────────────────────────────────────────
  const showNotification = useCallback((type, text) => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    setAnalyzeNotification({ type, text });
    notifyTimer.current = setTimeout(() => setAnalyzeNotification(null), 5000);
  }, []);

  // ── Rate limit ────────────────────────────────────────────────────────────
  const fetchRateLimit = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/embedding-matcher/rate-limit`);
      const data = await res.json();
      setRateLimit(data);
    } catch (err) {
      console.error("Failed to fetch rate limit:", err);
    }
  }, []);

  // ── Load state from localStorage ──────────────────────────────────────────
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('resumeUploaderEmbeddingState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.analysis) setAnalysis(parsed.analysis);
        if (parsed.resumeId) setResumeId(parsed.resumeId);
        if (parsed.jobs && Array.isArray(parsed.jobs)) setJobs(parsed.jobs);
        if (parsed.pagination) setPagination(parsed.pagination);
        if (parsed.scoreDistribution) setScoreDistribution(parsed.scoreDistribution);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
        if (parsed.appliedJobs && Array.isArray(parsed.appliedJobs)) {
          setAppliedJobs(new Set(parsed.appliedJobs));
        }
        if (parsed.fileName) setSavedFileName(parsed.fileName);
        if (parsed.geminiScores) setGeminiScores(parsed.geminiScores);
      }
    } catch (err) {
      console.error("Failed to load saved state:", err);
      localStorage.removeItem('resumeUploaderEmbeddingState');
    }
  }, []);

  // ── Save state to localStorage ────────────────────────────────────────────
  useEffect(() => {
    if (analysis || jobs.length > 0) {
      try {
        // Trim geminiScores to last 100 entries to avoid localStorage bloat
        const geminiKeys = Object.keys(geminiScores);
        const trimmedScores = geminiKeys.length > 100
          ? Object.fromEntries(geminiKeys.slice(-100).map(k => [k, geminiScores[k]]))
          : geminiScores;

        const stateToSave = {
          analysis,
          resumeId,
          jobs: jobs.slice(0, 50),
          pagination,
          scoreDistribution,
          currentPage,
          appliedJobs: Array.from(appliedJobs),
          fileName: file?.name || savedFileName || null,
          geminiScores: trimmedScores,
        };
        localStorage.setItem('resumeUploaderEmbeddingState', JSON.stringify(stateToSave));
      } catch (err) {
        console.error("Failed to save state:", err);
      }
    }
  }, [analysis, resumeId, jobs, pagination, scoreDistribution, currentPage, appliedJobs, file, savedFileName, geminiScores]);

  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit, jobs]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  // ── Applied-job helpers ───────────────────────────────────────────────────
  const checkAppliedStatus = useCallback(async () => {
    if (!resumeId || jobs.length === 0) return;
    const jobIds = jobs.map(job => `${job.employer_name}_${job.job_title}_${job.job_location}`);
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
    const jobId = `${job.employer_name}_${job.job_title}_${job.job_location}`;
    try {
      const res = await fetch(`${API_URL}/api/applied-jobs/mark-applied`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId, jobTitle: job.job_title, company: job.employer_name, jobUrl: job.job_apply_link })
      });
      if (res.ok) {
        setAppliedJobs(prev => new Set([...prev, jobId]));
        triggerAppliedJobsRefresh();
      }
    } catch (err) { console.error(err); }
  };

  const unmarkAsApplied = async (job) => {
    if (!resumeId) return;
    const jobId = `${job.employer_name}_${job.job_title}_${job.job_location}`;
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

  // ── Pagination / page fetching ────────────────────────────────────────────
  const prefetchPage = useCallback(async (page) => {
    if (!resumeId) return;
    if (pageCache.current[page] || prefetchingPages.current.has(page)) return;
    prefetchingPages.current.add(page);
    try {
      const res = await fetch(`${API_URL}/api/embedding-matcher/jobs?resumeId=${resumeId}&page=${page}&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      pageCache.current[page] = { jobs: data.jobs || [], pagination: data.pagination, scoreDistribution: data.score_distribution };
    } catch { } finally { prefetchingPages.current.delete(page); }
  }, [resumeId]);

  const showPage = useCallback(async (page, showLoader = true) => {
    if (!resumeId) return;
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
      const res = await fetch(`${API_URL}/api/embedding-matcher/jobs?resumeId=${resumeId}&page=${page}&limit=10`);
      if (res.status === 429) {
        setMessage({ text: "⚠️ RapidAPI rate limit exceeded. Please try again in a few hours.", type: "error" });
        setJobs([]);
        setPagination(null);
        return;
      }
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
    } catch (err) {
      console.error(err);
      if (err.message.includes('429')) {
        setMessage({ text: "⚠️ RapidAPI rate limit exceeded. Please try again later.", type: "error" });
      }
    }
    finally { if (showLoader) setLoadingJobs(false); }
  }, [resumeId, prefetchPage]);

  const fetchMatchingJobs = useCallback(async (page = 1, explicitResumeId = null) => {
    const idToUse = explicitResumeId || resumeId;
    if (!idToUse) { console.error('❌ No resumeId available for fetching jobs'); return; }
    pageCache.current = {};
    prefetchingPages.current.clear();
    setLoadingJobs(true);
    setJobProgress({ message: 'Starting embedding-based matching...', progress: 10 });
    const progressInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/embedding-matcher/jobs/progress`);
        if (res.ok) {
          const data = await res.json();
          setJobProgress({ message: data.message || '', progress: data.progress || 0 });
        }
      } catch { }
    }, 1000);
    try {
      await showPage(page, false);
      if (resumeId) checkAppliedStatus();
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        setMessage({ text: "⚠️ RapidAPI rate limit exceeded. Please try again in a few hours.", type: "error" });
      }
    } finally {
      clearInterval(progressInterval);
      setLoadingJobs(false);
      setJobProgress({ message: '', progress: 0 });
    }
  }, [showPage, resumeId, checkAppliedStatus]);

  const handlePageChange = useCallback(async (page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    await showPage(page, true);
    if (resumeId) checkAppliedStatus();
  }, [showPage, resumeId, checkAppliedStatus]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { setMessage({ text: "Please select a file first.", type: "error" }); return; }
    setLoading(true);
    setMessage({ text: "", type: "" });
    setAnalysis(null);
    setJobs([]);
    setGeminiScores({});
    pageCache.current = {};
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch(`${API_URL}/api/embedding-matcher/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === 'EMBEDDING_SERVICE_DOWN') {
          throw new Error('Embedding service is unavailable. Please try AI-based matching instead.');
        }
        throw new Error(`Status: ${res.status}`);
      }
      const data = await res.json();
      setMessage({ text: "Resume analyzed successfully!", type: "success" });
      setAnalysis(data.analysis);
      setResumeId(data._id);
      setSavedFileName(file.name);
      fetchMatchingJobs(1, data._id);
      triggerResumeUpload();
    } catch (err) {
      setMessage({ text: `Upload failed: ${err.message}`, type: "error" });
    } finally { setLoading(false); }
  };

  // ── Gemini Analyze Page ───────────────────────────────────────────────────
  const handleAnalyzePage = useCallback(async (forceReanalyze = false) => {
    if (!resumeId || jobs.length === 0 || isAnalyzingPage) return;

    // Determine which jobs need scoring
    const jobsToScore = forceReanalyze
      ? jobs
      : jobs.filter(job => {
          const key = getJobKey(job);
          const status = geminiScores[key]?.status;
          return status !== GEMINI_STATUS.COMPLETED;
        });

    if (jobsToScore.length === 0) {
      showNotification('info', '✅ All jobs on this page are already scored.');
      return;
    }

    // Optimistically mark as analyzing
    setGeminiScores(prev => {
      const updated = { ...prev };
      jobsToScore.forEach(job => {
        const key = getJobKey(job);
        updated[key] = { ...updated[key], status: GEMINI_STATUS.ANALYZING };
      });
      return updated;
    });

    setIsAnalyzingPage(true);
    setAnalyzeProgress({ done: 0, total: jobsToScore.length });

    try {
      let successCount = 0;
      let failCount = 0;

      // Process one by one
      for (let i = 0; i < jobsToScore.length; i++) {
        const job = jobsToScore[i];
        const key = getJobKey(job);
        
        try {
          const res = await fetch(`${API_URL}/api/embedding-matcher/score-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeId, jobs: [job] }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${res.status}`);
          }

          const data = await res.json();
          const scoredJobs = data.jobs || [];
          const failedJobs = data.failed_jobs || [];

          setGeminiScores(prev => {
            const updated = { ...prev };
            scoredJobs.forEach(scored => {
              updated[key] = {
                status: GEMINI_STATUS.COMPLETED,
                gemini_score: scored.gemini_score,
                recommendation: scored.recommendation,
                role_identity_match: scored.role_identity_match,
                emoji: scored.emoji,
                detailed_analysis: scored.detailed_analysis,
                key_strengths: scored.key_strengths || [],
                key_gaps: scored.key_gaps || [],
                scores: scored.scores || {},
                error: null,
              };
            });
            failedJobs.forEach(failed => {
              updated[key] = {
                ...updated[key],
                status: GEMINI_STATUS.FAILED,
                error: failed.error || 'Scoring failed',
              };
            });
            return updated;
          });

          if (scoredJobs.length > 0) successCount++;
          if (failedJobs.length > 0) failCount++;

        } catch (jobErr) {
          console.error(`❌ Failed to score job ${key}:`, jobErr);
          failCount++;
          setGeminiScores(prev => ({
            ...prev,
            [key]: { ...prev[key], status: GEMINI_STATUS.FAILED, error: jobErr.message }
          }));
        }

        setAnalyzeProgress({ done: i + 1, total: jobsToScore.length });
      }

      if (failCount === 0) {
        showNotification('success', `✅ Scored ${successCount}/${jobsToScore.length} jobs`);
      } else {
        showNotification('warning', `⚠️ Scored ${successCount}/${jobsToScore.length} jobs. ${failCount} failed.`);
      }

    } catch (err) {
      console.error('❌ Gemini scoring error:', err);
      showNotification('error', `❌ Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzingPage(false);
      setAnalyzeProgress({ done: 0, total: 0 });
    }
  }, [resumeId, jobs, isAnalyzingPage, geminiScores, showNotification]);

  // ── Derive button label for current page ──────────────────────────────────
  const getAnalyzeButtonState = useCallback(() => {
    if (jobs.length === 0) return { label: 'Analyze Page', disabled: true, forceReanalyze: false };
    const statuses = jobs.map(j => geminiScores[getJobKey(j)]?.status);
    const allCompleted = statuses.every(s => s === GEMINI_STATUS.COMPLETED);
    const noneAnalyzed = statuses.every(s => !s || s === GEMINI_STATUS.NOT_ANALYZED || s === GEMINI_STATUS.FAILED);
    const remaining = statuses.filter(s => s !== GEMINI_STATUS.COMPLETED).length;

    if (isAnalyzingPage) {
      const { done, total } = analyzeProgress;
      return { label: total > 0 ? `Analyzing… ${done}/${total}` : 'Analyzing…', disabled: true, forceReanalyze: false };
    }
    if (allCompleted) return { label: '🔄 Re-Analyze Page', disabled: false, forceReanalyze: true };
    if (noneAnalyzed)  return { label: '✨ Analyze Page', disabled: false, forceReanalyze: false };
    return { label: `✨ Analyze Remaining (${remaining})`, disabled: false, forceReanalyze: false };
  }, [jobs, geminiScores, isAnalyzingPage, analyzeProgress]);

  // ── Misc helpers ──────────────────────────────────────────────────────────
  const getScoreClass = (s) => s >= 90 ? "score-excellent" : s >= 80 ? "score-great" : s >= 70 ? "score-good" : s >= 60 ? "score-fair" : "score-low";
  const getScoreLabel = (s) => s >= 90 ? "Excellent" : s >= 80 ? "Great" : s >= 70 ? "Good" : s >= 60 ? "Fair" : "Low";
  const getCompanyLogo = (company) => `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=f5f5f3&color=0f0f0f&size=80&bold=true&font-size=0.45`;

  const handleTailorClick = (job) => { setSelectedJob(job); setShowTailorModal(true); };
  const handleTailorSuccess = (tailoredResume) => { console.log('✅ Tailored resume created:', tailoredResume); };

  const toggleGeminiExpand = (key) => {
    setExpandedGemini(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  // ── Gemini status chip renderer ───────────────────────────────────────────
  const renderGeminiStatusChip = (status) => {
    const map = {
      [GEMINI_STATUS.NOT_ANALYZED]: { cls: 'gemini-chip not-analyzed', text: 'Not Analyzed' },
      [GEMINI_STATUS.ANALYZING]:    { cls: 'gemini-chip analyzing',    text: 'Analyzing…'   },
      [GEMINI_STATUS.COMPLETED]:    { cls: 'gemini-chip completed',    text: 'Completed'    },
      [GEMINI_STATUS.FAILED]:       { cls: 'gemini-chip failed',       text: 'Failed'       },
    };
    const cfg = map[status] || map[GEMINI_STATUS.NOT_ANALYZED];
    return <span className={cfg.cls}>{cfg.text}</span>;
  };

  // ── Gemini card section renderer ──────────────────────────────────────────
  const renderGeminiSection = (job) => {
    const key = getJobKey(job);
    const score = geminiScores[key];
    const status = score?.status || GEMINI_STATUS.NOT_ANALYZED;
    const isExpanded = expandedGemini[key];
    const rec = score?.recommendation ? RECOMMENDATION_META[score.recommendation] : null;

    return (
      <div className="gemini-section">
        <div className="gemini-section-header">
          <span className="gemini-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1M7.6 16.4l-2.1 2.1M16.4 16.4l2.1 2.1M7.6 7.6 5.5 5.5"/>
            </svg>
            Gemini AI
          </span>
          {renderGeminiStatusChip(status)}
        </div>

        {status === GEMINI_STATUS.ANALYZING && (
          <div className="gemini-analyzing-bar">
            <div className="gemini-analyzing-pulse" />
          </div>
        )}

        {status === GEMINI_STATUS.COMPLETED && rec && (
          <>
            <div className="gemini-score-row">
              <span className={`gemini-score-badge ${rec.color}`}>
                {rec.emoji} {score.gemini_score}% — {rec.label}
              </span>
              <span className="gemini-role-tag">{score.role_identity_match?.replace('_', ' ')}</span>
              <button
                className="gemini-expand-btn"
                onClick={() => toggleGeminiExpand(key)}
                title={isExpanded ? 'Collapse' : 'Expand analysis'}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>

            {!isExpanded && score.detailed_analysis && (
              <p className="gemini-analysis-preview">
                {score.detailed_analysis.slice(0, 120)}{score.detailed_analysis.length > 120 ? '…' : ''}
              </p>
            )}

            {isExpanded && (
              <div className="gemini-expanded">
                {score.detailed_analysis && (
                  <p className="gemini-analysis-full">{score.detailed_analysis}</p>
                )}
                <div className="gemini-sg-grid">
                  {score.key_strengths?.length > 0 && (
                    <div className="gemini-sg-col">
                      <div className="gemini-sg-title strengths">✅ Strengths</div>
                      {score.key_strengths.map((s, i) => <div key={i} className="gemini-sg-item">{s}</div>)}
                    </div>
                  )}
                  {score.key_gaps?.length > 0 && (
                    <div className="gemini-sg-col">
                      <div className="gemini-sg-title gaps">❌ Gaps</div>
                      {score.key_gaps.map((g, i) => <div key={i} className="gemini-sg-item">{g}</div>)}
                    </div>
                  )}
                </div>
                {score.scores && (
                  <div className="gemini-subscores">
                    {[
                      { label: 'Skills',      val: score.scores.skills      },
                      { label: 'Experience',  val: score.scores.experience  },
                      { label: 'Education',   val: score.scores.education   },
                      { label: 'Domain',      val: score.scores.domain      },
                      { label: 'Soft Skills', val: score.scores.soft_signals },
                    ].map(({ label, val }) => val != null && (
                      <div key={label} className="gemini-subscore-item">
                        <span className="gemini-subscore-label">{label}</span>
                        <div className="gemini-subscore-bar-wrap">
                          <div
                            className="gemini-subscore-bar"
                            style={{ width: `${val}%`, background: val >= 80 ? 'var(--green-500)' : val >= 60 ? '#eab308' : 'var(--orange-500)' }}
                          />
                        </div>
                        <span className="gemini-subscore-val">{val}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {status === GEMINI_STATUS.FAILED && (
          <p className="gemini-error-text">⚠️ {score?.error || 'Scoring failed. Try again.'}</p>
        )}
      </div>
    );
  };

  const btnState = getAnalyzeButtonState();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="uploader-page">
      {/* Toast Notification */}
      {analyzeNotification && (
        <div className={`analyze-toast analyze-toast--${analyzeNotification.type}`}>
          {analyzeNotification.text}
          <button className="analyze-toast-close" onClick={() => setAnalyzeNotification(null)}>✕</button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="uploader-body">
        <div className="uploader-body-inner">
          {!analysis ? (
            <div className="full-width-upload">
              <div className="upload-card">
                <div className="upload-card-header">
                  <div className="upload-card-title">Upload Your Resume</div>
                  <div className="upload-card-subtitle">Supports PDF, DOC, DOCX — semantic AI matching</div>
                </div>
                <div className={`upload-zone ${file ? "has-file" : ""}`}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="file-input" />
                  <div className="upload-icon-wrap">
                    {file ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                    )}
                  </div>
                  <div className="upload-title">{file ? "File ready" : "Drop your resume here"}</div>
                  {file ? (
                    <div className="upload-filename">📎 {file.name}</div>
                  ) : (
                    <>
                      <div className="upload-hint">Click to browse or drag &amp; drop</div>
                      <div className="upload-formats">
                        <span className="format-tag">PDF</span>
                        <span className="format-tag">DOCX</span>
                        <span className="format-tag tip" title="DOCX files preserve formatting when tailored">✨ DOCX Recommended</span>
                      </div>
                    </>
                  )}
                </div>
                <button className="btn-analyse" onClick={handleUpload} disabled={loading}>
                  {loading ? (<><div className="spinner" /><span>Analyzing resume…</span></>) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      </svg>
                      <span>Analyze &amp; Find Matching Jobs</span>
                    </>
                  )}
                </button>
                {message.text && (
                  <div className={`msg-box ${message.type}`}>
                    {message.type === "error" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20,6 9,17 4,12" />
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
                    <div className="upload-card-title">Upload New Resume</div>
                    <div className="upload-card-subtitle">Re-analyze with a different resume</div>
                  </div>
                  <div className={`upload-zone ${file ? "has-file" : ""}`}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="file-input" />
                    <div className="upload-icon-wrap">
                      {file ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10,9 9,9 8,9" />
                        </svg>
                      )}
                    </div>
                    <div className="upload-title">{file ? "File ready" : "Upload a new resume"}</div>
                    {file && <div className="upload-filename">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                      </svg>
                      {file.name}
                    </div>}
                  </div>
                  <button className="btn-analyse" onClick={handleUpload} disabled={loading}>
                    {loading ? (<><div className="spinner" /><span>Analyzing…</span></>) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        </svg>
                        <span>Re-Analyze Resume</span>
                      </>
                    )}
                  </button>
                  {message.text && (
                    <div className={`msg-box ${message.type}`}>
                      {message.type === "error" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}{message.text}
                    </div>
                  )}
                </div>

                {/* Analysis Panel */}
                <div style={{ marginTop: 20 }}>
                  <div className="analysis-panel">
                    <div className="panel-header">
                      <div className="panel-header-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13,2 13,9 20,9"/>
                        </svg>
                      </div>
                      <div className="panel-title">Resume Analysis</div>
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
                    <div className="loading-text">{jobProgress.message || 'Computing semantic similarities…'}</div>
                    {jobProgress.progress > 0 && (
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${jobProgress.progress}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {!loadingJobs && jobs.length > 0 && (
                  <>
                    {/* ── Section Header with Analyze Page button ── */}
                    <div className="jobs-section-header">
                      <div>
                        <div className="jobs-section-title">
                          Matched Roles <span>({pagination?.total_jobs || jobs.length} found)</span>
                        </div>
                        {isAnalyzingPage && analyzeProgress.total > 0 && (
                          <div className="analyze-inline-progress">
                            <div
                              className="analyze-inline-bar"
                              style={{ width: `${Math.round((analyzeProgress.done / analyzeProgress.total) * 100)}%` }}
                            />
                            <span className="analyze-inline-label">
                              Scoring with Gemini AI…
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="jobs-header-right">
                        {scoreDistribution && (
                          <div className="dist-strip-inline">
                            <div className="dist-item"><div className="dist-num green">{scoreDistribution.excellent}</div><div className="dist-label">90–100%</div></div>
                            <div className="dist-item"><div className="dist-num blue">{scoreDistribution.great}</div><div className="dist-label">80–89%</div></div>
                            <div className="dist-item"><div className="dist-num yellow">{scoreDistribution.good}</div><div className="dist-label">70–79%</div></div>
                            <div className="dist-item"><div className="dist-num orange">{scoreDistribution.fair}</div><div className="dist-label">60–69%</div></div>
                            <div className="dist-item"><div className="dist-num gray">{scoreDistribution.low}</div><div className="dist-label">&lt;60%</div></div>
                          </div>
                        )}

                        {/* ── Analyze Page Button ── */}
                        <button
                          id="analyze-page-btn"
                          className={`btn-analyze-page ${isAnalyzingPage ? 'analyzing' : ''} ${btnState.forceReanalyze ? 'reanalyze' : ''}`}
                          onClick={() => handleAnalyzePage(btnState.forceReanalyze)}
                          disabled={btnState.disabled || !resumeId}
                          title={!resumeId ? 'Upload a resume first' : 'Analyze all jobs on this page with Gemini AI'}
                        >
                          {isAnalyzingPage ? (
                            <>
                              <div className="spinner-sm" />
                              <span>{btnState.label}</span>
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5-2.1 2.1M7.6 16.4l-2.1 2.1M16.4 16.4l2.1 2.1M7.6 7.6 5.5 5.5"/>
                              </svg>
                              <span>{btnState.label}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Job Cards ── */}
                    <div className="jobs-grid">
                      {jobs.map((job, idx) => {
                        const jobId = `${job.employer_name}_${job.job_title}_${job.job_location}`;
                        const isApplied = appliedJobs.has(jobId);
                        return (
                          <div key={idx} className="job-card">
                            <div className="job-card-top">
                              <div className="company-row">
                                <img src={job.employer_logo || getCompanyLogo(job.employer_name)} alt={job.employer_name} className="company-logo" />
                                <div>
                                  <div className="company-name">{job.employer_name}</div>
                                  <div className="company-source">{job.job_publisher}</div>
                                </div>
                              </div>
                              <span className={`score-badge ${getScoreClass(job.embedding_match_score)}`}>
                                {job.embedding_match_score}% {getScoreLabel(job.embedding_match_score)}
                              </span>
                            </div>

                            <div className="job-title">{job.job_title}</div>

                            <div className="job-location">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{job.job_location || "Location N/A"}</span>
                            </div>

                            {job.matched_keywords && job.matched_keywords.length > 0 && (
                              <div className="job-ai-reason">
                                <strong>Matched:</strong> {job.matched_keywords.join(', ')}
                              </div>
                            )}

                            {/* ── Gemini Analysis Section ── */}
                            {renderGeminiSection(job)}

                            <div className="spacer" />

                            <div className="job-actions">
                              <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" className="btn-apply">
                                Apply Now →
                              </a>
                              {job.embedding_match_score >= 50 && (
                                <button
                                  className="btn-tailor"
                                  onClick={() => handleTailorClick(job)}
                                  title="Generate AI-tailored resume for this job"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>AI Tailor Resume</span>
                                </button>
                              )}
                              {isApplied ? (
                                <button className="btn-mark applied-state" onClick={() => unmarkAsApplied(job)} title="Click to undo">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20,6 9,17 4,12" />
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
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
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

      {/* AI Tailor Resume Modal */}
      {showTailorModal && selectedJob && (
        <TailorResumeModal
          job={selectedJob}
          resumeId={resumeId}
          originalScore={selectedJob.embedding_match_score}
          onClose={() => { setShowTailorModal(false); setSelectedJob(null); }}
          onSuccess={handleTailorSuccess}
        />
      )}
    </div>
  );
}
