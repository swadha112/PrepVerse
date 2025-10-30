import React, { useEffect, useState } from "react";
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

export default function CompanySummaryGenerator({
  company,
  posts,
}: {
  company: string;
  posts: Post[];
}) {
  const envKey = (import.meta as any).env?.VITE_OPENAI_API_KEY ?? "";
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
        "OpenAI API key required. Add VITE_OPENAI_API_KEY to your .env or paste a key into the input."
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
            "You are a concise assistant. From short interview-experience lines produce a compact JSON-like summary focusing on: overview, top_roles, difficulty_summary, success_observation, prep_tips. Output short paragraphs or JSON.",
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
          "Merge multiple JSON-like batch summaries into a single, human-friendly, sectioned summary. Output: Overview, Top roles, Difficulty distribution, Success summary, Common Preparation Tips, Notable quotes (if any), Recommendations.",
      };
      const mergeUser = {
        role: "user" as const,
        content: `Merge summaries for company ${company}:\n\n${chunkSummaries.join(
          "\n\n---\n\n"
        )}`,
      };

      const final = await callOpenAI(keyToUse, [mergeSystem, mergeUser]);
      setSummary(final);
    } catch (err: any) {
      console.error("CompanySummaryGenerator error:", err);
      if (
        err?.message?.includes("Invalid API key") ||
        err?.toString?.().includes("invalid_api_key")
      ) {
        setError(
          "OpenAI rejected the key. Please check your API key (or update VITE_OPENAI_API_KEY in .env)."
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
                  : "Provide API key or set VITE_OPENAI_API_KEY"
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
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {summary}
          </div>

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
