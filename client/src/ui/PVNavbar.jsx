import { NavLink } from "react-router-dom";
import PVBadge from "./PVBadge";

// eslint-disable-next-line no-unused-vars
export default function PVNavbar({ user, onLogout, onProfile }) {
  return (
    <>
      {/* Add this CSS to your index.css file */}
      <style jsx>{`
        .pv-nav-item {
          text-decoration: none;
          transition: var(--pv-transition);
          border-radius: 12px;
          padding: 4px;
        }
        
        .pv-nav-item:hover {
          transform: translateY(-2px);
        }
        
        .pv-nav-item.active {
          background: rgba(30, 58, 138, 0.1);
          transform: translateY(-1px);
        }
        
        .pv-nav-logo {
          background: var(--pv-gradient-royal-light);
          box-shadow: var(--pv-shadow-royal);
          transition: var(--pv-transition);
        }
        
        .pv-nav-logo:hover {
          transform: scale(1.05);
          box-shadow: var(--pv-shadow-royal-lg);
        }
        
        .pv-nav-button {
          transition: var(--pv-transition);
          font-weight: 600;
          font-size: 14px;
        }
        
        .pv-nav-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--pv-shadow-md);
        }
        
        .pv-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--pv-gradient-royal-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid rgba(255,255,255,0.3);
        }
      `}</style>
      
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--pv-glass-bg)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--pv-glass-border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
        }}
      >
        <div
          className="container hstack"
          style={{ 
            justifyContent: "space-between", 
            paddingTop: 16, 
            paddingBottom: 16,
            maxWidth: "1400px"
          }}
        >
          {/* Logo Section */}
          <div className="hstack" style={{ gap: 20 }}>
            <div className="hstack" style={{ gap: 12 }}>
            <NavLink to="/">
              <div
                className="pv-nav-logo"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                PV
              </div>
              </NavLink>
              <div>
                <div style={{ 
                  fontWeight: 800, 
                  color: "var(--pv-royal-800)",
                  fontSize: "18px",
                  letterSpacing: "-0.5px"
                }}>
                  PrepVerse
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: "var(--pv-royal-600)",
                  fontWeight: 500,
                  letterSpacing: "0.5px"
                }}>
                  practice • progress • placement
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hstack" style={{ gap: 8, marginLeft: 20 }}>
              <NavLink
                to="/tracks"
                className={({ isActive }) =>
                  isActive ? "pv-nav-item active" : "pv-nav-item"
                }
              >
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--pv-royal-50)",
                  border: "1px solid var(--pv-royal-200)",
                  color: "var(--pv-royal-800)",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "var(--pv-transition)"
                }}>
                   Tracks
                </div>
              </NavLink>
              <NavLink
                to="/resume"
                className={({ isActive }) =>
                  isActive ? "pv-nav-item active" : "pv-nav-item"
                }
              >
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--pv-royal-50)",
                  border: "1px solid var(--pv-royal-200)",
                  color: "var(--pv-royal-800)",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "var(--pv-transition)"
                }}>
                   Resume
                </div>
              </NavLink>
              <NavLink
                to="/interview"
                className={({ isActive }) =>
                  isActive ? "pv-nav-item active" : "pv-nav-item"
                }
              >
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--pv-royal-50)",
                  border: "1px solid var(--pv-royal-200)",
                  color: "var(--pv-royal-800)",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "var(--pv-transition)"
                }}>
                   Interview
                </div>
              </NavLink>
              <NavLink
                to="/forum"
                className={({ isActive }) =>
                  isActive ? "pv-nav-item active" : "pv-nav-item"
                }
              >
                <div style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--pv-royal-50)",
                  border: "1px solid var(--pv-royal-200)",
                  color: "var(--pv-royal-800)",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "var(--pv-transition)"
                }}>
                   Forum
                </div>
              </NavLink>
            </nav>
          </div>

          {/* User Section */}
          <div className="hstack" style={{ gap: 16 }}>
            {user && (
              <>
                {/* User Info */}
                <div className="hstack" style={{ gap: 12 }}>
                  <div className="pv-user-avatar">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600,
                      color: "var(--pv-royal-800)" 
                    }}>
                      {user.displayName?.split(' ')[0] || "User"}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: "var(--pv-royal-600)" 
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="hstack" style={{ gap: 8 }}>
                 
                  <button
                    onClick={onLogout}
                    className="pv-nav-button"
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "var(--pv-gradient-royal-light)",
                      border: "none",
                      cursor: "pointer",
                      color: "white",
                      boxShadow: "var(--pv-shadow-royal)"
                    }}
                  >
                     Logout
                  </button>
                </div>
              </>
            )}
            
            {/* Guest State - when no user is logged in */}
            {!user && (
              <div className="hstack" style={{ gap: 8 }}>
                <button
                  className="pv-nav-button"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: "var(--pv-glass-bg)",
                    border: "1px solid var(--pv-royal-200)",
                    cursor: "pointer",
                    color: "var(--pv-royal-700)",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  Login
                </button>
                <button
                  className="pv-nav-button"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: "var(--pv-gradient-royal-light)",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    boxShadow: "var(--pv-shadow-royal)"
                  }}
                >
                  
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}