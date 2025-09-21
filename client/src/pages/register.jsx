import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const { registerEmail } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength checker
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"];

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // Validation
    if (!name.trim()) {
      setErr("Please enter your full name");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords don't match");
      return;
    }
    if (passwordStrength < 2) {
      setErr("Please choose a stronger password");
      return;
    }

    setIsLoading(true);
    try {
      await registerEmail(name, email, password);
      nav("/");
    } catch (e) { 
      setErr(e.message || "Registration failed"); 
    } finally {
      setIsLoading(false);
    }
  }

  const benefits = [
    " Curated Learning Tracks",
    " Daily Challenges", 
    " Progress Analytics",
    " Leaderboard Rankings"
  ];

  return (
    <div className="register-container">
      <div className="register-bg-element register-bg-1" />
      <div className="register-bg-element register-bg-2" />

      <div className="register-content pv-fade-in">
        {/* Header */}
        <div className="register-header">
          <div className="register-logo">PV</div>
          <h1 className="register-title">Join PrepVerse! 🚀</h1>
          <p className="register-subtitle">
            Start your coding journey with personalized tracks and progress tracking
          </p>
        </div>

        {/* Register Card */}
        <div className="register-card pv-card">
          {/* Error Message */}
          {err && (
            <div className="register-error pv-scale-in">
              ⚠️ {err}
            </div>
          )}

          {/* Benefits Section */}
          <div className="benefits-section">
            <h3 className="benefits-title">🎯 What you'll get:</h3>
            <div className="benefits-grid">
              {benefits.map((benefit, i) => (
                <div key={i} className="benefit-item">
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={onSubmit} className="register-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="pv-field" 
                placeholder="Enter your full name"
                type="text"
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

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
                placeholder="Create a strong password"
                type="password"
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="password-strength">
                  <div className="strength-header">
                    <span 
                      className="strength-label"
                      style={{ color: strengthColors[passwordStrength - 1] || "#6b7280" }}
                    >
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Enter password"}
                    </span>
                    <span className="char-count">
                      {password.length}/8+ chars
                    </span>
                  </div>
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        background: strengthColors[passwordStrength - 1] || "#e5e7eb"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                className={`pv-field ${
                  confirmPassword && password !== confirmPassword 
                    ? 'field-error' 
                    : confirmPassword && password === confirmPassword 
                    ? 'field-success' 
                    : ''
                }`}
                placeholder="Confirm your password"
                type="password"
                required
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              
              {confirmPassword && password !== confirmPassword && (
                <div className="validation-message error">
                   Passwords don't match
                </div>
              )}
              {confirmPassword && password === confirmPassword && (
                <div className="validation-message success">
                  Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !name || !email || !password || !confirmPassword || password !== confirmPassword}
              className="pv-btn-royal register-submit-btn"
            >
              {isLoading ? "Creating Account..." : " Create Account"}
            </button>
          </form>

          {/* Terms */}
          <div className="terms-text">
            By creating an account, you agree to our{" "}
            <Link to="/terms">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="register-footer">
          <span>
            Already have an account?{" "}
            <Link to="/login">Sign in →</Link>
          </span>
        </div>
      </div>
    </div>
  );
}