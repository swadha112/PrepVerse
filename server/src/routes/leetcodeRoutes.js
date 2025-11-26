import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();
const db = admin.firestore();

/** Safely pick stats whether your payload is flat or wrapped in { stats: ... } */
function pickStats(body = {}) {
  if (body && typeof body === 'object' && body.stats && typeof body.stats === 'object') {
    return body.stats; // your current extension shape
  }
  return body; // flat shape
}

router.post('/ingest/leetcode', async (req, res) => {
  try {
    // 1) Extract in both cases
    const s = pickStats(req.body);
    const username  = s?.username ? String(s.username) : null;
    const profile   = s?.profile ?? null;
    const solved    = s?.solved  ?? null;
    const questions = s?.questions ?? null;

    if (!username) {
      return res.status(400).json({ ok:false, error:'username required' });
    }

    // 2) Log EXACTLY what we got
    const lens = {
      easy:   questions?.easy?.length,
      medium: questions?.medium?.length,
      hard:   questions?.hard?.length,
      wrapped: !!req.body?.stats,
    };
    console.log('[INGEST] recv', username, lens);

    // 3) Store AS-IS (no normalization so we cannot “accidentally” drop data)
    await db.collection('leetcode_profiles')
      .doc(username.toLowerCase())
      .set({
        username,
        profile,
        solved,
        questions: (
          questions && typeof questions === 'object'
            ? questions
            : { easy: [], medium: [], hard: [] }
        ),
        fetchedAt: Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    // 4) Echo back what we stored so you see it in the popup/network tab
    return res.json({ ok:true, stored:true, lengths: lens });
  } catch (e) {
    console.error('POST /api/ingest/leetcode', e);
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
    console.error('GET /api/public/leetcode/profile', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
});

export default router;
