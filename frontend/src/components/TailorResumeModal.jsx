import { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── DocxViewer ───────────────────────────────────────────────────────────────
// Renders DOCX with ignoreWidth:true, then applies CSS zoom so the page always
// fits the panel width. Uses ResizeObserver to stay correct on panel resize.

const NATURAL_PAGE_WIDTH = 816; // docx-preview default px width

function DocxViewer({ url, label }) {
  const outerRef = useRef(null);
  const containerRef = useRef(null);
  const roRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const applyZoom = () => {
    const outer = outerRef.current;
    const container = containerRef.current;
    if (!outer || !container) return;
    const pageEl = container.querySelector(".docx");
    const renderedWidth = pageEl ? pageEl.offsetWidth : NATURAL_PAGE_WIDTH;
    if (!renderedWidth) return;
    const available = outer.clientWidth - 24;
    if (available <= 0) return;
    container.style.zoom = String(Math.min(available / renderedWidth, 1));
  };

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setStatus("loading");
    setErrMsg("");

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} — ${text.slice(0, 120) || res.statusText}`);
        }
        const blob = await res.blob();
        if (blob.size < 200) throw new Error("Response too small.");
        if (!containerRef.current || cancelled) return;
        containerRef.current.innerHTML = "";

        await renderAsync(blob, containerRef.current, null, {
          className: "docx-render",
          inWrapper: true,
          ignoreWidth: true,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: true,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderChanges: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        if (!cancelled) {
          setStatus("success");
          setTimeout(applyZoom, 80);
        }
      } catch (err) {
        if (!cancelled) { setStatus("error"); setErrMsg(err.message); }
      }
    })();

    return () => { cancelled = true; };
  }, [url, label]);

  useEffect(() => {
    if (status !== "success" || !outerRef.current) return;
    roRef.current = new ResizeObserver(applyZoom);
    roRef.current.observe(outerRef.current);
    return () => roRef.current?.disconnect();
  }, [status]);

  return (
    <div ref={outerRef} className="docx-viewer">
      {status === "loading" && (
        <div className="docx-viewer__overlay">
          <Spinner size={28} />
          <span>Loading {label}…</span>
        </div>
      )}
      {status === "error" && (
        <div className="docx-viewer__overlay docx-viewer__overlay--error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Failed to render</span>
          <small style={{ color: "#ef4444", maxWidth: 280, textAlign: "center" }}>{errMsg}</small>
        </div>
      )}
      <div
        ref={containerRef}
        className="docx-viewer__canvas"
        style={{ display: status === "error" ? "none" : "block" }}
      />
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function TailorResumeModal({ job, resumeId, originalScore, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [missingKeywords, setMissingKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState(new Set());
  const [tailoredResumeId, setTailoredResumeId] = useState(null);

  // ── Step 1: analyze on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (step === 1) analyzeMissingKeywords();
  }, []);

  const analyzeMissingKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tailored-resume/analyze-keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobData: {
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            job_description: job.job_description,
            job_highlights: job.job_highlights,
          },
        }),
      });

      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const data = await res.json();

      setMissingKeywords(data.missingKeywords || []);
      setSelectedKeywords(new Set((data.missingKeywords || []).map((k) => k.keyword)));
      setStep(2);
    } catch (err) {
      setError(err.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (kw) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });
  };

  // ── Step 2 → 3: generate tailored resume ─────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tailored-resume/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobData: {
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            job_description: job.job_description,
            job_highlights: job.job_highlights,
          },
          selectedKeywords: Array.from(selectedKeywords),
          originalScore: originalScore || job.embedding_match_score,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      setTailoredResumeId(data.tailoredResume?._id);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!tailoredResumeId) return;
    const name = `${job.employer_name}_${job.job_title}_Resume.docx`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const link = document.createElement("a");
    link.href = `${API_URL}/api/tailored-resume/download/${tailoredResumeId}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess?.({ _id: tailoredResumeId });
    onClose();
  };

  // ── DOCX URLs ─────────────────────────────────────────────────────────────
  const originalDocxUrl = resumeId
    ? `${API_URL}/api/embedding-matcher/download/${resumeId}`
    : null;

  const tailoredDocxUrl = tailoredResumeId
    ? `${API_URL}/api/tailored-resume/download/${tailoredResumeId}`
    : null;

  // ── Category colours ──────────────────────────────────────────────────────
  const categoryColor = {
    "Programming Languages": "#6366f1",
    Frontend: "#0ea5e9",
    Backend: "#10b981",
    Databases: "#f59e0b",
    "Cloud & DevOps": "#ef4444",
    "Data & AI": "#8b5cf6",
    Tools: "#64748b",
  };

  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }

        /* ── DocxViewer container ── */
        .docx-viewer {
          position: relative;
          min-height: 300px;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background: #f0f2f5;
          padding: 12px;
          box-sizing: border-box;
        }

        .docx-viewer__overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px; color: #6b7280; font-size: 13px;
          background: #f0f2f5; z-index: 2; border-radius: 8px;
        }
        .docx-viewer__overlay--error { background: #fef2f2; }

        /* zoom is applied inline by JS; no extra width constraints here */
        .docx-viewer__canvas { display: block; }

        /* docx-preview inner page elements */
        .docx-render { display: flex; flex-direction: column; align-items: center; }
        .docx-render .docx {
          margin: 0 auto 12px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,.12) !important;
          border-radius: 3px;
          /* prevent the page element itself from overflowing */
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>

      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

          {/* ── Progress bar ── */}
          <div style={styles.progressBar}>
            {["Analyze", "Select Skills", "Preview"].map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step >= n;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <div style={styles.stepWrap}>
                    <div style={{
                      ...styles.stepCircle,
                      background: done ? "#22c55e" : active ? "#111827" : "#e5e7eb",
                      color: active ? "#fff" : "#9ca3af",
                      transform: active ? "scale(1.08)" : "scale(1)",
                      transition: "all .25s",
                    }}>
                      {done ? <CheckIcon /> : n}
                    </div>
                    <span style={{ ...styles.stepLabel, color: active ? "#111827" : "#9ca3af" }}>{label}</span>
                  </div>
                  {n < 3 && (
                    <div style={{
                      width: 80, height: 2, margin: "0 4px",
                      background: step > n ? "#22c55e" : "#e5e7eb",
                      transition: "background .4s",
                      position: "relative", top: -10,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Close ── */}
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

          {/* ════════════════ STEP 1 — Analyzing ═══════════════════════════ */}
          {step === 1 && (
            <div style={styles.slideCenter}>
              <div style={styles.analyzeBox}>
                <Spinner size={44} />
                <h2 style={styles.h2}>Analyzing Job Requirements</h2>
                <p style={styles.subtext}>Comparing your resume with the job description…</p>
                <div style={styles.analyzeSteps}>
                  {["Parsing job description", "Extracting skill keywords", "Matching against your resume"].map((t, i) => (
                    <div key={i} style={{ ...styles.analyzeStep, animationDelay: `${i * 0.35}s` }}>
                      <div style={styles.dot} />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ STEP 2 — Select Keywords ══════════════════════ */}
          {step === 2 && (
            <>
              <div style={styles.slideHeader}>
                <h2 style={styles.h2}>🎯 Select Skills to Add</h2>
                <p style={styles.subtext}>Choose which skills you want woven into your tailored resume</p>
              </div>

              <div style={styles.jobCtx}>
                <span><b>{job.job_title}</b></span>
                <span style={styles.dot2} />
                <span style={{ color: "#6b7280" }}>{job.employer_name}</span>
              </div>

              <div style={{ padding: "0 28px", flex: 1, overflowY: "auto" }}>
                {missingKeywords.length === 0 && !error ? (
                  <div style={styles.emptyState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>Your resume already contains all key skills for this job.</p>
                  </div>
                ) : (
                  <>
                    <div style={styles.kwHeader}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        Missing Skills — {selectedKeywords.size}/{missingKeywords.length} selected
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button style={styles.btnText} onClick={() => setSelectedKeywords(new Set(missingKeywords.map((k) => k.keyword)))}>All</button>
                        <button style={styles.btnText} onClick={() => setSelectedKeywords(new Set())}>None</button>
                      </div>
                    </div>

                    <div style={styles.kwGrid}>
                      {missingKeywords.map((item, idx) => {
                        const sel = selectedKeywords.has(item.keyword);
                        const accent = categoryColor[item.category] || "#6b7280";
                        return (
                          <div
                            key={idx}
                            style={{ ...styles.kwCard, borderColor: sel ? accent : "#e5e7eb", background: sel ? `${accent}0d` : "#fff" }}
                            onClick={() => toggleKeyword(item.keyword)}
                          >
                            <div style={{ ...styles.kwCheck, borderColor: sel ? accent : "#d1d5db", background: sel ? accent : "transparent" }}>
                              {sel && <CheckIcon />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{item.keyword}</div>
                              <div style={{ fontSize: 11, color: accent, fontWeight: 500, marginTop: 2 }}>{item.category}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {error && <div style={styles.errorBanner}>⚠️ {error}</div>}
              </div>

              <div style={styles.footer}>
                <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
                <button
                  style={{ ...styles.btnPrimary, opacity: loading || selectedKeywords.size === 0 ? 0.55 : 1 }}
                  onClick={handleGenerate}
                  disabled={loading || selectedKeywords.size === 0}
                >
                  {loading ? <><Spinner size={15} />&nbsp;Generating…</> : "Generate Preview →"}
                </button>
              </div>
            </>
          )}

          {/* ════════════════ STEP 3 — Preview ══════════════════════════════ */}
          {step === 3 && (
            <>
              <div style={styles.slideHeader}>
                <h2 style={styles.h2}>📄 Resume Comparison</h2>
                <p style={styles.subtext}>Review changes before downloading • Full formatting preserved</p>
              </div>

              <div style={styles.previewArea}>
                {/* Left panel — original */}
                <div style={styles.previewPanel}>
                  <div style={styles.panelHeader}>
                    <span style={styles.panelTitle}>Original Resume</span>
                  </div>
                  {/* panelScroll is now handled INSIDE DocxViewer itself */}
                  <div style={styles.panelBody}>
                    <DocxViewer url={originalDocxUrl} label="Original Resume" />
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Right panel — tailored */}
                <div style={styles.previewPanel}>
                  <div style={styles.panelHeader}>
                    <span style={styles.panelTitle}>Tailored Resume</span>
                    <span style={styles.badge}>{selectedKeywords.size} skills added</span>
                  </div>
                  <div style={styles.panelBody}>
                    {tailoredDocxUrl
                      ? <DocxViewer url={tailoredDocxUrl} label="Tailored Resume" />
                      : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
                          <Spinner size={24} />&nbsp;Waiting for tailored file…
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>

              {error && <div style={{ ...styles.errorBanner, margin: "0 28px 8px" }}>⚠️ {error}</div>}

              <div style={styles.footer}>
                <button style={styles.btnSecondary} onClick={() => setStep(2)}>← Back</button>
                <button
                  style={{ ...styles.btnPrimary, opacity: tailoredResumeId ? 1 : 0.5 }}
                  onClick={handleDownload}
                  disabled={!tailoredResumeId}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  &nbsp;Download Tailored Resume
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 9999,
  },
  modal: {
    background: "#fff", borderRadius: "18px 0 0 18px", width: "90%",
    height: "100vh", display: "flex", flexDirection: "column",
    position: "relative", overflow: "hidden",
    boxShadow: "-8px 0 40px rgba(0,0,0,.25)",
    animation: "slideInRight .3s ease",
  },
  progressBar: {
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "22px 28px 16px", borderBottom: "1px solid #f1f5f9", gap: 0, flexShrink: 0,
  },
  stepWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5 },
  stepCircle: {
    width: 32, height: 32, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
    boxShadow: "0 1px 4px rgba(0,0,0,.1)",
  },
  stepLabel: { fontSize: 11, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" },
  closeBtn: {
    position: "absolute", top: 18, right: 20, width: 32, height: 32,
    borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer",
    fontSize: 15, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
  },

  slideCenter: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  slideHeader: { padding: "18px 28px 6px", flexShrink: 0 },
  h2: { fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 },
  subtext: { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },

  analyzeBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#374151" },
  analyzeSteps: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
  analyzeStep: {
    display: "flex", alignItems: "center", gap: 10, fontSize: 13,
    color: "#6b7280", animation: "pulse 1.6s ease-in-out infinite",
  },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#22c55e" },

  jobCtx: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 28px 12px", fontSize: 13, color: "#111827", flexShrink: 0,
  },
  dot2: { width: 4, height: 4, borderRadius: "50%", background: "#d1d5db" },

  kwHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  btnText: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6366f1", fontWeight: 600, padding: "2px 4px" },
  kwGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, paddingBottom: 16 },
  kwCard: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
    border: "1.5px solid", borderRadius: 10, cursor: "pointer",
    transition: "all .15s ease", userSelect: "none",
  },
  kwCheck: {
    width: 20, height: 20, borderRadius: 5, border: "2px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", flexShrink: 0, transition: "all .15s",
  },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0", color: "#374151", fontSize: 14 },
  errorBanner: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: 8, padding: "10px 14px", fontSize: 13, margin: "8px 0",
  },

  /* Preview layout — panelBody fills remaining space, DocxViewer scrolls inside */
  previewArea: {
    flex: 1, display: "flex", overflow: "hidden", minHeight: 0,
  },
  previewPanel: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  panelHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px", borderBottom: "1px solid #f1f5f9",
    flexShrink: 0, background: "#fafafa",
  },
  panelTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#374151" },
  badge: {
    fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#16a34a",
    borderRadius: 20, padding: "3px 10px", letterSpacing: ".02em",
  },
  panelBody: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  divider: { width: 1, background: "#e5e7eb", flexShrink: 0 },

  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 28px", borderTop: "1px solid #f1f5f9", flexShrink: 0, background: "#fff",
  },
  btnSecondary: {
    padding: "9px 20px", border: "1.5px solid #e5e7eb", borderRadius: 10,
    background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151",
  },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "9px 22px", border: "none", borderRadius: 10,
    background: "#111827", color: "#fff", cursor: "pointer",
    fontSize: 14, fontWeight: 600, transition: "opacity .15s",
  },
};