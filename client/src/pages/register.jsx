import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import PVCard from "../ui/PVCard";
import PVButton from "../ui/PVButton";

export default function Register() {
  const { registerEmail } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await registerEmail(name, email, password);
      nav("/");
    } catch (e) { setErr(e.message || "Register failed"); }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <PVCard title="Create your PrepVerse account" subtitle="Track progress, build streaks, crush interviews.">
          {err && <div style={{ color: "var(--pv-error)", marginBottom: 8 }}>{err}</div>}
          <form onSubmit={onSubmit} className="vstack" style={{ marginTop: 8 }}>
            <input className="pv-field" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
            <input className="pv-field" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <input className="pv-field" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <PVButton type="submit" full>Sign up</PVButton>
          </form>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Have an account? <Link to="/login">Login</Link>
          </div>
        </PVCard>
      </div>
    </div>
  );
}
