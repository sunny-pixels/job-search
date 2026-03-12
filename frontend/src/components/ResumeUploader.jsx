import { useState } from "react";

export default function ResumeUploader() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

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
        setAnalysis("");

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
            setMessage("Upload successful!");

            // Format the analysis for display
            if (data.analysis) {
                const a = data.analysis;
                const formatted = `
📋 Primary Roles: ${a.primary_roles.length > 0 ? a.primary_roles.join(", ") : "Not specified"}

💼 Experience: ${a.experience_level} (${a.experience_years} years)

💻 Programming Languages: ${a.programming_languages.length > 0 ? a.programming_languages.join(", ") : "Not specified"}

🛠️ Frameworks: ${a.frameworks.length > 0 ? a.frameworks.join(", ") : "Not specified"}

🔧 Tools: ${a.tools.length > 0 ? a.tools.join(", ") : "Not specified"}

⭐ Skills: ${a.skills.length > 0 ? a.skills.join(", ") : "Not specified"}

🔍 Job Keywords (${a.job_keywords.length}): ${a.job_keywords.length > 0 ? a.job_keywords.join(", ") : "Not specified"}
        `.trim();

                setAnalysis(formatted);
            }

            console.log("Upload response:", data);
        } catch (error) {
            console.error("Upload error:", error);
            setMessage(`Upload failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-md rounded-xl p-8 w-96">

                <h2 className="text-2xl font-semibold mb-4 text-center">
                    Upload Resume
                </h2>

                <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full mb-4 border p-2 rounded"
                />

                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? "Analyzing..." : "Upload Resume"}
                </button>

                {message && (
                    <p className="mt-4 text-center text-sm text-green-600 font-semibold">
                        {message}
                    </p>
                )}

                {analysis && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                        <h3 className="font-semibold mb-2">AI Analysis:</h3>
                        <p className="text-sm whitespace-pre-wrap">{analysis}</p>
                    </div>
                )}
            </div>
        </div>
    );
}