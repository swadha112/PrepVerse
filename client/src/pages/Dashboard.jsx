import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";
import LeetCodeWidget from "../components/LeetCodeWidget";

/* ---------- API base ---------- */
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");

/* ---------- tiny fetch helper ---------- */
async function fetchJSON(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  return JSON.parse(t);
}

/* ---------- Dashboard ---------- */
export default function Dashboard() {
  const { user } = useAuth();

  /* Try to avoid hardcoding LC username:
     - extension can set localStorage.setItem('pv.lcUsername', '<name>')
     - or set VITE_LC_USERNAME in your .env
  */
     const lcUsername = useMemo(() => {
      return (
        localStorage.getItem("pv.lcUsername") ||
        import.meta.env.VITE_LC_USERNAME ||
        "Swadha_K" // <-- final fallback so widget always gets a valid name
      );
    }, []);

  /* -------------------- DAILY (dynamic) -------------------- */
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState("");

  useEffect(() => {
    let on = true;
    setDailyLoading(true);
    fetchJSON(`${API_BASE}/api/public/leetcode/daily`)
      .then((j) => on && (j?.ok ? setDaily(j) : setDailyError(j?.error || "Failed")))
      .catch((e) => on && setDailyError(e.message || String(e)))
      .finally(() => on && setDailyLoading(false));
    return () => { on = false; };
  }, []);

  const today = {
    title: daily?.question?.title || "—",
    slug: daily?.question?.slug || "",
    id: daily?.question?.id || "",
    tags: daily?.question?.tags?.map(t => t.name) || [],
    difficulty: daily?.question?.difficulty || "—",
    link: daily?.link || "https://leetcode.com/problemset/all/",
  };

  const handleSolveChallenge = () => window.open(today.link, "_blank");

  /* -------------------- STREAK (dynamic) -------------------- */
  const [streak, setStreak] = useState({ current: 0, best: null, last: null });
  const [streakLoading, setStreakLoading] = useState(!!lcUsername);

  useEffect(() => {
    if (!lcUsername) return; // silently skip if we don't know username
    let on = true;
    setStreakLoading(true);
    fetchJSON(`${API_BASE}/api/public/leetcode/streak?username=${encodeURIComponent(lcUsername)}`)
      .then((j) => {
        if (!on) return;
        if (j?.ok) {
          setStreak({
            current: j.streak ?? 0,
            best: null,                 // you can compute/store best later if needed
            last: j.lastProgressAt ? new Date(j.lastProgressAt) : null
          });
        }
      })
      .catch(() => {})               // soft-fail is fine
      .finally(() => on && setStreakLoading(false));
    return () => { on = false; };
  }, [lcUsername]);

  const streakProgressDeg = Math.min(360, (Math.min(streak.current, 100) / 100) * 360);

  /* -------------------- LEADERBOARD (dynamic) -------------------- */
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState("");

  useEffect(() => {
    let on = true;
    setBoardLoading(true);
    fetchJSON(`${API_BASE}/api/public/leetcode/leaderboard?limit=10&by=ranking`)
      .then((j) => on && (j?.ok ? setBoard(j.rows || []) : setBoardError(j?.error || "Failed")))
      .catch((e) => on && setBoardError(e.message || String(e)))
      .finally(() => on && setBoardLoading(false));
    return () => { on = false; };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header pv-fade-in">
          <h1 className="dashboard-title">
            Welcome back, {user?.displayName?.split(" ")[0] || "Developer"}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Ready to tackle today's challenge and advance your skills?
          </p>
        </div>

        <div className="dashboard-grid grid-2">
          <div className="dashboard-left vstack">
            {/* Keep your existing widget */}
            <LeetCodeWidget username={lcUsername || "—"} />

            {/* Today's Challenge (dynamic) */}
            <div className="challenge-card pv-card pv-slide-up">
              <div className="card-header">
                <div>
                  <h3 className="card-title"> Today&apos;s Challenge</h3>
                  <p className="card-subtitle">One problem a day keeps rust away.</p>
                </div>
                <span className="difficulty-badge">{dailyLoading ? "…" : today.difficulty}</span>
              </div>

              <div className="challenge-content">
                <div className="challenge-info">
                  <h4 className="challenge-title">
                    {dailyLoading
                      ? "Loading…"
                      : (today.id ? `#${today.id} — ${today.title}` : today.title)}
                  </h4>

                  {dailyError ? (
                    <div className="lc-sub" style={{ opacity: .7 }}>{dailyError}</div>
                  ) : (
                    <div className="challenge-tags">
                      {(today.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="pv-btn-royal challenge-btn"
                  onClick={handleSolveChallenge}
                  disabled={dailyLoading}
                >
                  {dailyLoading ? "…" : "Solve Now"}
                </button>
              </div>
            </div>

            {/* Learning Track placeholder (unchanged, wire later) */}
            <div className="track-card pv-card pv-slide-up">
              <div className="card-header-simple">
                <h3 className="card-title"> Your Learning Track</h3>
                <p className="card-subtitle">Progress toward Backend Engineer</p>
              </div>

              <div className="units-container">
                {[
                  { title: "DSA Fundamentals", desc: "Arrays • HashMaps • Two Pointers", progress: 60, unlocked: true },
                  { title: "Graphs & Traversals", desc: "BFS • DFS • Components",     progress: 20, unlocked: true },
                  { title: "System Design Intro", desc: "Caching • Rate Limit • Sharding", progress: 0, unlocked: false }
                ].map((u, i) => (
                  <div key={i} className={`unit-item ${u.unlocked ? "unlocked" : "locked"}`}>
                    <div className="unit-content">
                      <h4 className="unit-title">{u.unlocked ? "🔓" : "🔒"} {u.title}</h4>
                      <p className="unit-desc">{u.desc}</p>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${u.progress}%` }} />
                      </div>
                      <span className="progress-text">{u.progress}% Complete</span>
                    </div>
                    {u.unlocked && <button className="pv-btn-glass unit-btn">Continue</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-right vstack">
            {/* Streak (dynamic) */}
            <div className="streak-card pv-card pv-slide-up">
              <h3 className="card-title"> Your Streak</h3>

              {!lcUsername && (
                <div className="lc-sub" style={{marginBottom:12}}>
                  Link your LeetCode (extension) to show streak.
                </div>
              )}

              <div className="streak-content">
                <div className="streak-circle">
                  <div className="streak-number">
                    {streakLoading && lcUsername ? "…" : streak.current}
                  </div>
                  <div
                    className="streak-ring"
                    style={{ "--progress": `${streakProgressDeg}deg` }}
                  />
                </div>
                <div className="streak-info">
                  <div className="streak-current">
                    Current streak: {streakLoading && lcUsername ? "…" : `${streak.current} days`}
                  </div>
                  <div className="streak-best">
                    Last activity: {streak.last ? streak.last.toDateString() : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard (dynamic) */}
            <div className="leaderboard-card pv-card pv-slide-up">
              <h3 className="card-title"> Leaderboard</h3>

              {boardLoading ? (
                <div className="lc-sub">Loading…</div>
              ) : boardError ? (
                <div className="lc-sub">{boardError}</div>
              ) : (
                <div className="leaderboard-list">
                  {board.map((row, idx) => {
                    const isUser = lcUsername && row.username?.toLowerCase() === lcUsername.toLowerCase();
                    return (
                      <div key={row.username || idx} className={`leaderboard-item ${isUser ? "user" : ""}`}>
                        <div className="leaderboard-left">
                          <div className={`rank-badge ${idx < 3 ? "top-three" : ""}`}>{idx + 1}</div>
                          <img
                            src={row.avatar || "https://assets.leetcode.com/users/default_avatar.jpg"}
                            className="lb-avatar"
                            alt=""
                          />
                          <span className="player-name">{row.username}</span>
                        </div>
                        <div className="player-score">
                          {/* show rank primarily; solved as secondary tooltip */}
                          <span title={`Solved: ${row.solved} • Streak: ${row.streak}`}>
                            #{row.ranking ?? "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
