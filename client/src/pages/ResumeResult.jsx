import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Helper for colored analysis box
function AnalysisBlock({ type, title, desc }) {
  const color = type === "success" ? "#069A51" : "#d33f49";
  const bg = type === "success" ? "#eff8f1" : "#fff2f0";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", padding: "14px 18px",
      borderRadius: 14, marginBottom: 14,
      background: bg, boxShadow: "0 1px 7px #f2eded44"
    }}>
      <span style={{
        display: "inline-block", width: 32, height: 32, fontSize: 27,
        color, fontWeight: 600, textAlign: "center", 
        marginRight: 12
      }}>
        {type === "success" ? "✔" : "✖"}
      </span>
      <div>
        <div style={{fontWeight:700, color, fontSize:"16.5px", marginBottom:2}}>{title}</div>
        <div style={{fontSize:15, color:"#444"}}>{desc}</div>
      </div>
    </div>
  );
}

export default function ResumeResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis;

  useEffect(() => {
    if (!analysis) {
      navigate('/resume');
    }
  }, [analysis, navigate]);

  if (!analysis) {
    return <div style={{ textAlign: "center", padding: 60 }}>No analysis found. Please upload a resume first.</div>;
  }

  const resumeScore = analysis.atsScore;
  const issues = analysis.issues;
  const breakdown = [
    {
      label: "Tone & Style",
      value: analysis.breakdown.toneAndStyle,
      tag: analysis.breakdown.toneAndStyle >= 50 ? "Good Start" : "Needs work",
      color: "#e8a921",
      desc: "Your tone is mostly professional but some generic/cliché phrases remain. Aim for specific, energetic language."
    },
    {
      label: "Content",
      value: analysis.breakdown.content,
      tag: analysis.breakdown.content >= 50 ? "Good Start" : "Needs work",
      color: "#ed646f",
      desc: "Add results, numbers (like 'increased conversions by 30%'), and strong verbs (like 'built', 'created')."
    },
    {
      label: "Structure",
      value: analysis.breakdown.structure,
      tag: analysis.breakdown.structure >= 60 ? "Strong" : "Needs work",
      color: "#51c476",
      desc: "Sections are organized and ATS-readable. Add standard resume sections for better parsing."
    },
    {
      label: "Skills",
      value: analysis.breakdown.skills,
      tag: analysis.breakdown.skills >= 50 ? "Good Start" : "Needs work",
      color: "#ed646f",
      desc: "Some important technical skills are missing compared to job description. Add matching tools and frameworks."
    },
  ];

  const technicalSkillsMatched = analysis.skillsMatched;
  const technicalSkillsMissing = analysis.skillsMissing;
  const sectionsDetected = analysis.sectionsDetected || [];
  const nlpAnalysis = analysis.nlpAnalysis || [];
  const fitPrediction = analysis.fitPrediction || {};
  const grammarAnalysis = analysis.grammarAnalysis || [];
  const suggestions = analysis.suggestions || [];

  return (
    <div style={{
      maxWidth: 680,
      margin: "45px auto",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 10px 32px #e7e9f8",
      padding: 35,
    }}>
      {/* Score header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            background: "radial-gradient(circle at 62% 41%, #d4a6ed 0%, #85e8b9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#222",
            fontWeight: 900,
            fontSize: 39,
            marginRight: 34,
            boxShadow: "0 2px 19px #d7f5e4",
            letterSpacing: "-1.6px"
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
            Analysis Result
          </h2>
          <div style={{ color: "#444", marginTop: 2, fontSize: 16 }}>
            Your resume is analyzed for structure, skills, tone, and job fit.
          </div>
          <div style={{ marginTop: 6, color: "#999", fontSize: 15 }}>
            {issues} issues detected
          </div>
        </div>
      </div>

      {/* Quality/opinion blocks: green/red cards */}
      {nlpAnalysis.map((block, i) =>
        <AnalysisBlock type={block.type} title={block.title} desc={block.desc} key={block.title + i} />
      )}

      {/* Best-fit prediction details */}
      <div style={{
        background: "#f6f8fc", borderRadius: 10, padding: "14px 18px", border: "1.2px solid #c3e6ff", marginBottom: 26
      }}>
        <strong style={{fontSize: "16.5px"}}>Best Roles For You: </strong>
        <span>{fitPrediction.roles?.join(", ")}</span>
        <div style={{ marginTop: 6 }}>
          <strong>Experience level:</strong> {fitPrediction.experienceLevel} <span style={{marginLeft:18}}><strong>Industry Fit:</strong> {fitPrediction.industryFit}</span>
        </div>
      </div>

      {/* Resume sections detected */}
      {sectionsDetected.length > 0 && (
        <div style={{
          background: "#e6f7ff", borderRadius: 10, padding: "14px 18px", border: "1.2px solid #b3e0ff", marginBottom: 18
        }}>
          <div style={{fontWeight: 700, fontSize: 15, marginBottom: 4}}>Sections Found in Your Resume:</div>
          <div style={{color:"#0073e6", fontSize:15}}>
            {sectionsDetected.join(", ")}
          </div>
        </div>
      )}

      {/* Grammar / spelling block */}
      {grammarAnalysis.map((block, i) =>
        <AnalysisBlock type={block.type} title={block.title} desc={block.desc} key={"grammar" + i} />
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: "#f8fff8", borderRadius: 12, padding: "18px 22px", border: "1.2px solid #c3ffe9", marginBottom: 32
        }}>
          <div style={{fontWeight: 700, fontSize: 17, marginBottom: 6, color:"#269962"}}>Resume Improvement Suggestions</div>
          <ul style={{color:"#1a6f37", fontSize:15, marginLeft:18,}}>
            {suggestions.map((msg, i) => <li key={i}>{msg.desc}</li>)}
          </ul>
        </div>
      )}

      {/* Technical Skills Section */}
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
          {technicalSkillsMatched.length === 0
            ? <span style={{ color: "#e57373", fontWeight: 700 }}>None of the skills matched</span>
            : technicalSkillsMatched.map(skill => (
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
        {technicalSkillsMissing.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 15, color: "#e57373" }}>
            To improve your match, add the above missing skills in your resume if applicable and highlight them in your Skills section.
          </div>
        )}
      </div>

      {/* Breakdown detail cards */}
      <div style={{
        marginBottom: 18, marginTop: "-6px"
      }}>
        <div style={{fontWeight:700, fontSize:19, marginBottom:2, color:"#24449c"}}>Resume Quality Breakdown</div>
        {breakdown.map(b => (
          <div key={b.label + "-desc"} style={{ marginBottom: 11 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 17,
              marginBottom: 5,
            }}>
              {b.label}: <span style={{
                background: "#fcf7e8", color: b.color, fontWeight: 500,
                fontSize: 13, borderRadius: 7, padding: "2.5px 8px"
              }}>{b.tag}</span> <span style={{
                marginLeft: 10, color: "#222", fontWeight:600, fontSize:14
              }}>Score: {b.value}/100</span>
            </div>
            <div style={{ fontSize: 15, color: "#374d46" }}>
              {b.desc}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
