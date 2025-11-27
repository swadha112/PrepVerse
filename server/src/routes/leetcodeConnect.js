// server/src/routes/leetcodeConnect.js
import { Router } from 'express';
import { admin } from '../firebaseAdmin.js';
import fetch from 'node-fetch';

const router = Router();
const db = admin.firestore();

// POST /api/leetcode/connect
router.post('/connect', async (req, res) => {
  const { sessionCookie, csrfToken } = req.body;
  const uid = req.user.uid;
  if (!sessionCookie || !csrfToken) {
    return res.status(400).json({ error: 'Missing cookies' });
  }
  // 1) Store in Firestore
  const ref = db.collection(`users/${uid}/integrations`).doc('leetcode');
  await ref.set({ sessionCookie, csrfToken, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  // 2) Fetch basic profile from LeetCode
  const profileQuery = `
    query userProfile {
      matchedUser { username avatar }
    }
  `;
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `LEETCODE_SESSION=${sessionCookie}; csrftoken=${csrfToken}`,
      'x-csrftoken': csrfToken,
      'referer': 'https://leetcode.com'
    },
    body: JSON.stringify({ query: profileQuery })
  });
  const json = await response.json();
  const username = json.data?.matchedUser?.username || null;
  const avatar   = json.data?.matchedUser?.avatar || null;

  // 3) Save profile info
  await ref.set({ username, avatar, lastSyncedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  res.json({ ok: true, username, avatar });
});
export default router;