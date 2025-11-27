// client/src/pages/TracksPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TracksPage.css";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { TOPIC_SLUGS } from "../lib/topicSlugs";

/* --------------------------------- Config -------------------------------- */

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
const DEFAULT_USERNAME = "Swadha_K"; // replace later with context/profile mapping

const TRACKS = [
  "Array","String","Hash Table","Dynamic Programming","Math","Sorting","Greedy",
  "Depth-First Search","Binary Search","Database","Matrix","Tree","Breadth-First Search",
  "Bit Manipulation","Two Pointers","Prefix Sum","Heap (Priority Queue)","Simulation","Binary Tree",
  "Graph","Stack","Counting","Sliding Window","Design","Enumeration","Backtracking",
  "Union Find","Linked List","Number Theory","Ordered Set","Monotonic Stack","Segment Tree","Trie",
  "Combinatorics","Bitmask","Divide and Conquer","Queue","Recursion","Geometry",
  "Binary Indexed Tree","Memoization","Hash Function","Binary Search Tree","Shortest Path",
  "String Matching","Topological Sort","Rolling Hash","Game Theory","Interactive","Data Stream",
  "Monotonic Queue","Brainteaser","Doubly-Linked List","Randomized","Merge Sort","Counting Sort",
  "Iterator","Concurrency","Probability and Statistics","Quickselect","Suffix Array","Line Sweep",
  "Minimum Spanning Tree","Bucket Sort","Shell","Reservoir Sampling","Strongly Connected Component",
  "Eulerian Circuit","Radix Sort","Rejection Sampling","Biconnected Component"
];

const TOPIC_ICONS = { "Array": "📊","String": "🔤","Hash Table": "🗂️","Dynamic Programming": "🧩","Math": "➗","Sorting": "↕️","Greedy":"🎯",
  "Depth-First Search": "🏔️","Binary Search": "🔍","Database": "💾","Matrix": "⬜","Tree": "🌳","Breadth-First Search":"🌊",
  "Bit Manipulation": "⚙️","Two Pointers":"👉","Prefix Sum":"➕","Heap (Priority Queue)":"⛰️","Simulation":"🎮","Binary Tree":"🌴",
  "Graph":"🕸️","Stack":"📚","Counting":"🔢","Sliding Window":"🪟","Design":"🎨","Enumeration":"📋","Backtracking":"↩️",
  "Union Find":"🔗","Linked List":"⛓️","Number Theory":"🔣","Ordered Set":"📑","Monotonic Stack":"📉","Segment Tree":"🌿","Trie":"🔱",
  "Combinatorics":"🎰","Bitmask":"🎭","Divide and Conquer":"⚔️","Queue":"📥","Recursion":"🔄","Geometry":"📐",
  "Binary Indexed Tree":"🎄","Memoization":"💭","Hash Function":"🔐","Binary Search Tree":"🌲","Shortest Path":"🛤️",
  "String Matching":"🔎","Topological Sort":"🗺️","Rolling Hash":"🎲","Game Theory":"♟️","Interactive":"💬","Data Stream":"💧",
  "Monotonic Queue":"📯","Brainteaser":"🧠","Doubly-Linked List":"🔂","Randomized":"🎪","Merge Sort":"🔀","Counting Sort":"🧮",
  "Iterator":"🔁","Concurrency":"⚡","Probability and Statistics":"📈","Quickselect":"⏩","Suffix Array":"📝","Line Sweep":"📏",
  "Minimum Spanning Tree":"🌐","Bucket Sort":"🪣","Shell":"🐚","Reservoir Sampling":"💦","Strongly Connected Component":"🔵",
  "Eulerian Circuit":"🔃","Radix Sort":"💯","Rejection Sampling":"🚫","Biconnected Component":"🟢"
};

// reverse TOPIC_SLUGS {name->slug} → {slug->name}
const SLUG_TO_NAME = Object.fromEntries(
  Object.entries(TOPIC_SLUGS).map(([name, slug]) => [slug, name])
);

/* ---------------------------- Small UI helpers --------------------------- */

function LockedPill() { return <span className="duo-locked-pill">🔒</span>; }

function TierRow({ label, value, unlocked, onSolve }) {
  return (
    <div className="duo-tier-row">
      <div className="duo-tier-left">
        <div className={`duo-tier-label ${unlocked ? 'unlocked' : 'locked'}`}>{label}</div>
        <div className="duo-tier-progress-bar">
          <div className="duo-tier-progress-fill" style={{ width: `${value}%` }} />
        </div>
      </div>
      <div className="duo-tier-right">
        <span className="duo-tier-percentage">{value}%</span>
        {unlocked ? <button className="duo-tier-btn" onClick={onSolve}>Start →</button> : <LockedPill />}
      </div>
    </div>
  );
}

function roundedPath(points) {
  if (points.length < 2) return "";
  const r = 20;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]; const c = points[i];
    const dx = c.x - p.x, dy = c.y - p.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len,  uy = dy / len;
    const px = c.x - ux * r, py = c.y - uy * r;
    d += ` L ${px} ${py}`;
    if (i < points.length - 1) {
      const n = points[i + 1];
      const ndx = n.x - c.x, ndy = n.y - c.y, nlen = Math.hypot(ndx, ndy) || 1;
      const nux = ndx / nlen, nuy = ndy / nlen;
      const nx = c.x + nux * r, ny = c.y + nuy * r;
      d += ` Q ${c.x} ${c.y} ${nx} ${ny}`;
    } else { d += ` L ${c.x} ${c.y}`; }
  }
  return d;
}

function TrackNode({ x, y, title, p, active, onClick, index }) {
  const { foundation, intermediate, advanced } = p;
  const isCompleted = foundation >= 90 && intermediate >= 90 && advanced >= 90;
  const isStarted = foundation > 0 || intermediate > 0 || advanced > 0;
  const icon = TOPIC_ICONS[title] || "💡";
  return (
    <div
      onClick={onClick}
      title={title}
      className={`duo-track-node ${active ? 'active' : ''} ${isCompleted ? 'completed' : isStarted ? 'started' : 'not-started'}`}
      style={{ left: x - 40, top: y - 40, animationDelay: `${index * 0.04}s` }}
    >
      <div className="duo-node-circle">
        <span className="duo-node-icon">{isCompleted ? '✓' : icon}</span>
      </div>
      <div className="duo-node-label">{title}</div>
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function TracksPage() {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(1200);
  const [openIndex, setOpenIndex] = useState(-1);
  const navigate = useNavigate();
  const { user } = useAuth();

  // filled from server precompute; default 0s
  const [progress, setProgress] = useState(
    TRACKS.reduce((acc, t) => { acc[t] = { foundation:0, intermediate:0, advanced:0 }; return acc; }, {})
  );

  const DIFF_MAP = useMemo(() => ({
    Foundation: "EASY",
    Intermediate: "MEDIUM",
    Advanced: "HARD"
  }), []);

  const goToQuestions = (topicTitle, label) => {
    const diffKey = DIFF_MAP[label];
    const slug = TOPIC_SLUGS[topicTitle];
    if (!diffKey || !slug) return;
    navigate(`/tracks/${slug}/${diffKey.toLowerCase()}`, {
      state: { topicName: topicTitle, difficulty: diffKey }
    });
  };

  // Layout watchers
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setWrapW(e.contentRect.width);
    });
    obs.observe(el); setWrapW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  // Fetch precomputed track/tier percentages once
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/public/leetcode/track-progress?username=${encodeURIComponent(DEFAULT_USERNAME)}`, {
          headers: { accept: "application/json" }
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || r.statusText);

        const next = {};
        for (const t of TRACKS) next[t] = { foundation:0, intermediate:0, advanced:0 };

        for (const [slug, tiers] of Object.entries(j.tracks || {})) {
          const name = SLUG_TO_NAME[slug];
          if (!name) continue;
          next[name] = {
            foundation:   tiers?.foundation?.percent   ?? 0,
            intermediate: tiers?.intermediate?.percent ?? 0,
            advanced:     tiers?.advanced?.percent     ?? 0,
          };
        }
        setProgress(next);
      } catch (e) {
        console.warn("track-progress fetch failed:", e);
      }
    })();
  }, []);

  // Grid positions
  const COLS = 6, MARGIN_X = 80, MARGIN_Y = 100, V_GAP = 160;
  const usableW = Math.max(600, wrapW - MARGIN_X * 2);
  const stepX = usableW / (COLS - 1);
  const rows = Math.ceil(TRACKS.length / COLS);
  const canvasH = MARGIN_Y + (rows - 1) * V_GAP + 200;

  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < TRACKS.length; i++) {
      const row = Math.floor(i / COLS);
      const idxInRow = i % COLS;
      const reversed = row % 2 === 1;
      const col = reversed ? COLS - 1 - idxInRow : idxInRow;
      const x = MARGIN_X + col * stepX;
      const y = MARGIN_Y + row * V_GAP;
      arr.push({ title: TRACKS[i], x, y });
    }
    return arr;
  }, [stepX]);

  const pathPoints = useMemo(() => nodes.map(n => ({ x: n.x, y: n.y })), [nodes]);
  const pathD = useMemo(() => roundedPath(pathPoints), [pathPoints]);
  const open = openIndex >= 0 ? nodes[openIndex] : null;

  const totalProgress = useMemo(() => {
    const vals = Object.values(progress);
    if (!vals.length) return 0;
    const total = vals.reduce((sum, p) => sum + p.foundation + p.intermediate + p.advanced, 0);
    return Math.round(total / (vals.length * 3));
  }, [progress]);

  return (
    <div className="duo-tracks-root">
      <PVNavbar user={user} />

      <div className="duo-tracks-container">
        <div className="duo-tracks-content">
          <div className="duo-tracks-header">
            <div className="duo-header-top">
              <div className="duo-header-left">
                <h1 className="duo-tracks-title">🎯 Learning Tracks</h1>
                <p className="duo-tracks-subtitle">Master {TRACKS.length} coding topics through structured practice</p>
              </div>
              <div className="duo-header-right">
                <div className="duo-stat-card">
                  <div className="duo-stat-label">Progress</div>
                  <div className="duo-stat-value">{totalProgress}%</div>
                </div>
              </div>
            </div>
            <div className="duo-header-progress">
              <div className="duo-header-progress-bar">
                <div className="duo-header-progress-fill" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="duo-tracks-card">
            <div ref={wrapRef} className="duo-tracks-canvas-wrapper">
              <div className="duo-tracks-canvas" style={{ height: canvasH }}>
                <svg width="100%" height={canvasH} className="duo-tracks-svg">
                  <defs>
                    <linearGradient id="duoPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(96,165,250,0.5)" />
                      <stop offset="100%" stopColor="rgba(59,130,246,0.5)" />
                    </linearGradient>
                  </defs>
                  <path d={pathD} fill="none" stroke="url(#duoPathGradient)" strokeWidth="12" strokeLinecap="round" />
                  <path d={pathD} fill="none" stroke="rgba(96,165,250,0.8)" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 8" className="duo-animated-path" />
                </svg>

                {nodes.map((n, i) => (
                  <TrackNode
                    key={n.title}
                    x={n.x}
                    y={n.y}
                    title={n.title}
                    p={progress[n.title]}
                    active={openIndex === i}
                    index={i}
                    onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                  />
                ))}

                {open && (
                  <div
                    className="duo-track-drawer"
                    style={{ left: Math.max(20, Math.min(open.x - 200, wrapW - 420)), top: open.y + 80 }}
                  >
                    <div className="duo-drawer-card">
                      <div className="duo-drawer-header">
                        <h3 className="duo-drawer-title">{open.title}</h3>
                        <button onClick={() => setOpenIndex(-1)} className="duo-drawer-close">✕</button>
                      </div>
                      <div className="duo-drawer-content">
                        {(() => {
                          const p = progress[open.title] || { foundation:0, intermediate:0, advanced:0 };
                          const intUnlocked = p.foundation >= 70;
                          const advUnlocked = p.intermediate >= 70;
                          return (
                            <div className="duo-tiers-list">
                              <TierRow label="Foundation"   value={p.foundation}   unlocked onSolve={() => goToQuestions(open.title, "Foundation")} />
                              <TierRow label="Intermediate" value={p.intermediate} unlocked={intUnlocked} onSolve={() => goToQuestions(open.title, "Intermediate")} />
                              <TierRow label="Advanced"     value={p.advanced}     unlocked={advUnlocked} onSolve={() => goToQuestions(open.title, "Advanced")} />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}