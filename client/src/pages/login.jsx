import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { loginEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await loginEmail(email, password);
      nav("/");
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  async function onGoogle() {
    try {
      await loginGoogle();
      nav("/");
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2>Login</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
        <button type="button" onClick={onGoogle}>Sign in with Google</button>
      </form>
      <p style={{ marginTop: 8 }}>
        New here? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
