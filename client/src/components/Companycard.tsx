// src/components/CompanyCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Users, MessageSquare, TrendingUp } from "lucide-react";

interface CompanyCardProps {
  name: string;
  logo?: string;
  totalPosts: number;
  avgDifficulty: number;
  successRate: number;
  trending?: boolean;
  onClick?: () => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  name,
  logo,
  totalPosts,
  avgDifficulty,
  successRate,
  trending,
  onClick,
}) => {
  const navigate = useNavigate();
  const difficultyInt = Math.round(avgDifficulty || 0);

  const handleClick = () => {
    if (onClick) return onClick();
    navigate(`/company/${encodeURIComponent(name)}`);
  };

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const Stars = ({ value }: { value: number }) => (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            style={{
              width: 16,
              height: 16,
              color: filled ? "#facc15" : "#9aa6bf",
              fill: filled ? "#facc15" : "none",
              stroke: filled ? "#f59e0b" : "#9aa6bf",
              strokeWidth: 1.5,
            }}
          />
        );
      })}
    </span>
  );

  const avatar = logo ? (
    <img
      src={logo}
      alt={name}
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        objectFit: "cover",
        boxShadow: "0 4px 12px rgba(16,24,40,0.06)",
      }}
    />
  ) : (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: "linear-gradient(135deg, #7dd3fc 0%, #60a5fa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(16,24,40,0.06)",
      }}
    >
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>
        {name?.[0] ?? "C"}
      </span>
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      // use light card background with subtle gradient and shadow (matches image 2)
      style={{
        borderRadius: 14,
        cursor: "pointer",
        padding: 0,
        display: "block",
        background: "linear-gradient(180deg, #a2c4f0ff 0%, #eef6ff 100%)",
        border: "1px solid rgba(122, 163, 245, 0.04)",
        boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        willChange: "transform",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 10px 30px rgba(16,24,40,0.10)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 6px 18px rgba(16,24,40,0.06)")
      }
    >
      {/* Card content */}
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {avatar}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--pv-ink, #0f172a)",
                }}
              >
                {name}
              </h3>

              {trending && (
                <span
                  aria-hidden
                  style={{
                    background: "linear-gradient(90deg,#fff7ed,#fff1e6)",
                    color: "#b45309",
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    border: "1px solid rgba(180,83,9,0.08)",
                  }}
                >
                  <TrendingUp style={{ width: 12, height: 12, color: "#b45309" }} />
                  <span>Trending</span>
                </span>
              )}
            </div>

            <p
              style={{
                margin: "6px 0 0",
                color: "var(--pv-muted, #6b7280)",
                fontSize: 13,
              }}
            >
              {totalPosts} interview experiences
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 6,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--pv-muted, #6b7280)",
                marginBottom: 6,
              }}
            >
              Avg. Difficulty
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Stars value={difficultyInt} />
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--pv-muted, #6b7280)",
                marginBottom: 6,
              }}
            >
              Success Rate
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: successRate > 50 ? "#16a34a" : "#10b981",
              }}
            >
              {successRate}%
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: "var(--pv-muted, #6b7280)",
              fontSize: 13,
            }}
          >
            <Users style={{ width: 16, height: 16, color: "#9aa6bf" }} />
            <span>{Math.round(totalPosts * 0.7)} contributors</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: "var(--pv-muted, #6b7280)",
              fontSize: 13,
            }}
          >
            <MessageSquare style={{ width: 16, height: 16, color: "#9aa6bf" }} />
            <span>{Math.round(totalPosts * 2.5)} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
