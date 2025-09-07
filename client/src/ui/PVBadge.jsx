export default function PVBadge({ children, tone = "muted" }) {
    const map = {
      muted: { bg: "#eef2f7", color: "#334155" },
      topic: { bg: "#ecfeff", color: "#155e75" },
      difficulty: { bg: "#fff7ed", color: "#9a3412" },
      success: { bg: "#ecfdf5", color: "#065f46" },
      warn: { bg: "#fffbeb", color: "#92400e" },
    }[tone];
    return (
      <span style={{
        display: "inline-block", padding: "4px 8px", fontSize: 12, fontWeight: 600,
        color: map.color, background: map.bg, borderRadius: 9999,
      }}>
        {children}
      </span>
    );
  }
  