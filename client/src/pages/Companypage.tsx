// src/pages/CompanyPage.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCompanyPosts from "../hooks/useCompanyPosts";
import CompanySummaryGenerator from "../components/CompanySummaryGenerator";
import InterviewPost from "../components/InterviewPost";
import CompanyCard from "../components/CompanyCard";

const CompanyPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const decoded = name ? decodeURIComponent(name) : "";
  const { posts, loading, error } = useCompanyPosts(decoded);
  const navigate = useNavigate();

  const totalPosts = posts.length;
  const avgDifficulty = totalPosts
    ? Math.round(
        (posts.reduce(
          (acc, p) => acc + (Number(p.difficulty) || 0),
          0
        ) /
          totalPosts) *
          10
      ) / 10
    : 0;
  const successRate = Math.round(
    (posts.filter(
      (p) =>
        (p.outcome || "").toLowerCase().includes("select") ||
        (p.outcome || "").toLowerCase().includes("offer")
    ).length /
      Math.max(1, totalPosts)) *
      100
  );

  return (
    <main
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginTop: 28,
      }}
    >
      <div style={{ width: "95vw", maxWidth: 1000 }}>
        <div style={{ marginBottom: 18 }}>
          {/* Back button with same style as Download button */}
          <button
            onClick={() => navigate(-1)}
            className="pv-btn-royal"
            style={{ marginBottom: 12, minWidth: 120 }}
          >
            ← Back
          </button>

          <CompanyCard
            name={decoded || "Company"}
            logo={posts[0]?.companyLogo}
            totalPosts={totalPosts}
            avgDifficulty={avgDifficulty}
            successRate={isNaN(successRate) ? 0 : successRate}
            trending={false}
            onClick={() => {}}
          />
        </div>

        <CompanySummaryGenerator company={decoded} posts={posts} />

        <section>
          {/* Interview experiences heading in black */}
          <h3 style={{ marginTop: 10, color: "#fff" }}>
  Interview experiences ({posts.length})
</h3>


          {loading && (
            <div
              className="pv-card"
              style={{ padding: 12, borderRadius: 10 }}
            >
              Loading posts…
            </div>
          )}
          {error && (
            <div style={{ color: "var(--pv-error)" }}>{error}</div>
          )}

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {posts.map((p) => (
              <InterviewPost key={p.id} {...p} />
            ))}

            {!loading && posts.length === 0 && (
              <div
                className="pv-card"
                style={{ padding: 12, borderRadius: 10 }}
              >
                No interview experiences found for this company yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default CompanyPage;
