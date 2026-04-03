import { useState, createContext } from "react";
import ResumeUploader from "./components/ResumeUploader.jsx";
import ResumeLibrary from "./components/ResumeLibrary.jsx";
import JobsTracker from "./components/JobsTracker.jsx";

export const AppliedJobsContext = createContext();

const navStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #ffffff;
    --off-white: #fafafa;
    --bg: #f5f5f3;
    --border: #e5e5e2;
    --border-light: #efefed;
    --text-primary: #0f0f0f;
    --text-secondary: #525252;
    --text-muted: #a3a3a3;
    --accent: #0f0f0f;
    --accent-hover: #262626;
    --blue: #2563eb;
    --green: #16a34a;
    --green-light: #dcfce7;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06);
    --font-sans: 'Plus Jakarta Sans', sans-serif;
    --font-serif: 'Instrument Serif', serif;
  }

  html, body {
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }

  /* ── NAVBAR ── */
  .app-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--border);
    height: 68px;
    display: flex;
    align-items: center;
    padding: 0 40px;
  }

  .nav-inner {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .nav-brand-icon {
    width: 36px;
    height: 36px;
    background: var(--text-primary);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-brand-name {
    font-family: var(--font-sans);
    font-weight: 800;
    font-size: 1.2rem;
    letter-spacing: -0.03em;
    color: var(--text-primary);
  }

  .nav-brand-name span {
    color: var(--text-muted);
    font-weight: 400;
  }

  .nav-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 4px;
  }

  .nav-tab {
    padding: 8px 20px;
    border-radius: var(--radius-sm);
    font-size: 0.855rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    border: none;
    background: transparent;
    transition: all 0.18s ease;
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    font-family: var(--font-sans);
  }

  .nav-tab:hover {
    color: var(--text-primary);
    background: rgba(0,0,0,0.04);
  }

  .nav-tab.active {
    background: var(--white);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
  }

  .nav-tab-icon {
    font-size: 0.95rem;
    opacity: 0.7;
  }

  .nav-tab.active .nav-tab-icon {
    opacity: 1;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .nav-badge {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 5px 12px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge-dot {
    width: 5px;
    height: 5px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.3); }
  }

  /* Tab Content */
  .tab-panel {
    animation: fadeIn 0.22s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .app-nav { padding: 0 16px; height: 60px; }
    .nav-brand-name { font-size: 1rem; }
    .nav-tab { padding: 7px 12px; font-size: 0.8rem; }
    .nav-badge { display: none; }
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState("uploader");
  const [appliedJobsRefreshTrigger, setAppliedJobsRefreshTrigger] = useState(0);
  const [resumeUploadTrigger, setResumeUploadTrigger] = useState(0);

  const triggerAppliedJobsRefresh = () => setAppliedJobsRefreshTrigger(prev => prev + 1);
  const triggerResumeUpload = () => setResumeUploadTrigger(prev => prev + 1);

  const tabs = [
    { 
      id: "uploader", 
      label: "Upload Resume", 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,5 17,10"/>
          <line x1="12" y1="5" x2="12" y2="15"/>
        </svg>
      )
    },
    { 
      id: "library", 
      label: "Resume Library", 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    { 
      id: "jobs", 
      label: "Jobs Tracker", 
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M8 14h.01"/>
          <path d="M12 14h.01"/>
          <path d="M16 14h.01"/>
          <path d="M8 18h.01"/>
          <path d="M12 18h.01"/>
          <path d="M16 18h.01"/>
        </svg>
      )
    },
  ];

  return (
    <AppliedJobsContext.Provider value={{
      appliedJobsRefreshTrigger, triggerAppliedJobsRefresh,
      resumeUploadTrigger, triggerResumeUpload, activeTab
    }}>
      <style>{navStyles}</style>

      <nav className="app-nav">
        <div className="nav-inner">
          {/* Brand */}
          <div className="nav-brand">
            <div className="nav-brand-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14 5V11L8 14.5L2 11V5L8 1.5Z" fill="white" stroke="white" strokeWidth="0.5"/>
                <circle cx="8" cy="8" r="2.5" fill="#0f0f0f"/>
              </svg>
            </div>
            <span className="nav-brand-name">Job<span>Sphere</span></span>
          </div>

          {/* Tabs */}
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="nav-right">
            <div className="nav-badge">
              <span className="badge-dot" />
              AI Powered
            </div>
          </div>
        </div>
      </nav>

      {activeTab === "uploader" && (
        <div className="tab-panel"><ResumeUploader /></div>
      )}
      {activeTab === "library" && (
        <div className="tab-panel"><ResumeLibrary /></div>
      )}
      {activeTab === "jobs" && (
        <div className="tab-panel"><JobsTracker /></div>
      )}
    </AppliedJobsContext.Provider>
  );
}

export default App;