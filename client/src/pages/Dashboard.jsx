import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Dashboard.css";
import LeetCodeWidget from "../components/LeetCodeWidget";
import DifficultyDonut from "../components/DifficultyDonut";
import TrendingQuestions from "../components/TrendingQuestions";

/* ---------- API base ---------- */
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

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
  const navigate = useNavigate();

  /* Try to avoid hardcoding LC username */
  const lcUsername = useMemo(() => {
    return (
      localStorage.getItem("pv.lcUsername") ||
      import.meta.env.VITE_LC_USERNAME ||
      "Swadha_K"
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
  

  /* -------------------- SOLVED SUMMARY (for donut) -------------------- */
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");

  /* -------------------- LEADERBOARD (dynamic) -------------------- */
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState("");

  /* -------------------- TRACK PROGRESS (dynamic, precomputed) -------------------- */
  const [tracks, setTracks] = useState(null);
  const [tracksLoading, setTracksLoading] = useState(!!lcUsername);
  const [tracksError, setTracksError] = useState("");

  // slug → Title (fallback without importing TOPIC_SLUGS here)
  const prettyTitle = (slug = "") =>
    slug
      .split("-")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");

  const tierLabel = (k) =>
    k === "foundation" ? "Foundation" : k === "intermediate" ? "Intermediate" : "Advanced";

  function nextTierKey(t = {}) {
    if (t?.foundation?.percent < 100) return "foundation";
    if (t?.intermediate?.percent < 100) return "intermediate";
    return "advanced";
  }

  useEffect(() => {
    if (!lcUsername) return;
    let on = true;
    setTracksLoading(true);
    fetchJSON(
      `${API_BASE}/api/public/leetcode/track-progress?username=${encodeURIComponent(lcUsername)}`
    )
      .then((j) => {
        if (!on) return;
        if (j?.ok) setTracks(j.tracks || null);
        else setTracksError(j?.error || "Failed");
      })
      .catch((e) => on && setTracksError(e.message || String(e)))
      .finally(() => on && setTracksLoading(false));
    return () => { on = false; };
  }, [lcUsername]);

  const top3Tracks = useMemo(() => {
    if (!tracks) return [];
    return Object.entries(tracks)
      .map(([slug, t]) => {
        const key = nextTierKey(t);
        const meta = t?.[key] || { percent: 0, total: 0, solved: 0 };
        return { slug, key, meta, pct: meta.percent ?? 0 };
      })
      .filter((x) => x.meta.total > 0 && x.pct < 100)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [tracks]);

  /* -------------------- AI Coach (recommendations) -------------------- */
  const [coach, setCoach] = useState(null);
  const [coachError, setCoachError] = useState("");

  useEffect(() => {
    if (!lcUsername) return;
    let on = true;
    fetchJSON(
      `${API_BASE}/api/public/leetcode/recommendations?username=${encodeURIComponent(
        lcUsername
      )}&mode=finish`
    )
      .then((j) => on && j?.ok && setCoach(j))
      .catch((e) => on && setCoachError(e.message || String(e)));
    return () => { on = false; };
  }, [lcUsername]);

  function openTrack(slug, tierKey) {
    const map = {
      foundation: "easy",
      intermediate: "medium",
      advanced: "hard",
    };
    const diff = map[tierKey] || "easy";
    navigate(`/tracks/${slug}/${diff}`);
  }

  useEffect(() => {
    if (!lcUsername) return;
    let on = true;
    setStreakLoading(true);
    fetchJSON(`${API_BASE}/api/public/leetcode/streak?username=${encodeURIComponent(lcUsername)}`)
      .then((j) => {
        if (!on) return;
        if (j?.ok) {
          setStreak({
            current: j.streak ?? 0,
            best: null,
            last: j.lastProgressAt ? new Date(j.lastProgressAt) : null
          });
        }
      })
      .catch(() => {})
      .finally(() => on && setStreakLoading(false));
    return () => { on = false; };
  }, [lcUsername]);

  // solved summary for donut
  useEffect(() => {
    if (!lcUsername) return;
    let on = true;
    fetchJSON(`${API_BASE}/api/public/leetcode/summary?username=${encodeURIComponent(lcUsername)}`)
      .then((j) => {
        if (!on) return;
        if (j?.ok) setSummary(j.summary || j); else setSummary(null);
      })
      .catch((e) => on && setSummaryError(e.message || String(e)));
    return () => { on = false; };
  }, [lcUsername]);

  const streakProgressDeg = Math.min(360, (Math.min(streak.current, 100) / 100) * 360);
  // values for DifficultyDonut
const easyVal   = summary?.solved?.easy   ?? summary?.easy   ?? 0;
const mediumVal = summary?.solved?.medium ?? summary?.medium ?? 0;
const hardVal   = summary?.solved?.hard   ?? summary?.hard   ?? 0;
const totalVal  = summary?.solved?.total  ?? summary?.total  ?? (easyVal + mediumVal + hardVal);
const donutLabel = `${totalVal ? Math.round(((easyVal + mediumVal + hardVal) / totalVal) * 100) : 100}%`;

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
        <div className="span-2">
    <LeetCodeWidget username={lcUsername || "—"} />
  </div>
          <div className="dashboard-left vstack">
            

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

            {/* Learning Track (top 3, precomputed) */}
            <div className="track-card pv-card pv-slide-up">
              <div className="card-header-simple">
                <h3 className="card-title"> Your Learning Track</h3>
                <p className="card-subtitle">Progress toward Backend Engineer</p>
              </div>

              <div className="units-container">
                {tracksLoading && (
                  <div className="lc-sub" style={{ padding: 8 }}>Loading personalized tracks…</div>
                )}

                {!tracksLoading && (!top3Tracks || top3Tracks.length === 0) && (
                  <div className="lc-sub" style={{ padding: 8 }}>
                    {tracksError
                      ? tracksError
                      : "Sync your LeetCode profile to personalize this section."}
                  </div>
                )}

                {!tracksLoading &&
                  // eslint-disable-next-line no-unused-vars
                  top3Tracks.map((t, i) => {
                    const pct = Math.round(t.meta.percent || 0);
                    const solved = t.meta.solved ?? 0;
                    const total = t.meta.total ?? 0;
                    return (
                      <div key={t.slug} className={`unit-item unlocked`}>
                        <div className="unit-content">
                          <h4 className="unit-title">
                            🔓 {prettyTitle(t.slug)} — {tierLabel(t.key)}
                          </h4>
                          <p className="unit-desc">
                            {solved}/{total} completed
                          </p>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="progress-text">{pct}% Complete</span>
                        </div>
                        <button
                          className="pv-btn-glass unit-btn"
                          onClick={() => openTrack(t.slug, t.key)}
                        >
                          Continue
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* AI Coach / Recommendations */}
            <div className="track-card pv-card pv-slide-up">
              <div className="card-header-simple">
                <h3 className="card-title"> AI Coach</h3>
                <p className="card-subtitle">Recommended next problems to maximize momentum</p>
              </div>

              {!coach && !coachError && (
                <div className="lc-sub" style={{ padding: 8 }}>Building suggestions…</div>
              )}

              {coachError && <div className="lc-sub" style={{ padding: 8 }}>{coachError}</div>}

              {coach?.suggestions?.length > 0 && (
                <div className="units-container">
                  {coach.suggestions.slice(0, 5).map((q) => (
                    <div key={q.slug} className="unit-item unlocked">
                      <div className="unit-content">
                        <h4 className="unit-title">
                          {q.title} <span className="duo-difficulty" style={{ marginLeft: 8 }}>{q.difficulty}</span>
                        </h4>
                        <p className="unit-desc">
                          {(q.tags || []).slice(0, 3).join(" • ")}
                        </p>
                      </div>
                      <a
                        className="pv-btn-glass unit-btn"
                        href={`https://leetcode.com/problems/${q.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solve
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {coach?.suggestions?.length === 0 && (
                <div className="lc-sub" style={{ padding: 8 }}>
                  You’re all caught up here—great work!
                </div>
              )}
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

            {/* Difficulty Breakdown (donut) */}
            <div className="donut-card pv-card pv-slide-up">
              <h3 className="card-title"> </h3>
              {summary ? (
                <DifficultyDonut
                easy={easyVal}
                medium={mediumVal}
                hard={hardVal}
                half={true}
                innerLabel={donutLabel}
              />
              ) : (
                <div className="lc-sub">{summaryError || "Sync your profile to see solved split."}</div>
              )}
            </div>
            
            <TrendingQuestions limit={8} />
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