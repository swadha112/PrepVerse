export default function PVButton({
    children,
    variant = "primary",
    size = "md",
    full = false,
    onClick,
    type = "button",
    disabled = false,
    leading, // optional icon (jsx)
  }) {
    const base = {
      primary: {
        bg: "var(--pv-primary)",
        color: "#fff",
        hover: "filter: brightness(0.95);",
        border: "transparent",
      },
      secondary: {
        bg: "#fff",
        color: "var(--pv-ink)",
        hover: "background:#f3f4f6;",
        border: "var(--pv-border)",
      },
      quiet: {
        bg: "transparent",
        color: "var(--pv-academic)",
        hover: "background:#eef2ff;",
        border: "transparent",
      },
    }[variant];
  
    const pad = size === "lg" ? "14px 18px" : size === "sm" ? "8px 12px" : "12px 16px";
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: full ? "100%" : undefined,
          padding: pad,
          background: base.bg, color: base.color, border: `1px solid ${base.border}`,
          borderRadius: 12, boxShadow: "0 1px 0 rgba(0,0,0,.03)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all .18s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.cssText += base.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.cssText = e.currentTarget.style.cssText.replace(base.hover, ""))}
      >
        {leading ? <span style={{ display: "inline-flex" }}>{leading}</span> : null}
        <span style={{ fontWeight: 600, fontSize: size === "sm" ? 13 : 14 }}>{children}</span>
      </button>
    );
  }
  