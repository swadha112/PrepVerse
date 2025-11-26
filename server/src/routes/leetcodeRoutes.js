// routes/leetcode.routes.js
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();
const db = admin.firestore();

router.post('/ingest/leetcode', async (req, res) => {
  try {
    const { username, profile, solved, fetchedAt } = req.body || {};
    if (!username) return res.status(400).json({ ok:false, error:'username required' });

    await db.collection('leetcode_profiles')
      .doc(String(username).toLowerCase())
      .set({
        username,
        profile: profile || null,
        solved:  solved  || null,
        fetchedAt: fetchedAt || Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    return res.json({ ok:true, stored:true });
  } catch (e) {
    console.error('POST /api/ingest/leetcode error:', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
});


router.get('/public/leetcode/profile', async (req, res) => {
  try {
    const username = String(req.query.username || '').trim().toLowerCase();
    if (!username) return res.status(400).json({ ok:false, error:'username query required' });

    const snap = await db.collection('leetcode_profiles').doc(username).get();
    if (!snap.exists) return res.status(404).json({ ok:false, error:'not found' });

    return res.json({ ok:true, ...snap.data() });
  } catch (e) {
    console.error('GET /api/public/leetcode/profile error:', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
});

export default router;
