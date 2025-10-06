import { createContext, useState } from "react";
export const ResumeAnalysisContext = createContext();

export function ResumeAnalysisProvider({ children }) {
  const [analysis, setAnalysis] = useState(null);
  return (
    <ResumeAnalysisContext.Provider value={{ analysis, setAnalysis }}>
      {children}
    </ResumeAnalysisContext.Provider>
  );
}
