import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TracksPage.css";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
/* ------------------------------
   Static LeetCode Topic Tracks
------------------------------ */
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

/* seed progress (wire to backend later) */
const INITIAL_PROGRESS = TRACKS.reduce((acc, t) => {
  acc[t] = { 
    foundation: Math.floor(Math.random() * 100), 
    intermediate: Math.floor(Math.random() * 100), 
    advanced: Math.floor(Math.random() * 100) 
  };
  return acc;
}, {});

/* small "Locked" pill */
function LockedPill() {
  return <span className="locked-pill">🔒 Locked</span>;
}

function TierRow({ label, value, unlocked, onSolve }) {
  return (
    <div className="tier-row">
      <div className={`tier-label ${unlocked ? 'unlocked' : 'locked'}`}>
        {label}
      </div>
      <div className="tier-right">
        <div className="tier-progress">
          <div 
            className="tier-progress-fill"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="tier-percentage">{value}%</span>
        {unlocked ? (
          <button className="pv-btn-royal tier-btn" onClick={onSolve}>
            Solve
          </button>
        ) : (
          <LockedPill />
        )}
      </div>
    </div>
  );
}

/* smooth path util: converts points to a rounded SVG path */
function roundedPath(points) {
  if (points.length < 2) return "";
  const r = 20;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const px = c.x - ux * r;
    const py = c.y - uy * r;

    if (i === 1) d += ` L ${px} ${py}`;
    else d += ` L ${px} ${py}`;

    if (i < points.length - 1) {
      const n = points[i + 1];
      const ndx = n.x - c.x;
      const ndy = n.y - c.y;
      const nlen = Math.hypot(ndx, ndy) || 1;
      const nux = ndx / nlen;
      const nuy = ndy / nlen;

      const cx1 = c.x;
      const cy1 = c.y;
      const nx = c.x + nux * r;
      const ny = c.y + nuy * r;

      d += ` Q ${cx1} ${cy1} ${nx} ${ny}`;
    } else {
      d += ` L ${c.x} ${c.y}`;
    }
  }
  return d;
}

/* one clickable node on the snake */
function TrackNode({ x, y, title, p, active, onClick, index, totalNodes }) {
  const { foundation, intermediate, advanced } = p;
  const intUnlocked = foundation >= 70;
  const advUnlocked = intermediate >= 70;
  
  // Calculate completion status
  const avgProgress = (foundation + (intUnlocked ? intermediate : 0) + (advUnlocked ? advanced : 0)) / 
    (1 + (intUnlocked ? 1 : 0) + (advUnlocked ? 1 : 0));
  
  const isCompleted = foundation >= 90 && intermediate >= 90 && advanced >= 90;
  const isStarted = foundation > 0 || intermediate > 0 || advanced > 0;

  return (
    <div
      onClick={onClick}
      title={title}
      className={`track-node ${active ? 'active' : ''} ${isCompleted ? 'completed' : isStarted ? 'started' : 'not-started'}`}
      style={{
        left: x - 30,
        top: y - 30,
        animationDelay: `${index * 0.1}s`
      }}
    >
      {/* Main circle */}
      <div className="track-node-circle">
        <span className="track-node-content">
          {isCompleted ? "✓" : index + 1}
        </span>
      </div>
      
      {/* Label */}
      <div className="track-node-label">
        {title}
      </div>
    </div>
  );
}

/* ------------------------------
   Main: Serpentine Tracks Page
------------------------------ */
export default function TracksPage() {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(1200);
  const [progress] = useState(INITIAL_PROGRESS);
  const [openIndex, setOpenIndex] = useState(-1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setWrapW(e.contentRect.width);
      }
    });
    obs.observe(el);
    setWrapW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const COLS = wrapW >= 1200 ? 6 : wrapW >= 900 ? 5 : wrapW >= 700 ? 4 : wrapW >= 520 ? 3 : 2;
  const MARGIN_X = 60;
  const MARGIN_Y = 80;
  const H = 140;
  const usableW = Math.max(300, wrapW - MARGIN_X * 2);
  const stepX = COLS > 1 ? usableW / (COLS - 1) : 0;

  const rows = Math.ceil(TRACKS.length / COLS);
  const canvasH = MARGIN_Y * 2 + (rows - 1) * H + 150;

  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < TRACKS.length; i++) {
      const row = Math.floor(i / COLS);
      const idxInRow = i % COLS;
      const reversed = row % 2 === 1;
      const col = reversed ? COLS - 1 - idxInRow : idxInRow;
      const x = MARGIN_X + col * stepX;
      const y = MARGIN_Y + row * H;
      arr.push({ title: TRACKS[i], x, y });
    }
    return arr;
  }, [COLS, stepX]);

  const pathPoints = useMemo(() => nodes.map(n => ({ x: n.x, y: n.y })), [nodes]);
  const pathD = useMemo(() => roundedPath(pathPoints), [pathPoints]);

  const open = openIndex >= 0 ? nodes[openIndex] : null;
  const { user } = useAuth();
  return (  
  <div className="tracks-root">
   
    <PVNavbar user={user}  />

    <div className="tracks-container">
      <div className="tracks-content">
        <div className="tracks-header pv-fade-in">
          <h1 className="tracks-title">Learning Tracks</h1>
          <p className="tracks-subtitle">
            Follow the serpentine path through coding topics. Intermediate unlocks at <strong>70%</strong> Foundation, 
            Advanced unlocks at <strong>70%</strong> Intermediate.
          </p>
        </div>

        <div className="tracks-card pv-card">
          <div
            ref={wrapRef}
            className="tracks-canvas-wrapper"
          >
            <div className="tracks-canvas" style={{ height: canvasH }}>
              {/* Animated path */}
              <svg width="100%" height={canvasH} className="tracks-svg">
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(30, 58, 138, 0.3)" />
                    <stop offset="50%" stopColor="rgba(30, 64, 175, 0.3)" />
                    <stop offset="100%" stopColor="rgba(37, 99, 235, 0.3)" />
                  </linearGradient>
                  <linearGradient id="pathStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(30, 58, 138, 0.6)" />
                    <stop offset="50%" stopColor="rgba(30, 64, 175, 0.6)" />
                    <stop offset="100%" stopColor="rgba(37, 99, 235, 0.6)" />
                  </linearGradient>
                </defs>
                
                {/* Shadow path */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="rgba(0,0,0,0.1)" 
                  strokeWidth="16" 
                  strokeLinecap="round"
                  transform="translate(2, 2)"
                />
                
                {/* Main path with gradient */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="url(#pathGradient)" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                />
                
                {/* Animated stroke */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="url(#pathStroke)" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray="20 10"
                  strokeDashoffset="0"
                  className="animated-path"
                />
              </svg>

              {/* nodes */}
              {nodes.map((n, i) => (
                <TrackNode
                  key={n.title}
                  x={n.x}
                  y={n.y}
                  title={n.title}
                  p={progress[n.title]}
                  active={openIndex === i}
                  index={i}
                  totalNodes={nodes.length}
                  onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                />
              ))}

              {/* Enhanced inline drawer */}
              {open && (
                <div
                  className="track-drawer pv-scale-in"
                  style={{
                    left: Math.max(12, Math.min(open.x - 200, wrapW - 400)),
                    top: open.y + 60,
                  }}
                >
                  <div className="drawer-card pv-card">
                    <div className="drawer-header">
                      <h3 className="drawer-title">{open.title}</h3>
                      <button
                        onClick={() => setOpenIndex(-1)}
                        className="drawer-close-btn"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="drawer-content">
                      {(() => {
                        const p = progress[open.title];
                        const intUnlocked = p.foundation >= 70;
                        const advUnlocked = p.intermediate >= 70;
                        return (
                          <div className="tiers-list">
                            <TierRow
                              label="Foundation"
                              value={p.foundation}
                              unlocked
                              onSolve={() => console.log("Solve Foundation:", open.title)}
                            />
                            <TierRow
                              label="Intermediate"
                              value={p.intermediate}
                              unlocked={intUnlocked}
                              onSolve={() => console.log("Solve Intermediate:", open.title)}
                            />
                            <TierRow
                              label="Advanced"
                              value={p.advanced}
                              unlocked={advUnlocked}
                              onSolve={() => console.log("Solve Advanced:", open.title)}
                            />
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