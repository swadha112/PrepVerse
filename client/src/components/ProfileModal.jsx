import { useEffect, useState } from "react";
import PVCard from "../ui/PVCard";
import PVButton from "../ui/PVButton";
import { api } from "../api/axios";

export default function ProfileModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErr("");
    api.get("/leetcode/profile")
      .then(({ data }) => {
        setConnected(true);
        setUsername(data.username || "");
        setAvatar(data.avatar || "");
        setLastSynced(data.lastSyncedAt || null);
      })
      .catch(e => {
        setErr(e?.response?.data?.error || "Not connected");
        setConnected(false);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleDisconnect = async () => {
    setSaving(true);
    setErr("");
    try {
      await api.delete("/leetcode/connect");
      setConnected(false);
      setUsername("");
      setAvatar("");
      setLastSynced(null);
    } catch (e) {
      setErr(e?.response?.data?.error || "Disconnect failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSaving(true);
    setErr("");
    try {
      await api.post("/leetcode/syncNow");
      setLastSynced(new Date().toISOString());
    } catch (e) {
      setErr(e?.response?.data?.error || "Sync failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ width: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <PVCard title="LeetCode Profile" subtitle="Sync your LeetCode progress">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {err && <div style={{ color: "var(--pv-error)" }}>{err}</div>}

              {connected ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={avatar}
                      alt="avatar"
                      style={{ width: 48, height: 48, borderRadius: "50%" }}
                    />
                    <span style={{ fontSize: "1.25rem", fontWeight: 500 }}>
                      {username}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--pv-muted)" }}>
                    Last synced: {lastSynced ? new Date(lastSynced).toLocaleString() : 'Never'}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <PVButton
                      variant="secondary"
                      onClick={handleDisconnect}
                      disabled={!connected || saving}
                    >
                      Disconnect
                    </PVButton>
                    <PVButton
                      onClick={handleSyncNow}
                      disabled={!connected || saving}
                    >
                      Sync Now
                    </PVButton>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "0.875rem", color: "var(--pv-muted)" }}>
                  Your LeetCode account isn’t connected yet. Open the extension popup
                  and visit LeetCode to connect automatically.
                </div>
              )}
            </div>
          )}
        </PVCard>
      </div>
    </div>
  );
}
