import { useEffect, useMemo, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || ""; // or use Vite proxy

export default function LeetCodeWidget({ username = "Swadha_K" }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const url = useMemo(
    () => `${API_BASE}/api/public/leetcode/profile?username=${encodeURIComponent(username)}`,
    [username]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(url, { headers: { accept: "application/json" } })
      .then(async r => {
        const text = await r.text();
        if (!r.ok) throw new Error(text || r.statusText);
        return JSON.parse(text);
      })
      .then(d => { if (alive) { setData(d); setErr(""); } })
      .catch(e => { if (alive) setErr(e.message || "Failed"); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url]);

  const QList = ({ title, items }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="lc-qblock pv-appear">
        <button className="lc-qhdr" onClick={()=>setOpen(o=>!o)}>
          <span>{title}</span>
          <span className={`chev ${open ? 'open' : ''}`}>▾</span>
        </button>
        {open && (
          <ul className="lc-qul">
            {items?.slice(0, 200).map(q => (
              <li key={q.slug} className="lc-qli">
                <a href={`https://leetcode.com/problems/${q.slug}/`} target="_blank" rel="noreferrer">
                  {q.title}
                </a>
                <span className={`tag ${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
              </li>
            ))}
            {(!items || items.length === 0) && <li className="lc-qli muted">None yet</li>}
          </ul>
        )}
      </div>
    );
  };

  const Stat = ({ label, value }) => (
    <div className="lc-stat pv-appear">
      <div className="lc-stat-label">{label}</div>
      <div className="lc-stat-value">{value ?? "—"}</div>
    </div>
  );

  return (
    <div className="pv-card lc-card pv-fade-up">
      <div className="lc-head">
        <h3 className="card-title">LeetCode</h3>
        {!loading && !err && data?.fetchedAt && (
          <span className="lc-pill">Last synced {new Date(data.fetchedAt).toLocaleString()}</span>
        )}
      </div>

      {loading ? (
        <>
          <div className="lc-row">
            <div className="lc-avatar shimmer" />
            <div className="lc-col">
              <div className="shimmer line w-40" />
              <div className="shimmer line w-24 m8" />
            </div>
            <div className="shimmer chip w-32" />
          </div>
          <div className="lc-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="lc-stat">
                <div className="shimmer line w-20" />
                <div className="shimmer line w-16 m8" />
              </div>
            ))}
          </div>
        </>
      ) : err ? (
        <div className="lc-error">Error: {err}</div>
      ) : !data?.ok ? (
        <div className="lc-error">No data</div>
      ) : (
        <>
          <div className="lc-row">
            <img className="lc-avatar" alt="" src={data.profile?.userAvatar || ""} />
            <div className="lc-col">
              <div className="lc-name">{data.username}</div>
              <div className="lc-sub">Ranking: {data.profile?.ranking ?? "—"}</div>
            </div>
            <span className="lc-status">
              <span className="dot" /> Connected
            </span>
          </div>

          <div className="lc-grid">
            <Stat label="Total"  value={data.solved?.total} />
            <Stat label="Easy"   value={data.solved?.easy} />
            <Stat label="Medium" value={data.solved?.medium} />
            <Stat label="Hard"   value={data.solved?.hard} />
          </div>

          <QList title={`Easy (${data.questions?.easy?.length || 0})`}   items={data.questions?.easy} />
          <QList title={`Medium (${data.questions?.medium?.length || 0})`} items={data.questions?.medium} />
          <QList title={`Hard (${data.questions?.hard?.length || 0})`}   items={data.questions?.hard} />
        </>
      )}
    </div>
  );
}
