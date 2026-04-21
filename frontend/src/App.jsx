import { useState, createContext } from "react";

// Embedding-based scoring (Fast semantic matching)
import ResumeUploaderEmbedding from "./components/ResumeUploaderEmbedding.jsx";
import ResumeLibrary from "./components/ResumeLibrary.jsx";
import JobsTracker from "./components/JobsTracker.jsx";
import LandingPage from "./components/LandingPage.jsx";
import "./App.css";

export const AppliedJobsContext = createContext();

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [appliedJobsRefreshTrigger, setAppliedJobsRefreshTrigger] = useState(0);
  const [resumeUploadTrigger, setResumeUploadTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const triggerAppliedJobsRefresh = () => setAppliedJobsRefreshTrigger(prev => prev + 1);
  const triggerResumeUpload = () => setResumeUploadTrigger(prev => prev + 1);

  const navLinks = [
    {
      id: "uploader",
      label: "Match",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17,8 12,3 7,8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )
    },
    {
      id: "library",
      label: "Library",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    },
    {
      id: "jobs",
      label: "Tracker",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      )
    },
  ];

  return (
    <AppliedJobsContext.Provider value={{
      appliedJobsRefreshTrigger, triggerAppliedJobsRefresh,
      resumeUploadTrigger, triggerResumeUpload, activeTab
    }}>

      {/* NAVBAR */}
      <nav className="app-nav">
        <div className="nav-container">
          {/* Logo Left */}
          <button className="nav-logo" onClick={() => setActiveTab("home")}>
            <div className="nav-logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6"/>
              </svg>
            </div>
            <span className="nav-logo-text">
              Career<span>Lens</span>
            </span>
          </button>

          {/* Links Right */}
          <div className="nav-links">
            {navLinks.map(link => (
              <button
                key={link.id}
                className={`nav-link ${activeTab === link.id ? "active" : ""}`}
                onClick={() => setActiveTab(link.id)}
              >
                <span className="nav-link-icon">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
            <button
              className="nav-cta"
              onClick={() => setActiveTab("uploader")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              </svg>
              Try Now
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="nav-mobile-menu">
            {navLinks.map(link => (
              <button
                key={link.id}
                className={`nav-mobile-link ${activeTab === link.id ? "active" : ""}`}
                onClick={() => { setActiveTab(link.id); setMobileMenuOpen(false); }}
              >
                <span className="nav-link-icon">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* PAGE CONTENT */}
      <div className="page-root">
        {activeTab === "home" && (
          <div className="tab-panel">
            <LandingPage onNavigate={setActiveTab} />
          </div>
        )}
        {activeTab === "uploader" && (
          <div className="tab-panel">
            <ResumeUploaderEmbedding />
          </div>
        )}
        {activeTab === "library" && (
          <div className="tab-panel">
            <ResumeLibrary />
          </div>
        )}
        {activeTab === "jobs" && (
          <div className="tab-panel">
            <JobsTracker />
          </div>
        )}
      </div>
    </AppliedJobsContext.Provider>
  );
}

export default App;