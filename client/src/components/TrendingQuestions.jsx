import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function TrendingQuestions({ limit = 8 }) {
  const [state, setState] = useState({ loading: true, error: null, items: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/public/leetcode/trending?limit=${limit}`);
        const j = await r.json();
        if (!alive) return;
        if (!r.ok || !j.ok) throw new Error(j.error || r.statusText);
        setState({ loading: false, error: null, items: j.items || [] });
      } catch (e) {
        setState({ loading: false, error: e.message, items: [] });
      }
    })();
    return () => { alive = false; };
  }, [limit]);

  if (state.loading) {
    return (
      <div className="pv-card" style={{ padding: 24 }}>
        <h3 className="card-title">Trending Questions</h3>
        <div className="shimmer line w-40 m8"></div>
        <div className="shimmer line w-32 m8"></div>
        <div className="shimmer line w-24 m8"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="pv-card" style={{ padding: 24 }}>
        <h3 className="card-title">Trending Questions</h3>
        <p style={{ color: 'var(--pv-muted)' }}>Couldn’t load: {state.error}</p>
      </div>
    );
  }

  return (
    <div className="pv-card" style={{ padding: 24 }}>
      <div className="card-header">
        <h3 className="card-title">Trending Questions</h3>
        <span className="lc-pill">Global · likes</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
        {state.items.map((q) => (
          <a key={q.slug} href={q.url} target="_blank" rel="noreferrer"
             className="unit-item unlocked" style={{ padding: 14, textDecoration:'none' }}>
            <div className="unit-content">
              <h4 className="unit-title" style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  width:26, height:26, borderRadius:8, fontSize:12, fontWeight:700,
                  background:'var(--pv-royal-100)', color:'var(--pv-royal-800)'
                }}>
                  {q.qid}
                </span>
                {q.title}
              </h4>
              <p className="unit-desc" style={{ margin:0, display:'flex', gap:10, alignItems:'center' }}>
                <span className={`duo-difficulty duo-diff-${(q.difficulty || '').toLowerCase()}`}>
                  {q.difficulty}
                </span>
                <span>👍 {q.likes}</span>
                {Number.isFinite(Number(q.acRate)) && (
                  <span>AC {Math.round(Number(q.acRate))}%</span>
                )}
                {q.tags?.slice(0,2).map(t => (
                  <span key={t.slug} className="tag">{t.name}</span>
                ))}
              </p>
            </div>
            <button className="pv-btn-ghost">Solve →</button>
          </a>
        ))}
      </div>
    </div>
  );
}