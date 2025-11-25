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
      contributors: number;
      comments: number;
      trending?: boolean;
    }[]
  >([]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "experiences"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Post[];

        const byCompany = new Map<
          string,
          {
            posts: Post[];
            contributorsSet: Set<string>;
            totalComments: number;
          }
        >();

        rows.forEach((r) => {
          if (!r.company) return;

          const company = r.company.trim();
          if (!byCompany.has(company)) {
            byCompany.set(company, {
              posts: [],
              contributorsSet: new Set(),
              totalComments: 0,
            });
          }

          const entry = byCompany.get(company)!;

          entry.posts.push(r);

          // Track contributors
          const authorId = (r.authorId || r.author || "").toString();
          if (authorId) entry.contributorsSet.add(authorId);

          // Sum comments
          entry.totalComments += Number(r.comments || 0);
        });

        const list = Array.from(byCompany.entries()).map(([name, data]) => {
          const { posts, contributorsSet, totalComments } = data;
          const totalPosts = posts.length;

          const avgDifficulty = totalPosts
            ? Math.round(
                (posts.reduce(
                  (sum, p) => sum + (Number(p.difficulty || 0) || 0),
                  0
                ) /
                  totalPosts) *
                  10
              ) / 10
            : 0;

          const success = posts.filter((p) =>
            (p.outcome || "").toLowerCase().includes("select")
          ).length;

          const successRate = totalPosts
            ? Math.round((success / totalPosts) * 100)
            : 0;

          const trending = posts.slice(0, Math.min(posts.length, 10)).length >= 5;

          return {
            name,
            totalPosts,
            avgDifficulty,
            successRate,
            contributors: contributorsSet.size,
            comments: totalComments,
            trending,
          };
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
