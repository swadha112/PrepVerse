import { Router } from "express";
import { admin } from "../firebaseAdmin.js";
import { encryptJson, decryptJson } from "../utils/crypto.js";

const db = admin.firestore();
const router = Router();

// sanitize server doc → client
function present(conn) {
  if (!conn) return { connected: false };
  return {
    connected: !!conn.has_cookie,
    lc_username: conn.lc_username || null,
    last_synced_at: conn.last_synced_at || null,
    updated_at: conn.updated_at || null,
  };
}

// GET /api/leetcode/connector
router.get("/connector", async (req, res) => {
  const uid = req.user.uid;
  const ref = db.doc(`users/${uid}/integrations/leetcode`);
  const snap = await ref.get();
  return res.json(present(snap.exists ? snap.data() : null));
});

// POST /api/leetcode/connector
// body: { lc_username, sessionCookie?, csrfToken? }
router.post("/connector", async (req, res) => {
  const uid = req.user.uid;
  const { lc_username, sessionCookie, csrfToken } = req.body || {};
  if (!lc_username || typeof lc_username !== "string") {
    return res.status(400).json({ error: "lc_username required" });
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const doc = {
    lc_username,
    has_cookie: !!(sessionCookie && csrfToken),
    updated_at: now,
  };
  if (sessionCookie && csrfToken) {
    doc.enc = encryptJson({ sessionCookie, csrfToken });
  }

  const ref = db.doc(`users/${uid}/integrations/leetcode`);
  await ref.set({ created_at: now, last_synced_at: null, ...doc }, { merge: true });
  const snap = await ref.get();
  return res.status(201).json(present(snap.data()));
});

// DELETE /api/leetcode/connector
router.delete("/connector", async (req, res) => {
  const uid = req.user.uid;
  const ref = db.doc(`users/${uid}/integrations/leetcode`);
  await ref.delete();
  return res.json({ ok: true });
});

// POST /api/leetcode/syncNow
router.post("/syncNow", async (req, res) => {
  const uid = req.user.uid;
  const connRef = db.doc(`users/${uid}/integrations/leetcode`);
  const connSnap = await connRef.get();
  if (!connSnap.exists) return res.status(400).json({ error: "Connector not configured" });
  const conn = connSnap.data();
  if (!conn.has_cookie || !conn.enc) {
    return res.status(400).json({ error: "Session cookie not set" });
  }

  // decrypt cookie
  let creds;
  try { creds = decryptJson(conn.enc); }
  catch { return res.status(500).json({ error: "Decryption failed" }); }

  const sinceTs = conn.last_synced_at?.toDate ? conn.last_synced_at.toDate().toISOString() : null;

  // ---- fetch submissions from LeetCode (see Part 4 below) ----
  const { items, error } = await fetchLeetCodeSubmissions(conn.lc_username, creds, sinceTs);
  if (error) return res.status(502).json({ error });

  // upsert to Firestore
  const batch = db.batch();
  const subCol = db.collection(`users/${uid}/submissions`);
  for (const s of items) {
    const id = s.submission_id ? `lc_${s.submission_id}` : `${s.problem_slug}_${s.ts}`;
    batch.set(subCol.doc(id), s, { merge: true });
  }
  batch.set(connRef, { last_synced_at: admin.firestore.FieldValue.serverTimestamp(), updated_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();

  return res.json({ synced: items.length });
});

export default router;

/* ---- helper: minimal LeetCode GraphQL call (requires auth) ---- */
async function fetchLeetCodeSubmissions(username, { sessionCookie, csrfToken }, sinceIso) {
  try {
    // Query 1: recent accepted submissions
    const query = `
      query recentAc($username: String!) {
        recentAcSubmissionList(username: $username, limit: 50) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;
    const r = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrftoken": csrfToken,
        "cookie": `LEETCODE_SESSION=${sessionCookie}; csrftoken=${csrfToken};`,
        "referer": "https://leetcode.com",
      },
      body: JSON.stringify({ query, variables: { username } }),
    });
    if (!r.ok) return { items: [], error: `LeetCode status ${r.status}` };
    const json = await r.json();
    const list = json?.data?.recentAcSubmissionList || [];

    const items = list
      .map((x) => ({
        submission_id: x.id,
        problem_slug: x.titleSlug,
        status: "Accepted",
        lang: null,
        runtime_ms: null,
        ts: new Date(parseInt(x.timestamp, 10) * 1000).toISOString(),
        source: "leetcode",
      }))
      .filter((s) => !sinceIso || new Date(s.ts) > new Date(sinceIso));

    return { items };
  } catch (e) {
    return { items: [], error: e.message || "fetch error" };
  }
}
