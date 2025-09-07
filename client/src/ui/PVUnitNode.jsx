import PVProgressRing from "./PVProgressRing";
import PVBadge from "./PVBadge";
import PVButton from "./PVButton";

/* A Duolingo-like unit card */
export default function PVUnitNode({ title, desc, progress = 0, unlocked = true, onContinue, color = "var(--pv-primary)" }) {
  return (
    <div className="pv-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", opacity: unlocked ? 1 : 0.6 }}>
      <PVProgressRing progress={progress} color={color} />
      <div style={{ flex: 1 }}>
        <div className="hstack" style={{ gap: 8 }}>
          <h4 style={{ margin: 0, color: "var(--pv-ink)" }}>{title}</h4>
          {!unlocked && <PVBadge tone="muted">Locked</PVBadge>}
        </div>
        <div style={{ color: "var(--pv-muted)", fontSize: 13, marginTop: 4 }}>{desc}</div>
        <div style={{ marginTop: 8 }}>
          <PVButton variant={unlocked ? "primary" : "secondary"} size="sm" onClick={onContinue} disabled={!unlocked}>
            {progress >= 100 ? "Review" : "Continue"}
          </PVButton>
        </div>
      </div>
    </div>
  );
}
