import fetch from "node-fetch";

export async function analyzeWithPython(resumeText, jobDesc) {
  const response = await fetch("http://localhost:5001/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDesc })
  });
  if (!response.ok) throw new Error(`Python API error: ${response.status}`);
  return await response.json();
}
