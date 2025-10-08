
import ShareExperienceForm from "./ShareExperienceForm";

const Hero = () => {
  const headerOffset = 64;

  return (
    <section
      aria-label="Hero"
      style={{
        background: "var(--pv-gradient-royal)",
        minHeight: `calc(100vh - ${headerOffset}px)`,
        display: "flex",
        alignItems: "center",
        padding: "48px 0 64px",
        position: "relative",
      }}
    >
      <div
        className="container"
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
            lineHeight: 1.02,
            fontWeight: 800,
            color: "var(--pv-card)",
            textWrap: "balance",
            textShadow: "0 6px 18px rgba(12, 16, 28, 0.08)",
          }}
        >
          Share Your{" "}
          <span
            style={{
              background: "var(--pv-gradient-glass)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Interview
          </span>{" "}
          Experience
        </h1>

        <p
          style={{
            marginTop: 8,
            maxWidth: 820,
            marginLeft: "auto",
            marginRight: "auto",
            color: "var(--pv-royal-100)",
            fontSize: "clamp(0.95rem, 1.4vw, 1.125rem)",
            lineHeight: 1.6,
          }}
        >
          Connect with professionals, share interview insights, and help others land their dream jobs.
          Build a community around career success.
        </p>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Start Sharing styled same as Browse Experiences */}
          <ShareExperienceForm
            triggerLabel="Start Sharing"
            triggerClassName="pv-btn-glass"
            triggerStyle={{
              minWidth: 180,
              height: 44,
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.06)",
            }}
          />

          <button
            className="pv-btn-glass"
            style={{
              minWidth: 180,
              height: 44,
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.06)",
            }}
          >
            Browse Experiences
          </button>
        </div>
      </div>

      {/* Decorative fade */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -18,
          height: 36,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 100%)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
};

export default Hero;
