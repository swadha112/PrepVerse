// src/pages/Forum.tsx
import React from "react";
import Hero from "../components/Hero";
import InterviewFeed from "../components/InterviewFeed";

const Forum: React.FC = () => {
  return (
    <main style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
      <Hero />
      <InterviewFeed />
    </main>
  );
};

export default Forum;
