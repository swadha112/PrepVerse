// src/hooks/useCompanyPosts.ts
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Post } from "../types";

export default function useCompanyPosts(companyName?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyName) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "experiences"),
        where("company", "==", companyName),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const arr: Post[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          setPosts(arr);
          setLoading(false);
        },
        (err) => {
          console.error("useCompanyPosts onSnapshot error", err);
          setError(err?.message ?? "Failed to load posts");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err: any) {
      setError(err?.message ?? "Failed to query posts");
      setLoading(false);
    }
  }, [companyName]);

  return { posts, loading, error } as const;
}
