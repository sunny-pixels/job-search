import { useState, createContext } from "react";
import ResumeUploader from "./components/ResumeUploader.jsx";
import ResumeLibrary from "./components/ResumeLibrary.jsx";
import JobsTracker from "./components/JobsTracker.jsx";
import "./App.css";

export const AppliedJobsContext = createContext();

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
              Smart Matching
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