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
              color: filled ? "#facc15" : "#d1d5db",
              fill: filled ? "#facc15" : "none",
              stroke: filled ? "#fbbf24" : "#d1d5db",
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
      style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }}
    />
  ) : (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: "linear-gradient(135deg, #22c55e 0%, #4f46e5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
      className="pv-card hover:shadow-hover transition-smooth"
      style={{
        borderRadius: 14,
        cursor: "pointer",
        border: "1px solid var(--pv-border)",
        padding: 0,
        background: "var(--pv-surface)",
        display: "block",
      }}
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
                  color: "var(--pv-ink)",
                }}
              >
                {name}
              </h3>

              {trending && (
                <span
                  aria-hidden
                  style={{
                    background: "linear-gradient(90deg,#eef2ff,#ede9fe)",
                    color: "var(--pv-royal-600)",
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <TrendingUp style={{ width: 12, height: 12 }} />
                  <span>Trending</span>
                </span>
              )}
            </div>

            <p
              style={{
                margin: "6px 0 0",
                color: "var(--pv-muted)",
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
                color: "var(--pv-muted)",
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
                color: "var(--pv-muted)",
                marginBottom: 6,
              }}
            >
              Success Rate
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--pv-success)",
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
            borderTop: "1px solid var(--pv-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: "var(--pv-muted)",
              fontSize: 13,
            }}
          >
            <Users style={{ width: 16, height: 16 }} />
            <span>{Math.round(totalPosts * 0.7)} contributors</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: "var(--pv-muted)",
              fontSize: 13,
            }}
          >
            <MessageSquare style={{ width: 16, height: 16 }} />
            <span>{Math.round(totalPosts * 2.5)} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
