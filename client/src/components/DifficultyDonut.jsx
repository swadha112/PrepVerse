// client/src/components/DifficultyDonut.jsx
import React, { useState } from "react";

/**
 * Segmented donut: Easy (green), Medium (yellow), Hard (red).
 * If `half` is true, it renders the top semicircle.
 */
export default function DifficultyDonut({
  easy = 0,
  medium = 0,
  hard = 0,
  total,
  half = true,
  innerLabel = "",
  title = "Difficulty Breakdown",
  className = "",
}) {
  const parts = [
    { key: "easy",   val: Number(easy)   || 0, color: "#22c55e" }, // green
    { key: "medium", val: Number(medium) || 0, color: "#eab308" }, // yellow
    { key: "hard",   val: Number(hard)   || 0, color: "#ef4444" }, // red
  ];
  const sum = total != null ? Math.max(0, Number(total)) : parts.reduce((s, p) => s + p.val, 0);
  const safeSum = sum > 0 ? sum : 1;

  const pct = (v) => Math.round((Math.max(0, v) / safeSum) * 100);

  const partsWithPct = parts.map(p => ({
    ...p,
    pct: pct(p.val),
    label: p.key === "easy" ? "Easy" : p.key === "medium" ? "Medium" : "Hard"
  }));

  const [hovered, setHovered] = useState(null);

  // SVG geometry
  const W = 280;
  const H = half ? 180 : 280;
  const cx = W / 2;
  const cy = half ? H - 10 : H / 2;
  const r  = half ? 85 : 90;
  const trackW = 18;
  const segW   = 14;

  // Build arc path for an angle range
  const arc = (cx, cy, r, a0, a1) => {
    const sx = cx + r * Math.cos(a0);
    const sy = cy + r * Math.sin(a0);
    const ex = cx + r * Math.cos(a1);
    const ey = cy + r * Math.sin(a1);
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`;
  };

  // half: draw 180° from left→right across the top; full: 360° clockwise
  const totalAng  = half ? Math.PI : Math.PI * 2;
  const startAng  = half ? Math.PI : -Math.PI / 2;
  const trackPath = arc(cx, cy, r, startAng, startAng + totalAng);

  // cumulative angles so each slice is visible
  let used = 0;
  const segsData = partsWithPct.map(({ key, val, pct, color, label }) => {
    const frac  = Math.max(0, val) / safeSum;
    const delta = frac * totalAng;
    const a0 = startAng + used;
    const a1 = a0 + delta;
    used += delta;
    return { key, color, val, pct, label, d: delta > 0 ? arc(cx, cy, r, a0, a1) : null, show: delta > 0.003 };
  });

  const centerText = hovered ? `${hovered.label} ${hovered.pct}%` : innerLabel;

  return (
    <div className={className} style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>{title}</h2>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Difficulty breakdown">
        {/* track */}
        <path d={trackPath} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={trackW} strokeLinecap="round" />
        {/* slices */}
        {segsData.map(s => s.show && (
          <path
            key={s.key}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={segW}
            strokeLinecap="round"
            title={`${s.label} ${s.val} (${s.pct}%)`}
            onMouseEnter={() => setHovered({ label: s.label, pct: s.pct })}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", pointerEvents: "stroke" }}
          />
        ))}
        {/* center label */}
        {centerText && (
          <text x={cx} y={half ? cy - 6 : cy + 6} textAnchor="middle"
                fontSize="22" fontWeight="700" fill="#111827" opacity="0.85">
            {centerText}
          </text>
        )}
      </svg>

      {/* legend */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        {partsWithPct.map(p => (
          <Legend
            key={p.key}
            color={p.color}
            text={`${p.label === "Medium" ? "Med" : p.label} ${p.val}`}
            title={`${p.label} ${p.pct}%`}
            onMouseEnter={() => setHovered({ label: p.label, pct: p.pct })}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ color, text, title, onMouseEnter, onMouseLeave }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1f2937", fontWeight: 300, cursor: "pointer" }}
      title={title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <i style={{ width: 14, height: 14, borderRadius: 999, background: color, display: "inline-block" }} />
      {text}
    </span>
  );
}