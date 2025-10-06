// src/pages/TrackQuestionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
import { TOPIC_SLUGS } from "../lib/topicSlugs";
import "./TrackQuestionsPage.css";

function displayNameFromSlug(slug) {
  const entry = Object.entries(TOPIC_SLUGS).find(([, v]) => v === slug);
  return entry ? entry[0] : slug;
}

export default function TrackQuestionsPage() {
  const { topicSlug, difficulty } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [completed, setCompleted] = useState(new Set());

  const topicName = useMemo(
    () => location.state?.topicName || displayNameFromSlug(topicSlug),
    [location.state, topicSlug]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || "/";
        const url = `${base}data/${topicSlug}/${difficulty}.json`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error("Expected JSON response");
        }

        const json = await res.json();
        if (!cancelled) setState({ loading: false, error: null, data: json });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message, data: null });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [topicSlug, difficulty]);

  const difficultyLabel = useMemo(() => {
    const d = (location.state?.difficulty || difficulty || "").toUpperCase();
    if (d === "EASY") return "Foundation";
    if (d === "MEDIUM") return "Intermediate";
    if (d === "HARD") return "Advanced";
    return d;
  }, [location.state, difficulty]);

  const progress = useMemo(() => {
    if (!state.data?.questions) return 0;
    return Math.round((completed.size / state.data.questions.length) * 100);
  }, [completed, state.data]);

  const handleComplete = (slug) => {
    setCompleted(prev => new Set(prev).add(slug));
  };

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
                <span className="duo-progress-value">{progress}%</span>
              </div>
              <div className="duo-progress-bar">
                <div 
                  className="duo-progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="duo-stats">
                <div className="duo-stat">
                  <span className="duo-stat-value">{completed.size}</span>
                  <span className="duo-stat-label">Completed</span>
                </div>
                <div className="duo-stat">
                  <span className="duo-stat-value">{state.data.questions?.length || 0}</span>
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
            {!Array.isArray(state.data.questions) || state.data.questions.length === 0 ? (
              <div className="duo-empty">
                <span className="duo-empty-icon">📭</span>
                <p>No questions found for this set.</p>
              </div>
            ) : (
              // eslint-disable-next-line no-unused-vars
              state.data.questions.map((q, idx) => {
                const href = `https://leetcode.com/problems/${q.slug}/`;
                const isCompleted = completed.has(q.slug);
                
                return (
                  <div 
                    key={q.slug} 
                    className={`duo-question-card ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="duo-question-header">
                      <div className="duo-question-number">
                        {isCompleted ? '✓' : q.position}
                      </div>
                      <div className="duo-question-info">
                        <h3 className="duo-question-title">{q.title}</h3>
                        <div className="duo-question-meta">
                          <span className={`duo-difficulty duo-diff-${(q.difficulty || "").toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                          <span className="duo-acceptance">
                            {Math.round(q.acceptance)}% acceptance
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="duo-question-actions">
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="duo-btn duo-btn-primary"
                        onClick={() => handleComplete(q.slug)}
                      >
                        {isCompleted ? 'Review' : 'Start Challenge'} →
                      </a>
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
