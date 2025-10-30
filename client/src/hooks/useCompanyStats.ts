// src/hooks/useCompanyStats.ts
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { Experience as Post } from "../types";

export default function useCompanyStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<
    {
      name: string;
      logo?: string;
      totalPosts: number;
      avgDifficulty: number;
      successRate: number;
      trending?: boolean;
    }[]
  >([]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "experiences"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Post[];

        const byCompany = new Map<string, Post[]>();
        rows.forEach((r) => {
          if (!r.company) return;
          if (!byCompany.has(r.company)) byCompany.set(r.company, []);
          byCompany.get(r.company)!.push(r);
        });

        const list = Array.from(byCompany.entries()).map(([name, posts]) => {
          const totalPosts = posts.length;

          const avgDifficulty = totalPosts
            ? Math.round((posts.reduce((s, p) => s + (Number(p.difficulty || 0) || 0), 0) / totalPosts) * 10) / 10
            : 0;

          const success =
            posts.filter((p) => (p.outcome || "").toLowerCase().includes("select") || (p.outcome || "").toLowerCase().includes("offer"))
              .length;
          const successRate = totalPosts ? Math.round((success / totalPosts) * 100) : 0;

          const trending = posts.slice(0, Math.min(posts.length, 10)).length >= 5;

          return { name, totalPosts, avgDifficulty, successRate, trending };
        });

        list.sort((a, b) => b.totalPosts - a.totalPosts);

        setStats(list);
        setLoading(false);
      },
      (err) => {
        console.error("company stats error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { stats, loading } as const;
}
