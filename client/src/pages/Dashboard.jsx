import PVCard from "../ui/PVCard";
import PVBadge from "../ui/PVBadge";
import PVButton from "../ui/PVButton";
import PVUnitNode from "../ui/PVUnitNode";
import PVProgressRing from "../ui/PVProgressRing";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  // Placeholder stats — hook up later to Firestore/your API
  const today = { title: "Two Sum", tags: ["Array", "HashMap"], difficulty: "Easy" };
  const units = [
    { title: "DSA Fundamentals", desc: "Arrays • HashMaps • Two Pointers", progress: 60, unlocked: true },
    { title: "Graphs & Traversals", desc: "BFS • DFS • Components", progress: 20, unlocked: true },
    { title: "System Design Intro", desc: "Caching • Rate Limit • Sharding", progress: 0, unlocked: false },
  ];

  return (
    <div className="grid-2">
      <div className="vstack">
        <PVCard
          title={`Today’s Challenge`}
          subtitle="Finish this to keep your streak 🔥"
          actions={<PVBadge tone="difficulty">{today.difficulty}</PVBadge>}
        >
          <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "var(--pv-ink)" }}>{today.title}</div>
              <div className="hstack" style={{ marginTop: 6, gap: 6 }}>
                {today.tags.map(t => <PVBadge key={t} tone="topic">{t}</PVBadge>)}
              </div>
            </div>
            <PVButton onClick={()=>window.open("https://leetcode.com/problems/two-sum/", "_blank")}>Solve on LeetCode</PVButton>
          </div>
        </PVCard>

        <PVCard title="Your Track" subtitle="Progress toward Backend Engineer">
          <div className="vstack">
            {units.map((u, i) => (
              <PVUnitNode
                key={i}
                title={u.title}
                desc={u.desc}
                progress={u.progress}
                unlocked={u.unlocked}
                onContinue={()=>{}}
              />
            ))}
          </div>
        </PVCard>
      </div>

      <div className="vstack">
        <PVCard title="Your Streak" subtitle="Keep the flame alive">
          <div className="hstack" style={{ alignItems: "center", gap: 16 }}>
            <PVProgressRing progress={72} color="var(--pv-secondary)" label="7d" />
            <div>
              <div style={{ fontWeight: 700, color: "var(--pv-ink)" }}>Current streak: 7 days</div>
              <div style={{ fontSize: 13, color: "var(--pv-muted)" }}>Best streak: 14 days</div>
            </div>
          </div>
        </PVCard>

        <PVCard title="Leaderboard (top 5)">
          <div className="vstack">
            {[["1", "Aarav", 1840], ["2", "Isha", 1720], ["3", "Rohit", 1650], ["4","Zara",1580], ["5","You",1530]].map(([rank, name, score]) => (
              <div key={rank} className="hstack" style={{ justifyContent: "space-between", borderBottom: "1px dashed var(--pv-border)", paddingBottom: 8 }}>
                <div className="hstack"><strong>#{rank}</strong><span style={{ marginLeft: 10 }}>{name}</span></div>
                <div style={{ fontWeight: 700 }}>{score}</div>
              </div>
            ))}
          </div>
        </PVCard>

        <PVCard title="Welcome" subtitle="Signed in user">
          <div style={{ fontSize: 14 }}>
            <div><strong>Name:</strong> {user?.displayName || "—"}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>UID:</strong> {user?.uid}</div>
          </div>
        </PVCard>
      </div>
    </div>
  );
}
