import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const { loginEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setIsLoading(true);
    try {
      await loginEmail(email, password);
      nav("/");
    } catch (e) { 
      setErr(e.message || "Login failed"); 
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogle() {
    setErr("");
    setIsLoading(true);
    try { 
      await loginGoogle(); 
      nav("/"); 
    } catch (e) { 
      setErr(e.message || "Google sign-in failed"); 
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-bg-element login-bg-1" />
      <div className="login-bg-element login-bg-2" />

      <div className="login-content pv-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">PV</div>
          <h1 className="login-title">Welcome Back! 👋</h1>
          <p className="login-subtitle">Sign in to continue your coding journey</p>
        </div>

        {/* Login Card */}
        <div className="login-card pv-card">
          {/* Error Message */}
          {err && (
            <div className="login-error pv-scale-in">
              ⚠️ {err}
            </div>
          )}

          <div className="login-form-container">
            {/* Google Login */}
            <button
              className="google-btn"
              onClick={onGoogle}
              disabled={isLoading}
            >
              <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="login-divider">
              <span>or continue with email</span>
            </div>

            {/* Email Form */}
            <form onSubmit={onSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className="pv-field" 
                  placeholder="Enter your email"
                  type="email"
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  className="pv-field" 
                  placeholder="Enter your password"
                  type="password"
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="pv-btn-royal login-submit-btn"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <span>
            New to PrepVerse?{" "}
            <Link to="/register">Create an account →</Link>
          </span>
        </div>
      </div>
    </div>
  );
}