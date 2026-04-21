export default function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13,2 13,9 20,9"/>
        </svg>
      ),
      title: "Instant Resume Parsing",
      desc: "Upload your PDF or DOCX resume and our AI extracts skills, experience, roles, and keywords in seconds.",
      color: "blue"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M11 8v6M8 11h6" strokeWidth="2"/>
        </svg>
      ),
      title: "Semantic Job Matching",
      desc: "Advanced embedding-based similarity matching finds jobs that truly align with your skills — not just keyword overlap.",
      color: "indigo"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
        </svg>
      ),
      title: "Match Score Insight",
      desc: "Every job gets a precise percentage match score so you can prioritize your strongest opportunities first.",
      color: "green"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      title: "AI Resume Tailoring",
      desc: "Generate a customized resume version for any job posting with one click, using AI to highlight the right experiences.",
      color: "purple"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      title: "Resume Library",
      desc: "Store and manage multiple resume versions. Compare different resumes to see which performs better for each role.",
      color: "teal"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>
        </svg>
      ),
      title: "Application Tracker",
      desc: "Track every job application from applied to interview. See your progress pipeline at a glance with real-time updates.",
      color: "orange"
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Upload Your Resume",
      desc: "Drop your PDF or DOCX resume. Our parser instantly extracts your skills, experiences, and career profile.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      )
    },
    {
      num: "02",
      title: "Get Smart Job Matches",
      desc: "We semantically match your profile against hundreds of live job postings and score each one by fit.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      )
    },
    {
      num: "03",
      title: "Apply with Confidence",
      desc: "Review scored matches, tailor your resume with AI, apply to the best fits, and track every application.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      )
    },
  ];

  const stats = [
    { num: "250+", label: "Jobs Analyzed" },
    { num: "<15s", label: "Match Time" },
    { num: "95%", label: "Accuracy Score" },
    { num: "3x", label: "Faster than AI" },
  ];

  return (
    <div className="landing-page">

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Job Matching
          </div>
          <h1 className="hero-title">
            Find jobs that<br />
            <span className="hero-title-gradient">truly match</span> your skills
          </h1>
          <p className="hero-subtitle">
            Upload your resume and get semantic job matches powered by advanced embeddings.
            Stop guessing — know exactly which roles fit your profile.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => onNavigate("uploader")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              </svg>
              Try Now — It's Free
            </button>
            <button className="btn-hero-secondary" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
            </button>
          </div>
          <div className="hero-stats-row">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat-item">
                <div className="hero-stat-num">{s.num}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <div className="section-tag">Process</div>
            <h2 className="section-title">How CareerLens Works</h2>
            <p className="section-desc">Three simple steps to find your next great opportunity</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{step.num}</div>
                <div className="step-icon-wrap">
                  {step.icon}
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section section-alt">
        <div className="section-container">
          <div className="section-header">
            <div className="section-tag">Features</div>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-desc">A complete platform to supercharge your job search from resume to offer</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card feature-${f.color}`}>
                <div className="feature-icon">
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <div className="cta-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="cta-title">Ready to find your perfect role?</h2>
            <p className="cta-desc">Upload your resume in seconds and get matched to jobs you'll actually want to apply for.</p>
            <button className="btn-cta-main" onClick={() => onNavigate("uploader")}>
              Upload Resume Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                  <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6"/>
                </svg>
              </div>
              <span className="footer-logo-text">Career<span>Lens</span></span>
            </div>
            <p className="footer-tagline">AI-powered job matching that understands your career profile.</p>
          </div>
          <div className="footer-links">
            <div className="footer-link-group">
              <div className="footer-link-head">Navigate</div>
              <button className="footer-link" onClick={() => onNavigate("uploader")}>Resume Match</button>
              <button className="footer-link" onClick={() => onNavigate("library")}>Resume Library</button>
              <button className="footer-link" onClick={() => onNavigate("jobs")}>Job Tracker</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 CareerLens. Built with semantic AI matching.</span>
          <div className="footer-tech-badges">
            <span className="tech-badge">Embedding Search</span>
            <span className="tech-badge">AI-Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
