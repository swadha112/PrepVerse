import { useEffect, useState } from "react";
import PVCard from "../ui/PVCard";
import PVButton from "../ui/PVButton";
import { api } from "../api/axios";

export default function ProfileModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lcUsername, setLcUsername] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [sessionCookie, setSessionCookie] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true); setErr("");
      try {
        const r = await api.get("/leetcode/connector");
        setConnected(!!r.data.connected);
        setLcUsername(r.data.lc_username || "");
        setLastSynced(r.data.last_synced_at || null);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load connector");
      } finally { setLoading(false); }
    })();
  }, [open]);

  async function save() {
    setSaving(true); setErr("");
    try {
      const body = { lc_username: lcUsername };
      if (sessionCookie && csrfToken) { body.sessionCookie = sessionCookie; body.csrfToken = csrfToken; }
      const r = await api.post("/leetcode/connector", body);
      setConnected(!!r.data.connected);
      setLastSynced(r.data.last_synced_at || null);
      setSessionCookie(""); setCsrfToken("");
    } catch (e) {
      setErr(e?.response?.data?.error || "Save failed");
    } finally { setSaving(false); }
  }

  async function disconnect() {
    setSaving(true); setErr("");
    try { await api.delete("/leetcode/connector"); setConnected(false); setLcUsername(""); setLastSynced(null); }
    catch (e) { setErr(e?.response?.data?.error || "Failed to disconnect"); }
    finally { setSaving(false); }
  }

  async function syncNow() {
    setSaving(true); setErr("");
    try {
      const r = await api.post("/leetcode/syncNow");
      alert(`Synced ${r.data.synced} submission(s)`);
      const s = await api.get("/leetcode/connector");
      setLastSynced(s.data.last_synced_at || null);
    } catch (e) {
      setErr(e?.response?.data?.error || "Sync failed");
    } finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.2)", display:"grid", placeItems:"center", zIndex:1000
    }} onClick={onClose}>
      <div className="pv-card" style={{ width: 560, padding: 18 }} onClick={(e)=>e.stopPropagation()}>
        <PVCard title="Profile & Connections" subtitle="Connect your LeetCode account for progress sync">
          {loading ? <div>Loading...</div> : (
            <div className="vstack" style={{ gap: 12 }}>
              {err && <div style={{ color:"var(--pv-error)" }}>{err}</div>}
              <div>
                <label style={{ fontSize:12, color:"var(--pv-muted)" }}>LeetCode Username</label>
                <input className="pv-field" value={lcUsername} onChange={(e)=>setLcUsername(e.target.value)} placeholder="e.g., swadha_k" />
              </div>

              <div style={{ fontSize:12, color:"var(--pv-muted)" }}>
                Optionally add your current <strong>LEETCODE_SESSION</strong> and <strong>csrftoken</strong> for automatic nightly sync.
                We encrypt them, and you can remove them anytime.
              </div>
              <div className="grid-2">
                <input className="pv-field" placeholder="LEETCODE_SESSION" value={sessionCookie} onChange={(e)=>setSessionCookie(e.target.value)} />
                <input className="pv-field" placeholder="csrftoken" value={csrfToken} onChange={(e)=>setCsrfToken(e.target.value)} />
              </div>

              <div className="hstack" style={{ justifyContent:"space-between" }}>
                <div style={{ fontSize:12, color:"var(--pv-muted)" }}>
                  Status: {connected ? "Connected" : "Not connected"}{lastSynced ? ` • Last synced: ${new Date(lastSynced._seconds ? lastSynced._seconds*1000 : Date.parse(lastSynced)).toLocaleString()}` : ""}
                </div>
                <div className="hstack">
                  <PVButton variant="secondary" onClick={disconnect} disabled={!connected || saving}>Disconnect</PVButton>
                  <PVButton variant="secondary" onClick={syncNow} disabled={!connected || saving}>Sync now</PVButton>
                  <PVButton onClick={save} disabled={saving}>Save</PVButton>
                </div>
              </div>
            </div>
          )}
        </PVCard>
      </div>
    </div>
  );
}
