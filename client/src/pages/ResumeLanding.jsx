import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ResumeAnalysisContext } from "../context/ResumeAnalysisContext";

export default function ResumeLanding() {
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const { setAnalysis } = useContext(ResumeAnalysisContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload your resume file.");
      return;
    }
    const formData = new FormData();
    formData.append('candidateName', candidateName);
    formData.append('jobRole', jobRole);
    formData.append('jobDesc', jobDesc);
    formData.append('yearsExp', yearsExp);
    formData.append('resumeFile', file);

    try {
      const response = await fetch('http://localhost:4000/api/resumeAnalyzer/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        alert("Server error: " + response.status);
        return;
      }
      const data = await response.json();
      console.log("API analysis response:", data);

      if (!data || typeof data !== "object" || !data.atsScore) {
        alert("Invalid response from server.");
        return;
      }
      setAnalysis(data);
      navigate('/resume/result');
    } catch (err) {
      alert("Network error. See console for details.");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: "56px auto", background: "rgba(255,255,255,0.7)", borderRadius: 20, padding: 32, boxShadow: "0 0 14px #ddd" }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Smart feedback<br />for your dream job</h2>
      <p style={{ marginBottom: 28, color: "#555" }}>Drop your resume for an ATS score and improvement tips.</p>
      <form onSubmit={handleSubmit}>
        <label>Candidate Name</label>
        <input type="text" required value={candidateName} onChange={e => setCandidateName(e.target.value)} style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />
        <label>Select Job</label>
        <select required value={jobRole} onChange={e => setJobRole(e.target.value)} style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }}>
          <option value="">Select job role...</option>
          <option>Frontend Developer</option>
          <option>Backend Developer</option>
          <option>Fullstack Developer</option>
          <option>Data Scientist</option>
        </select>
        <label>Job Description</label>
        <textarea required value={jobDesc} onChange={e => setJobDesc(e.target.value)}
          placeholder="Write a clear & concise job description with responsibilities & expectations..."
          style={{ width: "100%", marginBottom: 18, padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee", minHeight: 64 }} />
        <label>Years of Experience</label>
        <input type="number" min="0" required value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />
        <label>Upload Resume</label>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" required onChange={e => setFile(e.target.files[0])} style={{ width: "100%", marginBottom: 28, padding: "8px 0" }} />
        <button type="submit" style={{
          width: "100%",
          background: "linear-gradient(90deg,#5d5fef,#a1a5f4)",
          color: "white",
          fontWeight: 600,
          fontSize: 19,
          padding: "15px 0",
          borderRadius: 14,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 12px #bcbcf2"
        }}>
          Save & Analyze Resume
        </button>
      </form>
    </div>
  );
}
