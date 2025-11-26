import React, { useState } from "react";
import { callOpenAI } from "../lib/openai";
import type { Post } from "../types";

function compressPost(p: Post) {
  const contentSnippet = (p.content || "").replace(/\s+/g, " ").slice(0, 220);
  const tip = (p.preparationTip || "").replace(/\s+/g, " ").slice(0, 160);
  const difficulty =
    typeof p.difficulty === "string" ? p.difficulty : p.difficulty ?? "";
  const outcome = p.outcome ?? "";
  const date = (() => {
    try {
      if (!p.interviewDate && !p.date && !p.createdAt) return "";
      const raw = p.interviewDate ?? p.date ?? p.createdAt;
      const d =
        raw?.toDate?.() ??
        (raw?.seconds ? new Date(raw.seconds * 1000) : new Date(raw));
      return isNaN(d?.getTime?.()) ? "" : d.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  })();
  return `ID:${p.id} | role:${p.role || ""} | date:${date} | difficulty:${difficulty} | outcome:${outcome} | tip:${tip} | snippet:${contentSnippet}`;
}

function batch<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ---------------------------------------------------------
   Clean and format summary
   - Remove "<Company> Interview Summary"
   - Turn markdown headings (#, ##, ###) into @@Heading@@ markers
   - Strip all **bold** markers everywhere
--------------------------------------------------------- */
function formatSummary(text: string) {
  // Remove lines like "Amazon Interview Summary", "Flipkart Interview Summary", etc.
  let cleaned = text
    .split("\n")
    .filter(
      (line) =>
        !/^[A-Za-z0-9 .,&()/-]+ Interview Summary\s*$/i.test(line.trim())
    )
    .join("\n");

  // Convert markdown headings to special markers
  cleaned = cleaned
    .replace(/^# (.*)$/gm, (_, h) => `@@${h}@@`)
    .replace(/^## (.*)$/gm, (_, h) => `@@${h}@@`)
    .replace(/^### (.*)$/gm, (_, h) => `@@${h}@@`);

  // Remove all remaining ** markers
  cleaned = cleaned.replace(/\*\*/g, "");

  return cleaned.trim();
}

/* ---------------------------------------------------------
   Render summary
   - Lines like @@Overview@@ → bold section heading
   - Everything else normal text (no bold)
--------------------------------------------------------- */
const renderSummary = (raw: string) => {
  return raw.split("\n").map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} style={{ height: 10 }} />;
    }

    const headingMatch = trimmed.match(/^@@(.+)@@$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      return (
        <p
          key={idx}
          style={{
            margin: "14px 0 6px",
            fontWeight: "bold",
            fontSize: "18px",
            color: "#000",
          }}
        >
          {heading}
        </p>
      );
    }

    return (
      <p key={idx} style={{ margin: "6px 0", color: "#000", lineHeight: 1.6 }}>
        {trimmed}
      </p>
    );
  });
};

export default function CompanySummaryGenerator({
  company,
  posts,
}: {
  company: string;
  posts: Post[];
}) {
  // 🔹 updated env variable name here
  const envKey = (import.meta as any).env?.VITE_OPENAI_API_KEY1 ?? "";
  const [apiKey, setApiKey] = useState<string>(
    () => envKey || sessionStorage.getItem("OPENAI_KEY") || ""
  );
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );

  const setAndStoreKey = (k: string) => {
    setApiKey(k);
    if (!envKey) {
      if (k) sessionStorage.setItem("OPENAI_KEY", k);
      else sessionStorage.removeItem("OPENAI_KEY");
    }
  };

  const generate = async () => {
    setError(null);
    setSummary("");
    const keyToUse = envKey || apiKey;

    if (!keyToUse) {
      setError(
        "OpenAI API key required. Add VITE_OPENAI_API_KEY1 to your .env or paste a key into the input."
      );
      return;
    }

    if (!posts || posts.length === 0) {
      setError("No posts for this company to summarize.");
      return;
    }

    setLoading(true);
    try {
      const compressed = posts.map((p) => compressPost(p));
      const batches = batch(compressed, 12);
      setProgress({ current: 0, total: batches.length });

      const chunkSummaries: string[] = [];
      for (let i = 0; i < batches.length; i++) {
        setProgress({ current: i + 1, total: batches.length });

        const systemMsg = {
          role: "system" as const,
          content:
            "You are a concise assistant. From short interview-experience lines produce a compact summary focusing on: overview, top roles, difficulty, success observations, and preparation tips. Use clear section headings.",
        };
        const userMsg = {
          role: "user" as const,
          content: `Company: ${company}\nBatch items:\n${batches[i].join("\n")}`,
        };

        const chunk = await callOpenAI(keyToUse, [systemMsg, userMsg]);
        chunkSummaries.push(chunk);
        await new Promise((r) => setTimeout(r, 220));
      }

      const mergeSystem = {
        role: "system" as const,
        content:
          "Merge these batch summaries into a single, clean, human-friendly summary with sections: Overview, Top Roles, Difficulty Distribution, Success Summary, Common Preparation Tips, and Recommendations.",
      };
      const mergeUser = {
        role: "user" as const,
        content: `Merge summaries for company ${company}:\n\n${chunkSummaries.join(
          "\n\n---\n\n"
        )}`,
      };

      const final = await callOpenAI(keyToUse, [mergeSystem, mergeUser]);
      // store the formatted version
      setSummary(formatSummary(final));
    } catch (err: any) {
      console.error("CompanySummaryGenerator error:", err);
      if (
        err?.message?.includes("Invalid API key") ||
        err?.toString?.().includes("invalid_api_key")
      ) {
        setError(
          "OpenAI rejected the key. Please check your API key (or update VITE_OPENAI_API_KEY1 in .env)."
        );
      } else {
        setError(err?.message ?? "Unknown error");
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div
      className="pv-card"
      style={{
        padding: 18,
        borderRadius: 12,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{company} — Sectioned Summary</h3>
          <p style={{ margin: "6px 0 0", color: "var(--pv-muted)" }}>
            {posts.length} posts
          </p>
        </div>

        {!summary && !loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!envKey && (
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setAndStoreKey(e.target.value)}
                placeholder="OpenAI key (client-only)"
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid var(--pv-border)",
                }}
              />
            )}

            <button
              onClick={generate}
              className="pv-btn-royal"
              disabled={!envKey && !apiKey}
              title={
                envKey
                  ? "Using OPENAI key from .env"
                  : "Provide API key or set VITE_OPENAI_API_KEY1"
              }
              style={{ minWidth: 160 }}
            >
              Generate Summary
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ marginTop: 12, color: "var(--pv-muted)" }}>
          <strong>Generating summary...</strong>
        </div>
      )}

      {progress && (
        <div style={{ marginTop: 8, color: "var(--pv-muted)" }}>
          Processing batch {progress.current}/{progress.total}…
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, color: "var(--pv-error)" }}>{error}</div>
      )}

      {summary && !loading && (
        <div style={{ marginTop: 12 }}>
          <div style={{ whiteSpace: "pre-wrap" }}>{renderSummary(summary)}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              onClick={() => navigator.clipboard?.writeText(summary)}
              className="pv-btn-royal"
              style={{ minWidth: 120 }}
            >
              Copy
            </button>

            <button
              onClick={() => {
                const blob = new Blob([summary], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${company}-summary.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="pv-btn-royal"
              style={{ minWidth: 120 }}
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
