import { useEffect, useState } from "react";
import {
  collection,
  addDoc,              // (kept but unused now; you can remove if you like)
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,           // (kept but unused now; you can remove if you like)
  increment,           // (kept but unused now; you can remove if you like)
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt?: any;
}

interface CommentSectionProps {
  postId: string;
}

/**
 * - Uses a batched write: create comment + increment parent count atomically.
 * - Prevents "count not reflecting" issues from race conditions.
 */
const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "experiences", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentList = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Comment[];

        setComments(commentList);
        setInitialLoaded(true);
        setError("");
      },
      (err) => {
        console.error("comments listener error:", err);
        setInitialLoaded(true);
        setError("Unable to load comments.");
      }
    );

    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;
    setLoading(true);
    setError("");

    try {
      const batch = writeBatch(db);

      const postRef = doc(db, "experiences", postId);
      const commentRef = doc(collection(db, "experiences", postId, "comments"));

      // 1) create the comment
      batch.set(commentRef, {
        text: newComment.trim(),
        author: "Anonymous User",
        authorId: "anon", // harmless if your rules don't check it
        createdAt: serverTimestamp(),
      });

      // 2) increment parent's comments count (works even if field missing)
      batch.update(postRef, { comments: (window as any).firebaseIncrement ?? 1 }); // placeholder, will be overwritten below

      // Firestore doesn't allow `increment()` directly inside batch.update payload created like this,
      // so set it explicitly:
      // @ts-ignore – we want the FieldValue sentinel here
      batch.update(postRef, { comments: (await import("firebase/firestore")).increment(1) });

      await batch.commit();

      setNewComment("");
    } catch (err: any) {
      console.error("Error adding comment (batched):", err);
      setError(err?.message || "Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 240, overflowY: "auto" }}>
        {!initialLoaded ? (
          <div style={{ color: "var(--pv-muted)" }}>Loading comments...</div>
        ) : error ? (
          <div style={{ color: "var(--pv-error)" }}>{error}</div>
        ) : comments.length === 0 ? (
          <div style={{ color: "var(--pv-muted)" }}>No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid var(--pv-border)",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--pv-ink)" }}>{c.author}</div>
              <div style={{ color: "var(--pv-body)" }}>{c.text}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          className="pv-field"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          className="pv-btn-royal"
          onClick={handleAddComment}
          disabled={loading || !newComment.trim()}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
