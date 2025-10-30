// src/pages/Forum.tsx
import React from "react";
import Hero from "../components/Hero";
import InterviewFeed from "../components/InterviewFeed";
import CompaniesSection from "../components/CompaniesSection"; // <-- add this

const Forum: React.FC = () => {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <Hero />

      <div id="forum-feed">
        <InterviewFeed />
      </div>

      {/* Companies section at the end of the forum page */}
      <div id="popular-companies">
        <CompaniesSection />
      </div>
    </main>
  );
};

export default Forum;
