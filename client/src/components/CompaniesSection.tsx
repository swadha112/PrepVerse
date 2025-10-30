import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CompanyCard from "./CompanyCard";
import useCompanyStats from "../hooks/useCompanyStats";

const CompaniesSection = () => {
  const { stats, loading } = useCompanyStats();
  const navigate = useNavigate();

  return (
    <section
      style={{
        padding: "72px 0",
        background: "var(--pv-gradient-royal)",
      }}
    >
      <div className="container">
        {/* --- Header --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "var(--pv-card)",
              }}
            >
              Popular Companies
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                color: "var(--pv-royal-100)",
              }}
            >
              Explore interview experiences by company
            </p>
          </div>

          {/* --- Button replaced with native element --- */}
          <button
            onClick={() => navigate("/companies")}
            style={{
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "all 0.2s ease-in-out",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
          >
            View All Companies
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div
            className="pv-card"
            style={{
              padding: 18,
              borderRadius: 14,
              color: "var(--pv-card)",
            }}
          >
            Loading…
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 18,
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {stats.map((s) => (
              <CompanyCard
                key={s.name}
                {...s}
                onClick={() =>
                  navigate(`/company/${encodeURIComponent(s.name)}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompaniesSection;
