export default function PVProgressRing({ size = 56, stroke = 6, progress = 0, color = "var(--pv-primary)", label }) {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (progress / 100) * circ;
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" style={{ strokeDasharray: circ, strokeDashoffset: offset, transition: "stroke-dashoffset .4s" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          fontSize: 12, fontWeight: 700, color: "var(--pv-ink)"
        }}>
          {label ?? `${progress}%`}
        </div>
      </div>
    );
  }
  