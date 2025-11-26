/* import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractPdfText } from "../utils/pdfExtract";

const jobRoles = [
  "Software Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile App Developer (Android/iOS)",
  "QA / Test Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Database Engineer",
  "Site Reliability Engineer (SRE)",
  "UI/UX Designer",
  "Data Analyst",
  "Data Engineer",
  "AI / ML Engineer",
  "Cybersecurity Analyst",
  "Blockchain Developer",
  "IoT Engineer",
 "UI/UX Designer", 
 "Graphic Designer", 
 "Video Editor", 
 "Content Writer", 
 "Social Media Manager",
];

export default function ResumeLanding() {
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const navigate = useNavigate();

  // Job Role handler
  const handleJobRoleChange = (e) => {
    setJobRole(e.target.value);
  };

  // Resume file client-side extraction
  const handleResumeFileChange = async (e) => {
    const file = e.target.files[0];
    setFilePreview(file ? file.name : "");
    if (file) {
      if (file.type === "application/pdf") {
        try {
          const text = await extractPdfText(file);
          setResumeText(text);
        } catch (err) {
          alert("Could not extract text from PDF file.");
        }
      } else {
        alert("For now, only PDF is supported for text extraction.");
      }
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeText) {
      alert("Please select a resume file and extract its text.");
      return;
    }
    const payload = {
      candidateName,
      jobRole,
      jobDesc,
      yearsExp,
      resumeText,
    };
    try {
      const response = await fetch('http://localhost:4000/api/resumeAnalyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        alert("Server error: " + response.status);
        return;
      }
      const data = await response.json();
      alert("Resume submitted successfully!");
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
        <input type="text" required value={candidateName} onChange={e => setCandidateName(e.target.value)}
          style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />

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

        <label>Job Description</label>
        <textarea
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
          placeholder="Write a clear & concise job description with responsibilities & expectations..."
          style={{
            width: "100%", marginBottom: 18, padding: "12px 14px", fontSize: 16, borderRadius: 10,
            border: "1.8px solid #eee", minHeight: 64
          }}
        />

        <label>Years of Experience</label>
        <input type="number" min="0" required value={yearsExp} onChange={e => setYearsExp(e.target.value)}
          style={{ width: "100%", marginBottom: 18, padding: "10px 14px", fontSize: 16, borderRadius: 10, border: "1.8px solid #eee" }} />

        
        <label>Resume (PDF only for extract)</label>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          border: "2px dashed #a8a8ff", borderRadius: 15, padding: "20px 0 10px",
          marginBottom: 22, background: "#f7f8ff"
        }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleResumeFileChange}
            style={{ width: "85%", marginBottom: 10 }}
          />
          {filePreview && <div style={{ color: "#333", fontSize: 15 }}>Selected: {filePreview}</div>}
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
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractPdfText } from "../utils/pdfExtract";
import "./ResumeLanding.css";

const jobRoles = [
  "Software Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile App Developer (Android/iOS)",
  "QA / Test Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Database Engineer",
  "Site Reliability Engineer (SRE)",
  "UI/UX Designer",
  "Data Analyst",
  "Data Engineer",
  "AI / ML Engineer",
  "Cybersecurity Analyst",
  "Blockchain Developer",
  "IoT Engineer",
  "UI/UX Designer",
  "Graphic Designer",
  "Video Editor",
  "Content Writer",
  "Social Media Manager",
];

export default function ResumeLanding() {
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const navigate = useNavigate();

  const handleJobRoleChange = (e) => {
    setJobRole(e.target.value);
  };

  const handleResumeFileChange = async (e) => {
    const file = e.target.files[0];
    setFilePreview(file ? file.name : "");
    if (file) {
      if (file.type === "application/pdf") {
        try {
          const text = await extractPdfText(file);
          setResumeText(text);
        } catch (err) {
          alert("Could not extract text from PDF file.");
        }
      } else {
        alert("For now, only PDF is supported for text extraction.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeText) {
      alert("Please select a resume file and extract its text.");
      return;
    }
    const payload = {
      candidateName,
      jobRole,
      jobDesc,
      yearsExp,
      resumeText,
    };
    try {
      const response = await fetch(
        "http://localhost:4000/api/resumeAnalyzer/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        alert("Server error: " + response.status);
        return;
      }
      const data = await response.json();
      alert("Resume submitted successfully!");
      navigate("/resume/result", { state: { analysis: data } });
    } catch (err) {
      alert("Network error. See console for details.");
      console.error(err);
    }
  };

  return (
    <div className="resume-page">
      <div className="resume-card pv-card pv-slide-up">
        <header className="resume-header">
          <p className="resume-pill">ATS-friendly feedback</p>
          <h2 className="resume-title">
            Smart feedback
            <br />
            for your dream job
          </h2>
          <p className="resume-subtitle">
            Drop your resume for an ATS score and improvement tips.
          </p>
        </header>

        <form className="resume-form" onSubmit={handleSubmit}>
          <div className="resume-field-group">
            <label className="resume-label">Candidate Name</label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="pv-field"
              placeholder="Enter your full name"
            />
          </div>

          <div className="resume-field-group">
  <label className="resume-label">
    Select Job Role
    <span className="resume-label-secondary">
      &nbsp;(type or pick)
    </span>
  </label>
  <input
    type="text"
    required
    value={jobRole}
    onChange={handleJobRoleChange}
    placeholder="Type or select job role..."
    list="jobRoles-suggestions"
    className="pv-field resume-jobrole-input"
  />
  <datalist id="jobRoles-suggestions">
    {jobRoles.map((role) => (
      <option key={role} value={role} />
    ))}
  </datalist>
</div>


          <div className="resume-field-group">
            <label className="resume-label">Job Description</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste or write a clear job description with responsibilities & expectations..."
              className="pv-field resume-textarea"
            />
          </div>

          <div className="resume-field-inline">
            <div className="resume-field-group resume-field-inline-item">
              <label className="resume-label">Years of Experience</label>
              <input
                type="number"
                min="0"
                required
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                className="pv-field"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div className="resume-field-group">
            <label className="resume-label">
              Resume
              <span className="resume-label-secondary">
                &nbsp;(PDF only for extract)
              </span>
            </label>
            <div className="resume-upload">
              <div className="resume-upload-inner">
                <span className="resume-upload-icon">📄</span>
                <div className="resume-upload-text">
                  <span className="resume-upload-title">
                    Drop your PDF here
                  </span>
                  <span className="resume-upload-sub">
                    Or click to browse files
                  </span>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeFileChange}
                  className="resume-upload-input"
                />
              </div>
              {filePreview && (
                <div className="resume-file-preview">
                  Selected: <strong>{filePreview}</strong>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="pv-btn-royal resume-submit-btn">
            Save &amp; Analyze Resume
          </button>
        </form>
      </div>
    </div>
  );
}
