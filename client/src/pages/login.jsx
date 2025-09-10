import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import PVCard from "../ui/PVCard";
import PVButton from "../ui/PVButton";

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
    } catch (e) { setErr(e.message || "Login failed"); }
  }
  async function onGoogle() {
    try { await loginGoogle(); nav("/"); }
    catch (e) { setErr(e.message || "Google sign-in failed"); }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <PVCard title="Welcome back" subtitle="Sign in to keep your streaks alive ">
          {err && <div style={{ color: "var(--pv-error)", marginBottom: 8 }}>{err}</div>}
          <div className="vstack" style={{ marginTop: 8 }}>
            <PVButton variant="secondary" full onClick={onGoogle}>Continue with Google</PVButton>
            <div style={{ textAlign: "center", color: "var(--pv-muted)", fontSize: 12 }}>or use email</div>
            <form onSubmit={onSubmit} className="vstack">
              <input className="pv-field" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
              <input className="pv-field" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
              <PVButton type="submit" full>Login</PVButton>
            </form>
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            New here? <Link to="/register">Create an account</Link>
          </div>
        </PVCard>
      </div>
    </div>
  );
}
