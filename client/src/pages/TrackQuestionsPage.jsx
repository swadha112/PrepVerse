// src/pages/TrackQuestionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
import { TOPIC_SLUGS } from "../lib/topicSlugs";

function displayNameFromSlug(slug) {
  const entry = Object.entries(TOPIC_SLUGS).find(([, v]) => v === slug);
  return entry ? entry[0] : slug;
}

export default function TrackQuestionsPage() {
  const { topicSlug, difficulty } = useParams(); // difficulty is lowercased here
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const topicName = useMemo(
    () => location.state?.topicName || displayNameFromSlug(topicSlug),
    [location.state, topicSlug]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || "/"; // Vite’s public base path
        const url = `${base}data/${topicSlug}/${difficulty}.json`; // e.g., /data/string/easy.json

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} at ${res.url}`);
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
        const sample = (await res.text()).slice(0, 120);
        throw new Error(`Unexpected content-type (${ct}); sample: ${sample}`);
        }
        const json = await res.json();
        setState({ loading: false, error: null,  json });
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

  return (
    <div className="questions-page">
      <PVNavbar user={user} />

      <div className="questions-container">
        <div className="questions-header pv-card">
          <div className="qh-left">
            <button className="pv-btn" onClick={() => navigate(-1)}>← Back</button>
            <h2 style={{ marginLeft: 12 }}>{topicName} • {difficultyLabel}</h2>
          </div>
        </div>

        {state.loading && (
          <div className="pv-card" style={{ padding: 20, marginTop: 16 }}>
            Loading questions…
          </div>
        )}

        {state.error && (
          <div className="pv-card" style={{ padding: 20, marginTop: 16, color: "red" }}>
            {state.error}
          </div>
        )}

        {state.data && (
          <div className="pv-card" style={{ padding: 0, marginTop: 16 }}>
            <ul className="qlist">
              {state.data.questions.map((q) => {
                const href = `https://leetcode.com/problems/${q.slug}/`;
                return (
                  <li key={q.slug} className="qrow">
                    <div className="qleft">
                      <span className="qpos">{q.position}.</span>
                      <a className="qtitle" href={href} target="_blank" rel="noopener noreferrer">
                        {q.title}
                      </a>
                    </div>
                    <div className="qright">
                      <span className={`qdifficulty qd-${(q.difficulty || "").toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                      <span className="qmeta">{Math.round(q.acceptance)}% AC</span>
                      <a className="pv-btn-royal" href={href} target="_blank" rel="noopener noreferrer">
                        Solve on LeetCode
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
