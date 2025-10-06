import { useContext } from "react";
import { ResumeAnalysisContext } from "../context/ResumeAnalysisContext";

export default function ResumeResult() {
  const { analysis } = useContext(ResumeAnalysisContext);

  // Fallback if there's no analysis done yet
  if (!analysis) {
    return <div style={{ textAlign: "center", padding: 60 }}>No analysis found. Please upload a resume first.</div>
  }

  const resumeScore = analysis.atsScore;
  const issues = analysis.issues;
  const breakdown = [
    {
      label: "Tone & Style",
      value: analysis.breakdown.toneAndStyle,
      tag: analysis.breakdown.toneAndStyle >= 50 ? "Good Start" : "Needs work",
      color: "#e8a921",
      desc: "Your tone is mostly professional but some generic/cliché phrases remain. Aim for specific, energetic language that matches the company culture."
    },
    {
      label: "Content",
      value: analysis.breakdown.content,
      tag: analysis.breakdown.content >= 50 ? "Good Start" : "Needs work",
      color: "#ed646f",
      desc: "Your resume lacks quantifiable achievements and action verbs. Add results, numbers (e.g. 'increased conversions by 30%'), and strong verbs (e.g. 'built', 'created')."
    },
    {
      label: "Structure",
      value: analysis.breakdown.structure,
      tag: analysis.breakdown.structure >= 60 ? "Strong" : "Needs work",
      color: "#51c476",
      desc: "Sections are organized and ATS-readable. Add a clear Skills section for even better parsing and visibility."
    },
    {
      label: "Skills",
      value: analysis.breakdown.skills,
      tag: analysis.breakdown.skills >= 50 ? "Good Start" : "Needs work",
      color: "#ed646f",
      desc: "Some important technical skills are missing compared to job description. Add matching tools, frameworks, and methods for a more targeted application."
    },
  ];

  const technicalSkillsMatched = analysis.skillsMatched;
  const technicalSkillsMissing = analysis.skillsMissing;

  return (
    <div style={{
      maxWidth: 630,
      margin: "48px auto",
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 8px 24px #eaeaea",
      padding: 32,
    }}>
      {/* Score header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle at 60% 40%, #d4a6ed 0%, #e573c3 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#222",
            fontWeight: 900,
            fontSize: 44,
            marginRight: 34,
            boxShadow: "0 2px 16px #dba5fc",
            letterSpacing: "-2px"
          }}
        >
          {resumeScore}/100
        </div>
        <div>
          <h2 style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "-0.5px"
          }}>
            Your Resume Score
          </h2>
          <div style={{ color: "#444", marginTop: 2, fontSize: 16 }}>
            This score is calculated based on the variables listed below.
          </div>
          <div style={{ marginTop: 6, color: "#999", fontSize: 15 }}>
            {issues} issues
          </div>
        </div>
      </div>
      {/* ATS Block */}
      <div style={{
        background: "#eafff7",
        borderRadius: 16,
        padding: "18px 23px",
        marginBottom: 28,
        border: "1.5px solid #c1efe3",
      }}>
        <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
          ATS Score - {resumeScore}/100
        </p>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          How well does your resume pass through Applicant Tracking Systems?
        </div>
        <ul style={{ margin: 0, marginLeft: 18, color: "#374d46", fontSize: 15 }}>
          <li>Clear formatting, readable by ATS</li>
          <li>Keywords relevant to the job</li>
          <li style={{ color: "#e8a921", fontWeight: "bold" }}>
            ⚠ No skills section detected
          </li>
        </ul>
        <div style={{ marginTop: 8, color: "#888" }}>
          Want a better score? Improve your resume by applying the suggestions listed below.
        </div>
      </div>

      {/* Technical Skills Section - Moved UP */}
      <div style={{
        marginBottom: 40,
        background: "#f8fbff",
        borderRadius: 15,
        padding: "18px 21px",
        border: "1.2px solid #e3eefd",
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 7 }}>
          Technical Skills Analysis
        </div>
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: "#209944" }}>Matched Skills: </span>
          {technicalSkillsMatched.map(skill => (
            <span key={skill} style={{
              display: "inline-block",
              border: "1.5px solid #209944",
              background: "#efffed",
              color: "#209944",
              borderRadius: 12,
              padding: "2px 14px",
              marginRight: 6,
              marginBottom: 4,
            }}>{skill}</span>
          ))}
        </div>
        <div>
          <span style={{ fontWeight: 600, color: "#e57373" }}>Missing Skills (in JD): </span>
          {technicalSkillsMissing.map(skill => (
            <span key={skill} style={{
              display: "inline-block",
              border: "1.5px solid #e57373",
              background: "#ffecec",
              color: "#e57373",
              borderRadius: 12,
              padding: "2px 14px",
              marginRight: 6,
              marginBottom: 4,
            }}>{skill}</span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 15, color: "#e57373" }}>
          To improve your match, add the above missing skills in your resume if applicable and highlight them in your Skills section.
        </div>
      </div>

      {/* Detailed explanations */}
      {breakdown.map(b => (
        <div key={b.label + "-desc"} style={{ marginBottom: 21 }}>
          <div style={{
            fontWeight: 600,
            fontSize: 17,
            marginBottom: 5,
          }}>
            {b.label}: <span style={{
              background: "#fcf7e8", color: b.color, fontWeight: 500,
              fontSize: 13, borderRadius: 7, padding: "2.5px 8px"
            }}>{b.tag}</span>
          </div>
          <div style={{ fontSize: 15, color: "#374d46" }}>
            {b.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
