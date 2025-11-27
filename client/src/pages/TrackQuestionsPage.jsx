// src/pages/TrackQuestionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
import { TOPIC_SLUGS } from "../lib/topicSlugs";
import "./TrackQuestionsPage.css";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
const DEFAULT_USERNAME = "Swadha_K"; // TODO: wire with your context when ready

function displayNameFromSlug(slug) {
  const entry = Object.entries(TOPIC_SLUGS).find(([, v]) => v === slug);
  return entry ? entry[0] : slug;
}

const nslug = (s) => String(s || "").trim().toLowerCase();

export default function TrackQuestionsPage() {
  const { topicSlug, difficulty } = useParams();   // difficulty is "easy|medium|hard" (lowercase)
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [solvedSet, setSolvedSet] = useState(new Set()); // all solved slugs from backend

  const topicName = useMemo(
    () => location.state?.topicName || displayNameFromSlug(topicSlug),
    [location.state, topicSlug]
  );

  // Load this tier’s static JSON
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const base = import.meta.env.BASE_URL || "/";
        const url = `${base}data/${topicSlug}/${difficulty}.json`; // wrapped object with {questions:[...]}
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Expected JSON");
        const json = await res.json();
        if (!cancelled) setState({ loading: false, error: null, data: json });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message, data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [topicSlug, difficulty]);

  // Load all solved slugs for current username
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/public/leetcode/solved-slugs?username=${encodeURIComponent(DEFAULT_USERNAME)}`;
        const r = await fetch(url, { headers: { accept: "application/json" } });
        const t = await r.text();
        if (!r.ok) throw new Error(t || r.statusText);
        const j = JSON.parse(t);
        const set = new Set((j.slugs || []).map(nslug));
        if (!cancelled) setSolvedSet(set);
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // degrade gracefully (show 0% rather than erroring UI)
        if (!cancelled) setSolvedSet(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Human label for tier
  const difficultyLabel = useMemo(() => {
    const d = (location.state?.difficulty || difficulty || "").toUpperCase();
    if (d === "EASY") return "Foundation";
    if (d === "MEDIUM") return "Intermediate";
    if (d === "HARD") return "Advanced";
    return d;
  }, [location.state, difficulty]);

  // Completed set for THIS tier only = intersection of page questions with solvedSet
  const { list, completedSet, percent } = useMemo(() => {
    const qs = Array.isArray(state.data?.questions) ? state.data.questions : [];
    const solved = new Set();
    for (const q of qs) {
      const slug = nslug(q.slug);
      if (slug && solvedSet.has(slug)) solved.add(slug);
    }
    const pct = qs.length ? Math.round((solved.size / qs.length) * 100) : 0;
    return { list: qs, completedSet: solved, percent: pct };
  }, [state.data, solvedSet]);

  return (
    <div className="duo-questions-page">
      <PVNavbar user={user} />

      <div className="duo-container">
        {/* Hero header with progress */}
        <div className="duo-hero">
          <button className="duo-back-btn" onClick={() => navigate(-1)}>
            ← Back to Tracks
          </button>

          <div className="duo-hero-content">
            <div className="duo-icon">🎯</div>
            <h1 className="duo-title">{topicName}</h1>
            <div className="duo-badge">{difficultyLabel}</div>
          </div>

          {state.data && (
            <div className="duo-progress-section">
              <div className="duo-progress-header">
                <span className="duo-progress-label">Your Progress</span>
                <span className="duo-progress-value">{percent}%</span>
              </div>
              <div className="duo-progress-bar">
                <div className="duo-progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="duo-stats">
                <div className="duo-stat">
                  <span className="duo-stat-value">{completedSet.size}</span>
                  <span className="duo-stat-label">Completed</span>
                </div>
                <div className="duo-stat">
                  <span className="duo-stat-value">{list.length}</span>
                  <span className="duo-stat-label">Total</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {state.loading && (
          <div className="duo-loading">
            <div className="duo-spinner"></div>
            <p>Loading your challenges...</p>
          </div>
        )}

        {/* Error state */}
        {state.error && (
          <div className="duo-error">
            <span className="duo-error-icon">⚠️</span>
            <p>{state.error}</p>
          </div>
        )}

        {/* Questions list */}
        {state.data && (
          <div className="duo-questions-list">
            {!Array.isArray(list) || list.length === 0 ? (
              <div className="duo-empty">
                <span className="duo-empty-icon">📭</span>
                <p>No questions found for this set.</p>
              </div>
            ) : (
              list.map((q, idx) => {
                const href = `https://leetcode.com/problems/${q.slug}/`;
                const isCompleted = completedSet.has(nslug(q.slug));
                return (
                  <div key={q.slug} className={`duo-question-card ${isCompleted ? "completed" : ""}`}>
                    <div className="duo-question-header">
                      <div className={`duo-question-number ${isCompleted ? "done" : ""}`}>
                        {isCompleted ? "✓" : (q.position ?? idx + 1)}
                      </div>
                      <div className="duo-question-info">
                        <h3 className="duo-question-title">{q.title}</h3>
                        <div className="duo-question-meta">
                          <span className={`duo-difficulty duo-diff-${(q.difficulty || "").toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                          {typeof q.acceptance === "number" && (
                            <span className="duo-acceptance">{Math.round(q.acceptance)}% acceptance</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="duo-question-actions">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="duo-btn duo-btn-primary"
                      >
                        {isCompleted ? "Review" : "Start Challenge"} →
                      </a>
                      {isCompleted && <span className="duo-complete-pill">Completed</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}