// src/components/InterviewPost.tsx
import React, { useEffect, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Calendar,
  Star as LucideStar,
  Briefcase,
  Cpu,
  ClipboardList,
  HelpCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import CommentSection from "./CommentSection";

const getRoleIcon = (type?: string) => {
  if (!type) return <HelpCircle className="w-4 h-4" />;
  switch (type.toLowerCase()) {
    case "hr":
      return <Briefcase className="w-4 h-4" />;
    case "technical":
      return <Cpu className="w-4 h-4" />;
    case "behavioral":
      return <ClipboardList className="w-4 h-4" />;
    default:
      return <HelpCircle className="w-4 h-4" />;
  }
};

const formatDate = (raw?: any) => {
  if (!raw) return "";
  let d: Date | null = null;

  if (raw?.toDate && typeof raw.toDate === "function") {
    d = raw.toDate();
  } else if (raw?.seconds && typeof raw.seconds === "number") {
    d = new Date(raw.seconds * 1000);
  } else {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) d = parsed;
  }

  if (!d) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

interface Props {
  id: string;
  company?: string;
  role?: string;
  interviewDate?: any;
  date?: any;
  createdAt?: any;
  interviewType?: string;
  difficulty?: number | string;
  outcome?: string;
  content?: string;
  preparationTip?: string;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  author?: string;
  companyLogo?: string;
}

const clamp = (n: number, min = 0, max = 5) => Math.max(min, Math.min(max, n));

export default function InterviewPost(props: Props) {
  const {
    id,
    company = "",
    role = "",
    interviewDate,
    date,
    createdAt,
    interviewType,
    difficulty = 0,
    outcome = "",
    content = "",
    preparationTip,
    upvotes = 0,
    downvotes = 0,
    comments = 0,
    author = "Anonymous",
    companyLogo,
  } = props;

  const rawDate = interviewDate ?? date ?? createdAt ?? null;
  const formattedDate = formatDate(rawDate);

  const numericDifficulty = (() => {
    const n = typeof difficulty === "string" ? Number(difficulty) : Number(difficulty || 0);
    if (isNaN(n)) return 0;
    return clamp(Math.round(n), 0, 5);
  })();

  const user = { uid: "testUser1" };

  const [voteStatus, setVoteStatus] = useState<"upvote" | "downvote" | null>(null);
  const [liveUpvotes, setLiveUpvotes] = useState<number>(upvotes || 0);
  const [liveDownvotes, setLiveDownvotes] = useState<number>(downvotes || 0);
  const [liveComments, setLiveComments] = useState<number>(comments || 0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "experiences", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      setLiveUpvotes(data.upvotes || 0);
      setLiveDownvotes(data.downvotes || 0);
      setLiveComments(data.comments || 0);
      setVoteStatus(data.votes?.[user.uid] || null);
    });
    return () => unsub();
  }, [id, user.uid]);

  const handleVote = async (type: "upvote" | "downvote") => {
    if (!user || !id) return;
    const ref = doc(db, "experiences", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as any;
    const votes = data.votes || {};
    const current = votes[user.uid];

    try {
      if (current === type) {
        await updateDoc(ref, {
          [type === "upvote" ? "upvotes" : "downvotes"]: increment(-1),
          [`votes.${user.uid}`]: null,
        });
      } else if (current && current !== type) {
        await updateDoc(ref, {
          upvotes: type === "upvote" ? increment(1) : increment(-1),
          downvotes: type === "downvote" ? increment(1) : increment(-1),
          [`votes.${user.uid}`]: type,
        });
      } else {
        await updateDoc(ref, {
          [type === "upvote" ? "upvotes" : "downvotes"]: increment(1),
          [`votes.${user.uid}`]: type,
        });
      }
    } catch (err) {
      console.error("vote update error", err);
    }
  };

  // ✅ Outcome badge styling (green / red / yellow)
  const outcomeMeta = (() => {
    const n = (outcome || "").toLowerCase();
    if (n.includes("select") || n.includes("pass") || n.includes("offer"))
      return {
        label: "Selected",
        bg: "rgba(22,163,74,0.10)", // pv-success glass
        color: "var(--pv-success)",
        icon: <CheckCircle style={{ width: 14, height: 14 }} />,
      };
    if (n.includes("rej") || n.includes("fail"))
      return {
        label: "Rejected",
        bg: "rgba(239,68,68,0.10)",
        color: "var(--pv-error)",
        icon: <XCircle style={{ width: 14, height: 14 }} />,
      };
    return {
      label: "Pending",
      bg: "rgba(245,158,11,0.12)",
      color: "var(--pv-warn)",
      icon: <Clock style={{ width: 14, height: 14 }} />,
    };
  })();

  const renderAvatar = () => {
    if (companyLogo) {
      return (
        <img
          src={companyLogo}
          alt={company}
          style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }}
        />
      );
    }
    const initial = (company && company[0]) || (role && role[0]) || "C";
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: "linear-gradient(135deg,var(--pv-royal-800),var(--pv-royal-600))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {String(initial).toUpperCase()}
      </div>
    );
  };

  return (
    <article
      className="pv-card pv-slide-up"
      style={{ padding: 18, borderRadius: 12, border: "1px solid var(--pv-border)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          gridTemplateRows: "auto auto",
          gap: 12,
          alignItems: "start",
        }}
      >
        {/* Avatar (left) */}
        <div style={{ gridColumn: "1 / 2", gridRow: "1 / 3" }}>{renderAvatar()}</div>

        {/* Header row with title/company + outcome badge */}
        <div
          style={{
            gridColumn: "2 / 3",
            gridRow: "1 / 2",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h4 style={{ margin: 0, color: "var(--pv-ink)", fontSize: 18 }}>{role}</h4>
            <p style={{ margin: "6px 0 0", color: "var(--pv-muted)", fontSize: 13 }}>{company}</p>
          </div>

          {/* ✅ Outcome "card" badge */}
          <div
            title={`Outcome: ${outcomeMeta.label}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 12,
              background: outcomeMeta.bg,
              color: outcomeMeta.color,
              fontWeight: 700,
              fontSize: 13,
              border: "1px solid var(--pv-glass-border)",
              boxShadow: "var(--pv-shadow-glass)",
              whiteSpace: "nowrap",
            }}
          >
            {outcomeMeta.icon}
            <span>{outcomeMeta.label}</span>
          </div>
        </div>

        {/* Meta icons row */}
        <div
          style={{
            gridColumn: "1 / 3",
            gridRow: "2 / 3",
            display: "flex",
            gap: 14,
            alignItems: "center",
            color: "var(--pv-muted)",
            fontSize: 13,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {formattedDate && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Calendar className="w-4 h-4" /> <span>{formattedDate}</span>
            </span>
          )}

          {interviewType && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textTransform: "capitalize",
              }}
            >
              {getRoleIcon(interviewType)} <span>{interviewType}</span>
            </span>
          )}

          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Difficulty:</span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < numericDifficulty;
                return (
                  <LucideStar
                    key={i}
                    size={16}
                    strokeWidth={1.6}
                    stroke={filled ? "#f59e0b" : "#cbd5e1"}
                    fill={filled ? "#f59e0b" : "none"}
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                  />
                );
              })}
            </span>
          </span>
        </div>

        {/* Content */}
        <div style={{ gridColumn: "1 / 3", gridRow: "3 / 4", marginTop: 12 }}>
          <div style={{ color: "var(--pv-body)", lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>{content}</p>

            {preparationTip && (
              <p
                style={{
                  marginTop: 10,
                  background: "rgba(37,99,235,0.06)",
                  color: "var(--pv-royal-600)",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                💡 Preparation Tip: {preparationTip}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: votes / comments / author */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleVote("upvote")}
            aria-pressed={voteStatus === "upvote"}
            className="pv-btn-glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: voteStatus === "upvote" ? "rgba(16,185,129,0.08)" : "transparent",
              color: voteStatus === "upvote" ? "var(--pv-success)" : "var(--pv-royal-800)",
              cursor: "pointer",
            }}
          >
            <ThumbsUp className={`w-4 h-4 ${voteStatus === "upvote" ? "text-green-600" : ""}`} />
            <span>{liveUpvotes}</span>
          </button>

          <button
            onClick={() => handleVote("downvote")}
            aria-pressed={voteStatus === "downvote"}
            className="pv-btn-glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: voteStatus === "downvote" ? "rgba(239,68,68,0.08)" : "transparent",
              color: voteStatus === "downvote" ? "var(--pv-error)" : "var(--pv-royal-800)",
              cursor: "pointer",
            }}
          >
            <ThumbsDown className={`w-4 h-4 ${voteStatus === "downvote" ? "text-red-600" : ""}`} />
            <span>{liveDownvotes}</span>
          </button>

          <button
            onClick={() => setShowComments((s) => !s)}
            className="pv-btn-glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: "transparent",
              color: "var(--pv-royal-800)",
              cursor: "pointer",
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{liveComments}</span>
          </button>
        </div>

        <div style={{ color: "var(--pv-muted)", fontSize: 13 }}>by {author}</div>
      </div>

      {showComments && (
        <div style={{ marginTop: 12 }}>
          <CommentSection postId={id} />
        </div>
      )}
    </article>
  );
}
