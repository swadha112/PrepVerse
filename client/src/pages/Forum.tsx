import React from "react";
import Hero from "../components/Hero";
import InterviewFeed from "../components/InterviewFeed";

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
    </main>
  );
};

export default Forum;
