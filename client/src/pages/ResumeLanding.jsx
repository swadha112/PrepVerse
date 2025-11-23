import { useState } from "react";
import { useNavigate } from "react-router-dom";

const jobRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "UI/UX Designer",
];

export default function ResumeLanding() {
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobDescFile, setJobDescFile] = useState(null);
  const [yearsExp, setYearsExp] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [descFileName, setDescFileName] = useState("");
  const navigate = useNavigate();

  // Unified Job Role field - allows typing or picking
  const handleJobRoleChange = (e) => {
    setJobRole(e.target.value);
  };

  // Job Description file upload
  const handleJobDescFileChange = e => {
    const file = e.target.files[0];
    if (file && /\.(pdf|docx|txt)$/i.test(file.name)) {
      setJobDescFile(file);
      setDescFileName(file.name);
    } else {
      alert("Please select a PDF, DOCX, or TXT file for job description.");
      setDescFileName("");
    }
  };

  // Resume file upload
  const handleResumeFileChange = e => {
    const file = e.target.files[0];
    setFile(file);
    setFilePreview(file ? file.name : "");
  };

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
    if (jobDescFile) {
      formData.append('jobDescFile', jobDescFile);
    }
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
      if (!data || typeof data !== "object" || !data.atsScore) {
        alert("Invalid response from server.");
        return;
      }
      navigate('/resume/result', { state: { analysis: data } });
    } catch (err) {
      alert("Network error. See console for details.");
      console.error(err);
    }
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: "56px auto",
      background: "rgba(255,255,255,0.7)",
      borderRadius: 20,
      padding: 32,
      boxShadow: "0 0 14px #ddd"
    }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Smart feedback<br />for your dream job</h2>
      <p style={{ marginBottom: 28, color: "#555" }}>Drop your resume for an ATS score and improvement tips.</p>
      <form onSubmit={handleSubmit}>
        <label>Candidate Name</label>
        <input type="text" required value={candidateName} onChange={e => setCandidateName(e.target.value)} style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />

        {/* Single Job Role field: autocomplete and select */}
        <label style={{ marginBottom: 8 }}>Select Job Role (type or pick)</label>
        <input
          type="text"
          required
          value={jobRole}
          onChange={handleJobRoleChange}
          placeholder="Type or select job role..."
          list="jobRoles-suggestions"
          style={{
            width: "100%", marginBottom: 18, padding: "10px 14px",
            fontSize: 16, borderRadius: 10, border: "1.8px solid #eee"
          }}
        />
        <datalist id="jobRoles-suggestions">
          {jobRoles.map(role => (
            <option key={role} value={role} />
          ))}
        </datalist>

        {/* Unified Job Description entry */}
        <label>Job Description (type or upload)</label>
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 18
        }}>
          <textarea
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder="Write a clear & concise job description with responsibilities & expectations..."
            style={{
              flex: "2", minWidth: "65%",
              padding: "12px 14px", fontSize: 16, borderRadius: 10,
              border: "1.8px solid #eee", minHeight: 64
            }}
          />
          <div style={{ flex: "1", minWidth: 120, textAlign: "center" }}>
            <label htmlFor="jobDescFile" style={{
              display: "block", fontSize: 14,
              color: "#444", marginBottom: 3,
              fontWeight: 600
            }}>Upload Job Description</label>
            <input
              id="jobDescFile"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleJobDescFileChange}
              style={{ marginBottom: 6, width: "100%" }}
            />
            <label style={{ fontSize: 12, color: "#777" }}>PDF, DOCX, TXT</label>
            {descFileName && <div style={{ fontSize:12, color: "#222", marginTop: 4 }}>{descFileName}</div>}
          </div>
        </div>

        <label>Years of Experience</label>
        <input type="number" min="0" required value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />

        {/* Resume Upload Box */}
        <label>Upload Resume</label>
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          border: "2px dashed #a8a8ff",
          borderRadius: 15,
          padding: "26px 0 18px",
          marginBottom: 28,
          background: "#f7f8ff"
        }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135808.png"
            alt="Resume icon"
            style={{ width: 48, height: 48, marginBottom: 10, opacity: 0.7 }}
          />
          <input
            type="file"
            accept=".doc,.docx,.pdf,.html,.rtf,.txt"
            required
            onChange={handleResumeFileChange}
            style={{ width: "85%", marginTop: 6 }}
          />
          <div style={{ fontSize: 15, color: "#666", marginTop: 8, marginBottom: 2 }}>
            DOC, DOCX, PDF, HTML, RTF, TXT files up to 5MB
          </div>
          {filePreview && <div style={{ marginTop: 6, color: "#333", fontSize: 15 }}>Selected: {filePreview}</div>}
        </div>
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
