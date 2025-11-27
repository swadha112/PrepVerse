// server/src/routes/leetcodeProfile.js
import { Router } from 'express';
import { admin } from '../firebaseAdmin.js';

const router = Router();
const db = admin.firestore();

// GET /api/leetcode/profile
router.get('/profile', async (req, res) => {
  const uid = req.user.uid;
  const doc = await db.collection(`users/${uid}/integrations`).doc('leetcode').get();
  if (!doc.exists) return res.status(404).json({ error: 'Not connected' });
  const data = doc.data();
  res.json({
    username: data.username,
    avatar: data.avatar,
    lastSyncedAt: data.lastSyncedAt?.toDate() || null
  });
});

export default router;