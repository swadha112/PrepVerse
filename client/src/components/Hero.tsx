import React, { useEffect, useState } from "react";
import ShareExperienceForm from "./ShareExperienceForm";

const Hero = () => {
  const headerOffset = 64;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // 🪄 fade + slide-up animation style generator
  const fadeStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.98)",
    transition: `opacity 0.9s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms,
                 transform 0.9s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms`,
  });

  // 🧭 Scroll smoothly to the section below Hero
  const handleBrowseClick = () => {
    const section = document.querySelector("#forum-feed");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          width: "100%",
        }}
      >
        {/* 🟦 Title */}
        <h1
          style={{
            ...fadeStyle(0),
            margin: 0,
            fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
            lineHeight: 1.02,
            fontWeight: 800,
            color: "var(--pv-card)",
            textWrap: "balance",
            textShadow: "0 6px 18px rgba(12, 16, 28, 0.08)",
            transformOrigin: "center",
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

        {/* 🟪 Subtitle */}
        <p
          style={{
            ...fadeStyle(200),
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

        {/* 🟩 Buttons */}
        <div
          style={{
            ...fadeStyle(400),
            marginTop: 22,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
         
          <ShareExperienceForm
            triggerLabel="Start Sharing"
            triggerClassName="pv-btn-glass"
            triggerStyle={{
              minWidth: 180,
              height: 44,
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.06)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
          />


          <button
            className="pv-btn-glass"
            onClick={handleBrowseClick}
            style={{
              minWidth: 180,
              height: 44,
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.06)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(16, 24, 64, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(30, 58, 138, 0.06)";
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
