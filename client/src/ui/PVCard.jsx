export default function PVCard({ title, subtitle, actions, children, pad = 18 }) {
    return (
      <section className="pv-card" style={{ padding: pad }}>
        {(title || actions) && (
          <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              {title && <h3 style={{ margin: 0, color: "var(--pv-ink)" }}>{title}</h3>}
              {subtitle && <div style={{ color: "var(--pv-muted)", fontSize: 13 }}>{subtitle}</div>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </section>
    );
  }
  