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
