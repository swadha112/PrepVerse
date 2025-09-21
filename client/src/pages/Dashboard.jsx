import React from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();

  // Placeholder stats — hook up later to Firestore/your API
  const today = { title: "Two Sum", tags: ["Array", "HashMap"], difficulty: "Easy" };
  const units = [
    { title: "DSA Fundamentals", desc: "Arrays • HashMaps • Two Pointers", progress: 60, unlocked: true },
    { title: "Graphs & Traversals", desc: "BFS • DFS • Components", progress: 20, unlocked: true },
    { title: "System Design Intro", desc: "Caching • Rate Limit • Sharding", progress: 0, unlocked: false },
  ];

  const streakData = {
    current: 7,
    best: 14,
    progress: 72
  };

  const leaderboardData = [
    { rank: 1, name: "Aarav", score: 1840, isUser: false },
    { rank: 2, name: "Isha", score: 1720, isUser: false },
    { rank: 3, name: "Rohit", score: 1650, isUser: false },
    { rank: 4, name: "Zara", score: 1580, isUser: false },
    { rank: 5, name: "You", score: 1530, isUser: true },
  ];

  const handleSolveChallenge = () => {
    window.open("https://leetcode.com/problems/two-sum/", "_blank");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header Section */}
        <div className="dashboard-header pv-fade-in">
          <h1 className="dashboard-title">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Ready to tackle today's challenge and advance your skills?
          </p>
        </div>

        <div className="dashboard-grid grid-2">
          <div className="dashboard-left vstack">
            {/* Today's Challenge Card */}
            <div className="challenge-card pv-card pv-slide-up">
              <div className="card-header">
                <div>
                  <h3 className="card-title"> Today's Challenge</h3>
                  <p className="card-subtitle">Keep your streak alive and climb the leaderboard</p>
                </div>
                <span className="difficulty-badge">{today.difficulty}</span>
              </div>

              <div className="challenge-content">
                <div className="challenge-info">
                  <h4 className="challenge-title">{today.title}</h4>
                  <div className="challenge-tags">
                    {today.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <button className="pv-btn-royal challenge-btn" onClick={handleSolveChallenge}>
                   Solve Now
                </button>
              </div>
            </div>

            {/* Learning Track Card */}
            <div className="track-card pv-card pv-slide-up">
              <div className="card-header-simple">
                <h3 className="card-title"> Your Learning Track</h3>
                <p className="card-subtitle">Progress toward Backend Engineer</p>
              </div>

              <div className="units-container">
                {units.map((unit, i) => (
                  <div key={i} className={`unit-item ${unit.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="unit-content">
                      <h4 className="unit-title">
                        {unit.unlocked ? "🔓" : "🔒"} {unit.title}
                      </h4>
                      <p className="unit-desc">{unit.desc}</p>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${unit.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{unit.progress}% Complete</span>
                    </div>
                    {unit.unlocked && (
                      <button className="pv-btn-glass unit-btn">Continue</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-right vstack">
            {/* Streak Card */}
            <div className="streak-card pv-card pv-slide-up">
              <h3 className="card-title"> Your Streak</h3>
              
              <div className="streak-content">
                <div className="streak-circle">
                  <div className="streak-number">{streakData.current}</div>
                  <div 
                    className="streak-ring"
                    style={{ '--progress': `${streakData.progress * 3.6}deg` }}
                  />
                </div>
                <div className="streak-info">
                  <div className="streak-current">Current streak: {streakData.current} days</div>
                  <div className="streak-best">Best streak: {streakData.best} days</div>
                </div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="leaderboard-card pv-card pv-slide-up">
              <h3 className="card-title"> Leaderboard</h3>
              
              <div className="leaderboard-list">
                {leaderboardData.map((entry) => (
                  <div key={entry.rank} className={`leaderboard-item ${entry.isUser ? 'user' : ''}`}>
                    <div className="leaderboard-left">
                      <div className={`rank-badge ${entry.rank <= 3 ? 'top-three' : ''}`}>
                        {entry.rank}
                      </div>
                      <span className="player-name">
                        {entry.name}
                        {entry.isUser }
                      </span>
                    </div>
                    <div className="player-score">{entry.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Info Card */}
            <div className="user-card pv-card pv-slide-up">
              <h3 className="card-title-small">👤 Account Info</h3>
              
              <div className="user-info">
                <div className="user-field">
                  <strong>Name:</strong> {user?.displayName || "—"}
                </div>
                <div className="user-field">
                  <strong>Email:</strong> {user?.email}
                </div>
                <div className="user-field-small">
                  <strong>ID:</strong> {user?.uid?.substring(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}