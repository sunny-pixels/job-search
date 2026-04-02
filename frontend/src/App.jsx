import { useState, createContext, useContext } from "react";
import ResumeUploader from "./components/ResumeUploader.jsx";
import ResumeLibrary from "./components/ResumeLibrary.jsx";
import JobsTracker from "./components/JobsTracker.jsx";

// Create a context for sharing applied jobs state
export const AppliedJobsContext = createContext();

function App() {
  const [activeTab, setActiveTab] = useState("uploader");
  const [appliedJobsRefreshTrigger, setAppliedJobsRefreshTrigger] = useState(0);
  const [resumeUploadTrigger, setResumeUploadTrigger] = useState(0);

  // Function to trigger refresh in Resume Library when a job is marked as applied
  const triggerAppliedJobsRefresh = () => {
    setAppliedJobsRefreshTrigger(prev => prev + 1);
  };

  // Function to trigger refresh in Resume Library when a new resume is uploaded
  const triggerResumeUpload = () => {
    setResumeUploadTrigger(prev => prev + 1);
  };

  return (
    <AppliedJobsContext.Provider value={{ appliedJobsRefreshTrigger, triggerAppliedJobsRefresh, resumeUploadTrigger, triggerResumeUpload, activeTab }}>
      <div>
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(249,249,247,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #e8e8e3",
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.25rem",
          letterSpacing: "-0.02em",
          color: "#111"
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            background: "#111",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#f9f9f7">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z"/>
            </svg>
          </div>
          JobSphere
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("uploader")}
            style={{
              padding: "8px 18px",
              background: activeTab === "uploader" ? "#111" : "#fafaf8",
              border: "1px solid " + (activeTab === "uploader" ? "#111" : "#e0e0d8"),
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: activeTab === "uploader" ? "#fff" : "#444",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Upload Resume
          </button>
          <button
            onClick={() => setActiveTab("library")}
            style={{
              padding: "8px 18px",
              background: activeTab === "library" ? "#111" : "#fafaf8",
              border: "1px solid " + (activeTab === "library" ? "#111" : "#e0e0d8"),
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: activeTab === "library" ? "#fff" : "#444",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Resume Library
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            style={{
              padding: "8px 18px",
              background: activeTab === "jobs" ? "#111" : "#fafaf8",
              border: "1px solid " + (activeTab === "jobs" ? "#111" : "#e0e0d8"),
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: activeTab === "jobs" ? "#fff" : "#444",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Jobs Tracker
          </button>
        </div>
      </nav>

      <div style={{ display: activeTab === "uploader" ? "block" : "none" }}>
        <ResumeUploader />
      </div>
      <div style={{ display: activeTab === "library" ? "block" : "none" }}>
        <ResumeLibrary />
      </div>
      <div style={{ display: activeTab === "jobs" ? "block" : "none" }}>
        <JobsTracker />
      </div>
    </div>
    </AppliedJobsContext.Provider>
  );
}

export default App;