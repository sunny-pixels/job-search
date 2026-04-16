import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TailorResumeModal({ job, resumeId, originalScore, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTailor = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎨 Tailoring resume:', { resumeId, jobId: job.job_id });
      
      const response = await fetch(`${API_URL}/api/tailored-resume/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          jobData: {
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            job_description: job.job_description,
            job_highlights: job.job_highlights
          },
          originalScore: originalScore || job.embedding_match_score
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Tailor error response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to tailor resume');
      }

      const data = await response.json();
      console.log('✅ Tailored resume created:', data);

      // Call success callback
      if (onSuccess) {
        onSuccess(data.tailoredResume);
      }

      // Auto-download the file
      if (data.tailoredResume?._id) {
        console.log('📥 Starting automatic download...');
        const downloadUrl = `${API_URL}/api/tailored-resume/download/${data.tailoredResume._id}`;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${data.tailoredResume.company}_${data.tailoredResume.jobTitle}_Resume.docx`.replace(/[^a-zA-Z0-9_-]/g, '_');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download triggered successfully');
      }

      onClose();

    } catch (err) {
      console.error('❌ Tailor error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🎨 AI Tailor Resume</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="tailor-info">
            <div className="tailor-job-info">
              <div className="tailor-label">Job Position</div>
              <div className="tailor-value">{job.job_title}</div>
            </div>
            <div className="tailor-job-info">
              <div className="tailor-label">Company</div>
              <div className="tailor-value">{job.employer_name}</div>
            </div>
            <div className="tailor-job-info">
              <div className="tailor-label">Current Match Score</div>
              <div className="tailor-value">{originalScore || job.embedding_match_score}%</div>
            </div>
          </div>

          <div className="tailor-explanation">
            <h3>What will happen?</h3>
            <ul>
              <li>✨ AI will analyze the job requirements and tailor your resume</li>
              <li>🎯 Emphasize relevant skills and experience for this specific role</li>
              <li>📝 Rewrite bullet points to match job description keywords</li>
              <li>🚀 Potentially improve your match score by 10-25%</li>
              <li>📄 Generate a professional DOCX file ready to submit</li>
            </ul>
          </div>

          <div className="tailor-note">
            <strong>Note:</strong> Your original resume stays unchanged. This creates a new tailored version specifically for this job.
          </div>

          {error && (
            <div className="tailor-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-modal-confirm" onClick={handleTailor} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-small" />
                <span>Tailoring Resume...</span>
              </>
            ) : (
              <span>🎨 Tailor Resume</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
