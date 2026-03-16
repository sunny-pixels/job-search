import { useState } from "react";

export default function ResumeUploader() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file first.");
            return;
        }

        setLoading(true);
        setMessage("");
        setAnalysis(null);
        setJobs([]);

        const formData = new FormData();
        formData.append("resume", file);

        try {
            const response = await fetch("http://localhost:3001/api/resume/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const data = await response.json();
            setMessage("✅ Resume analyzed successfully!");
            setAnalysis(data.analysis);

            // Automatically fetch matching jobs
            fetchMatchingJobs();

        } catch (error) {
            console.error("Upload error:", error);
            setMessage(`❌ Upload failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchMatchingJobs = async (page = 1) => {
        setLoadingJobs(true);
        setCurrentPage(page);
        
        try {
            const response = await fetch(`http://localhost:3001/api/resume/jobs?page=${page}&limit=12`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch jobs: ${response.status}`);
            }

            const data = await response.json();
            setJobs(data.jobs || []);
            setPagination(data.pagination);
            
            // Scroll to jobs section
            if (data.jobs && data.jobs.length > 0) {
                setTimeout(() => {
                    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
            
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoadingJobs(false);
        }
    };

    // Company logo mapping (using placeholder service)
    const getCompanyLogo = (company) => {
        const companyLower = company.toLowerCase();
        // Using UI Avatars as fallback
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random&size=80&bold=true`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        🎯 AI Resume Job Matcher
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Upload your resume and find matching jobs from top companies
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Upload Section */}
                <div className="bg-white shadow-lg rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                        📄 Upload Your Resume
                    </h2>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="flex-1 border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        />

                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md"
                        >
                            {loading ? "🔄 Analyzing..." : "🚀 Analyze Resume"}
                        </button>
                    </div>

                    {message && (
                        <p className="mt-4 text-center text-sm font-semibold text-green-600">
                            {message}
                        </p>
                    )}
                </div>

                {/* Analysis Section */}
                {analysis && (
                    <div className="bg-white shadow-lg rounded-2xl p-8 mb-8">
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                            🤖 AI Analysis
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">📋 Primary Roles</h4>
                                <p className="text-gray-700">{analysis.primary_roles.join(", ")}</p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-900 mb-2">💼 Experience</h4>
                                <p className="text-gray-700">{analysis.experience_level} ({analysis.experience_years} years)</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="font-semibold text-green-900 mb-2">💻 Languages</h4>
                                <p className="text-gray-700">{analysis.programming_languages.join(", ") || "Not specified"}</p>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-4">
                                <h4 className="font-semibold text-orange-900 mb-2">🛠️ Frameworks</h4>
                                <p className="text-gray-700">{analysis.frameworks.join(", ") || "Not specified"}</p>
                            </div>

                            <div className="bg-pink-50 rounded-lg p-4 md:col-span-2">
                                <h4 className="font-semibold text-pink-900 mb-2">🔍 Job Keywords ({analysis.job_keywords.length})</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {analysis.job_keywords.map((keyword, idx) => (
                                        <span key={idx} className="bg-pink-200 text-pink-900 px-3 py-1 rounded-full text-sm font-medium">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Jobs Section */}
                {loadingJobs && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 font-medium">🔍 Searching for matching jobs...</p>
                    </div>
                )}

                {!loadingJobs && jobs.length > 0 && (
                    <div id="jobs-section" className="bg-white shadow-lg rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-gray-800">
                                💼 Matching Jobs {pagination && `(${pagination.total_jobs})`}
                            </h3>
                            <button
                                onClick={() => fetchMatchingJobs(1)}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {/* Pagination Info */}
                        {pagination && (
                            <div className="mb-4 text-center text-sm text-gray-600">
                                Page {pagination.current_page} of {pagination.total_pages} • 
                                Showing {jobs.length} of {pagination.total_jobs} jobs
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job, idx) => (
                                <div
                                    key={idx}
                                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                                >
                                    {/* Company Logo & Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <img
                                            src={getCompanyLogo(job.company)}
                                            alt={job.company}
                                            className="w-12 h-12 rounded-lg shadow-md"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{job.company}</h4>
                                            <p className="text-xs text-gray-500">{job.source}</p>
                                        </div>
                                    </div>

                                    {/* Job Title */}
                                    <h5 className="font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[3rem]">
                                        {job.title}
                                    </h5>

                                    {/* Location & Department */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>📍</span>
                                            <span className="line-clamp-1">{job.location}</span>
                                        </div>
                                        {job.department !== "N/A" && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>🏢</span>
                                                <span className="line-clamp-1">{job.department}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Apply Button */}
                                    <a
                                        href={job.job_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                                    >
                                        Apply Now →
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination && pagination.total_pages > 1 && (
                            <div className="mt-8 flex justify-center items-center gap-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => fetchMatchingJobs(currentPage - 1)}
                                    disabled={!pagination.has_prev}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    ← Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex gap-2">
                                    {Array.from({ length: Math.min(pagination.total_pages, 10) }, (_, i) => {
                                        const pageNum = i + 1;
                                        
                                        // Show first 3, last 3, and current page with neighbors
                                        const showPage = 
                                            pageNum <= 3 || 
                                            pageNum > pagination.total_pages - 3 ||
                                            Math.abs(pageNum - currentPage) <= 1;
                                        
                                        if (!showPage && pageNum === 4) {
                                            return <span key={pageNum} className="px-2">...</span>;
                                        }
                                        
                                        if (!showPage) return null;
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => fetchMatchingJobs(pageNum)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => fetchMatchingJobs(currentPage + 1)}
                                    disabled={!pagination.has_next}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!loadingJobs && jobs.length === 0 && analysis && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
                        <p className="text-yellow-800 font-medium">
                            🔍 No matching jobs found. Try uploading a different resume or check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}