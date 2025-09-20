import { NavLink } from "react-router-dom";
import PVBadge from "./PVBadge";

export default function PVNavbar({ user, onLogout, onProfile }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,255,255,.75)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--pv-border)",
      }}
    >
      <div
        className="container hstack"
        style={{ justifyContent: "space-between", paddingTop: 12, paddingBottom: 12 }}
      >
        <div className="hstack" style={{ gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--pv-primary)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            PV
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--pv-ink)" }}>PrepVerse</div>
            <div style={{ fontSize: 12, color: "var(--pv-muted)" }}>
              practice ● progress ● placement
            </div>
          </div>

          <NavLink
            to="/tracks"
            className={({ isActive }) =>
              isActive ? "pv-nav-item active" : "pv-nav-item"
            }
          >
            <PVBadge tone="topic">Tracks</PVBadge>
          </NavLink>
          <NavLink
            to="/daily"
            className={({ isActive }) =>
              isActive ? "pv-nav-item active" : "pv-nav-item"
            }
          >
            <PVBadge tone="topic">Daily</PVBadge>
          </NavLink>
          <NavLink
            to="/interview"
            className={({ isActive }) =>
              isActive ? "pv-nav-item active" : "pv-nav-item"
            }
          >
            <PVBadge tone="topic">Interview</PVBadge>
          </NavLink>
        </div>

        <div className="hstack" style={{ gap: 12 }}>
          {user && (
            <div style={{ fontSize: 13, color: "var(--pv-muted)" }}>
              {user.displayName || user.email}
            </div>
          )}
          {user && (
            <>
              <button
                onClick={onProfile}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid var(--pv-border)",
                  cursor: "pointer",
                }}
              >
                LeetCode Profile
              </button>
              <button
                onClick={onLogout}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid var(--pv-border)",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
