// server/src/routes/leetcode.routes.js
import express from 'express';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const db = admin.firestore();

/* ------------------------------ Helpers ------------------------------ */

function safeLower(s) {
  return (s || '').toString().trim().toLowerCase();
}

function extractStats(body) {
  // Accept both {stats:{...}} and flat payloads
  const root = body?.stats ? body.stats : body || {};

  const username = root.username || root.user || root.name;
  const profile  = root.profile || {};
  const solved   = root.solved  || {};
  const questions = root.questions || { easy: [], medium: [], hard: [] };
  const fetchedAt = body?.fetchedAt || Date.now();

  return { username, profile, solved, questions, fetchedAt };
}

function normalizeQuestions(qs) {
  const normList = (arr) =>
    Array.isArray(arr)
      ? arr.map(q => ({
          title: q?.title || '',
          slug: q?.slug || q?.titleSlug || '',
          difficulty: q?.difficulty || '',
          paidOnly: !!(q?.paidOnly ?? q?.isPaidOnly),
          tags: Array.isArray(q?.tags)
            ? q.tags.map(t => ({ name: t?.name || '', slug: t?.slug || '' }))
            : Array.isArray(q?.topicTags)
              ? q.topicTags.map(t => ({ name: t?.name || '', slug: t?.slug || '' }))
              : []
        }))
      : [];

  return {
    easy:   normList(qs?.easy),
    medium: normList(qs?.medium),
    hard:   normList(qs?.hard)
  };
}

/* -------------------- Track Progress (frozen JSON) -------------------- */

function resolveTracksDir() {
  const tryDirs = [
    path.resolve(process.cwd(), '../client/public/data'),
    path.resolve(process.cwd(), './public/data'),
    path.resolve(process.cwd(), '../public/data'),
  ];
  for (const d of tryDirs) {
    try { if (fs.existsSync(d)) return d; } catch {}
  }
  return null;
}
const TRACKS_DIR = resolveTracksDir();

function safeJSON(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(txt);
  } catch { return null; }
}

function loadTopicDiffSlugs(topicSlug, diff /* 'easy'|'medium'|'hard' */) {
  if (!TRACKS_DIR) return [];
  const file = path.join(TRACKS_DIR, topicSlug, `${diff}.json`);
  const j = safeJSON(file);
  const arr = Array.isArray(j) ? j : (j && Array.isArray(j.questions)) ? j.questions : [];
  return arr
    .map(q => typeof q === 'string' ? q : (q?.slug || q?.titleSlug || ''))
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function listAllTrackSlugs() {
  if (!TRACKS_DIR) return [];
  try {
    return fs.readdirSync(TRACKS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }
}

function computeTrackProgressFromSolved(solvedSet /* Set<string> */) {
  const tracks = {};
  const calc = (slugs) => {
    const total = slugs.length;
    let solved = 0;
    for (const s of slugs) if (solvedSet.has(s)) solved++;
    const percent = total ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percent };
  };

  for (const trackSlug of listAllTrackSlugs()) {
    const easy   = loadTopicDiffSlugs(trackSlug, 'easy');
    const medium = loadTopicDiffSlugs(trackSlug, 'medium');
    const hard   = loadTopicDiffSlugs(trackSlug, 'hard');
    tracks[trackSlug] = {
      foundation:   calc(easy),
      intermediate: calc(medium),
      advanced:     calc(hard),
    };
  }
  return tracks;
}

/* ----------------------- Streak computation ------------------------- */

async function fetchSubmissionCalendar(username) {
  const url = `https://leetcode.com/api/user/submission-calendar/?username=${encodeURIComponent(username)}`;
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || r.statusText);

  let data = txt;
  try { data = JSON.parse(txt); } catch {}
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch {}
  }
  return (data && typeof data === 'object') ? data : {};
}

function calendarToDaySet(map) {
  const set = new Set();
  for (const [tsSec, count] of Object.entries(map || {})) {
    if ((count || 0) > 0) {
      const d = new Date(Number(tsSec) * 1000);
      set.add(d.toISOString().slice(0, 10)); // UTC YYYY-MM-DD
    }
  }
  return set;
}

function computeStreakFromDaySet(daySet) {
  const today = new Date();
  let cur = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())); // UTC midnight
  let streak = 0;
  let lastProgressAt = null;

  for (let i = 0; i < 3650; i++) {
    const key = cur.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
      if (!lastProgressAt) lastProgressAt = cur.getTime();
      cur.setUTCDate(cur.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return { streak, lastProgressAt };
}

async function fetchRecentACDaySet(username) {
  const query = `
    query($username:String!){
      recentAcSubmissionList(username:$username, limit:50){
        timestamp
      }
    }
  `;
  const r = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } })
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  const j = JSON.parse(t);
  const list = j?.data?.recentAcSubmissionList || [];
  const set = new Set();
  for (const it of list) {
    const d = new Date(Number(it.timestamp) * 1000);
    set.add(d.toISOString().slice(0, 10));
  }
  return set;
}

async function getStreaks(username) {
  const cal = await fetchSubmissionCalendar(username);
  const submitSet = calendarToDaySet(cal);
  const submit = computeStreakFromDaySet(submitSet);

  let acStreak = null;
  try {
    const acSet = await fetchRecentACDaySet(username);
    acStreak = computeStreakFromDaySet(acSet).streak;
  } catch {
    // ignore; acStreak stays null when GraphQL blocks
  }
  return { streak: submit.streak, lastProgressAt: submit.lastProgressAt, acStreak };
}

/* -------------------------- Daily challenge -------------------------- */

async function fetchDailyGraphQL() {
  const query = `
    query {
      activeDailyCodingChallengeQuestion {
        date
        userStatus
        link
        question {
          questionId
          title
          titleSlug
          difficulty
          acRate
          isPaidOnly
          topicTags { name slug }
        }
      }
    }
  `;
  const r = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  const j = JSON.parse(t);
  const node = j?.data?.activeDailyCodingChallengeQuestion;
  if (!node) throw new Error('GraphQL: daily not found');

  const q = node.question || {};
  return {
    ok: true,
    date: node.date,
    link: `https://leetcode.com${node.link || '/problems/' + q.titleSlug + '/'}`,
    question: {
      id: q.questionId ?? null,
      title: q.title || null,
      slug: q.titleSlug || null,
      difficulty: q.difficulty || null,
      acRate: q.acRate || null,
      paidOnly: !!(q.isPaidOnly),
      tags: (q.topicTags || []).map(t => ({ name: t.name, slug: t.slug }))
    }
  };
}

async function fetchDailyByScrape() {
  const r = await fetch('https://leetcode.com/');
  const html = await r.text();
  if (!r.ok) throw new Error(`home ${r.status}`);

  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (!m) throw new Error('__NEXT_DATA__ not found');

  let data = JSON.parse(m[1]);
  const flat = JSON.stringify(data);
  const key = '"activeDailyCodingChallengeQuestion":';
  const idx = flat.indexOf(key);
  if (idx === -1) throw new Error('daily key not found');

  const start = flat.indexOf('{', idx);
  let depth = 0, j = start;
  for (; j < flat.length; j++) {
    const ch = flat[j];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { j++; break; }
    }
  }
  const obj = JSON.parse(flat.slice(start, j));
  const q = obj?.question || {};

  const link = obj?.link
    ? `https://leetcode.com${obj.link}`
    : (q?.titleSlug ? `https://leetcode.com/problems/${q.titleSlug}/` : 'https://leetcode.com/problemset/all/');

  return {
    ok: true,
    date: obj?.date || null,
    link,
    question: {
      id: q?.questionId ?? q?.frontendQuestionId ?? null,
      title: q?.title || null,
      slug: q?.titleSlug || null,
      difficulty: q?.difficulty || null,
      acRate: q?.acRate || null,
      paidOnly: !!(q?.isPaidOnly ?? q?.paidOnly),
      tags: (q?.topicTags || []).map(t => ({ name: t.name, slug: t.slug }))
    }
  };
}
// Normalize question item shape from frozen JSON
function normalizeFrozenItem(item) {
    if (!item) return null;
    if (typeof item === 'string') {
      return { slug: item.toLowerCase(), title: item, difficulty: null, acceptance: null, tags: [] };
    }
    const slug = (item.slug || item.titleSlug || '').toLowerCase();
    if (!slug) return null;
    const title = item.title || slug.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
    const difficulty = item.difficulty || null;
    const acceptance = (typeof item.acceptance === 'number')
      ? item.acceptance
      : (typeof item.acRate === 'number' ? item.acRate : null);
    const tags = Array.isArray(item.tags)
      ? item.tags.map(t => (typeof t === 'string' ? t : (t?.name || ''))).filter(Boolean)
      : [];
    return { slug, title, difficulty, acceptance, tags };
  }
  
  // Load full question objects for a topic+diff from frozen JSON
  function loadTopicDiffQuestions(topicSlug, diff /* 'easy'|'medium'|'hard' */) {
    if (!TRACKS_DIR) return [];
    const file = path.join(TRACKS_DIR, topicSlug, `${diff}.json`);
    const j = safeJSON(file);
    const arr = Array.isArray(j) ? j : (j && Array.isArray(j.questions)) ? j.questions : [];
    const out = [];
    for (const it of arr) {
      const q = normalizeFrozenItem(it);
      if (q) out.push(q);
    }
    return out;
  }
  
  function nextTierKeyFromTrackObj(t = {}) {
    if (t?.foundation?.percent < 100) return 'foundation';
    if (t?.intermediate?.percent < 100) return 'intermediate';
    return 'advanced';
  }
  
  function chooseTargetTrack(tracks, mode /* 'finish' | 'weakness' */) {
    if (!tracks) return null;
    const rows = Object.entries(tracks).map(([slug, t]) => {
      const nextKey = nextTierKeyFromTrackObj(t);
      const meta = t?.[nextKey] || { percent: 0, total: 0, solved: 0 };
      return { slug, nextKey, meta };
    }).filter(r => r.meta.total > 0);
  
    if (!rows.length) return null;
  
    if (mode === 'weakness') {
      // Lowest percent first, tie-break by bigger total
      rows.sort((a, b) => (a.meta.percent - b.meta.percent) || (b.meta.total - a.meta.total));
      return rows[0];
    }
  
    // default 'finish' → highest percent below 100; tie-break by more remaining
    const eligible = rows.filter(r => r.meta.percent < 100);
    if (eligible.length) {
      eligible.sort((a, b) => (b.meta.percent - a.meta.percent) ||
        ((b.meta.total - b.meta.solved) - (a.meta.total - a.meta.solved)));
      return eligible[0];
    }
  
    // all tiers complete? pick most substantial track
    rows.sort((a, b) => b.meta.total - a.meta.total);
    return rows[0];
  }
  
  function extractSolvedSetFromDoc(docData) {
    const out = new Set();
    const push = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const q of arr) {
        const s = (q?.slug || q?.titleSlug || '').toLowerCase().trim();
        if (s) out.add(s);
      }
    };
    push(docData?.questions?.easy);
    push(docData?.questions?.medium);
    push(docData?.questions?.hard);
    return out;
  }

/* ----------------------------- Routes -------------------------------- */

// Health (optional)
router.get('/public/leetcode/health', (_req, res) => res.json({ ok: true }));

// Ingest stats from extension/backend
router.post('/ingest/leetcode', async (req, res) => {
  try {
    const { username, profile, solved, questions, fetchedAt } = extractStats(req.body);
    if (!username) return res.status(400).json({ ok: false, error: 'username required' });

    const uname = safeLower(username);
    const norm = normalizeQuestions(questions);

    const solvedSafe = solved && typeof solved === 'object'
      ? solved
      : {
          total:  (norm.easy.length + norm.medium.length + norm.hard.length),
          easy:   norm.easy.length,
          medium: norm.medium.length,
          hard:   norm.hard.length
        };

    // Compute streaks (submission streak always; AC streak best-effort)
    let streakInfo = { streak: 0, lastProgressAt: null, acStreak: null };
    try {
      streakInfo = await getStreaks(username);
    } catch (e) {
      console.warn('[INGEST] streak compute failed:', e.message || e);
    }

    await db.collection('leetcode_profiles').doc(uname).set({
      username,
      profile,
      solved: solvedSafe,
      questions: norm,
      fetchedAt: fetchedAt || Date.now(),
      streak: streakInfo.streak,
      lastProgressAt: streakInfo.lastProgressAt,
      ...(streakInfo.acStreak != null ? { acStreak: streakInfo.acStreak } : {}),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // --- Precompute track/tier percentages once and store ---
    try {
      const solvedSlugs = new Set([
        ...norm.easy.map(q => (q.slug || '').toLowerCase()),
        ...norm.medium.map(q => (q.slug || '').toLowerCase()),
        ...norm.hard.map(q => (q.slug || '').toLowerCase()),
      ].filter(Boolean));

      const trackProgress = computeTrackProgressFromSolved(solvedSlugs);

      await db.collection('leetcode_profiles').doc(uname).set({
        trackProgress: {
          tracks: trackProgress,
          computedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      }, { merge: true });
    } catch (e) {
      console.warn('[INGEST] trackProgress compute failed:', e?.message || e);
    }

    res.json({
      ok: true,
      stored: true,
      lengths: {
        easy: norm.easy.length,
        medium: norm.medium.length,
        hard: norm.hard.length
      },
      streak: streakInfo.streak,
      acStreak: streakInfo.acStreak ?? undefined
    });
  } catch (err) {
    console.error('POST /ingest/leetcode ->', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Public: read stored profile
router.get('/public/leetcode/profile', async (req, res) => {
  try {
    const username = safeLower(req.query.username);
    if (!username) return res.status(400).json({ ok: false, error: 'username required' });

    const snap = await db.collection('leetcode_profiles').doc(username).get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'profile not found' });

    res.json({ ok: true, ...snap.data() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// Public: summary (difficulty counts) for dashboard
// /public/leetcode/summary?username=<name>
router.get('/public/leetcode/summary', async (req, res) => {
  try {
    const uname = (req.query.username || '').toString().trim().toLowerCase();
    if (!uname) return res.status(400).json({ ok: false, error: 'username required' });

    const snap = await db.collection('leetcode_profiles').doc(uname).get();

    // If profile not found, return zeros (never 404/HTML)
    if (!snap.exists) {
      return res.json({
        ok: true,
        summary: { easy: 0, medium: 0, hard: 0, total: 0 }
      });
    }

    const data = snap.data() || {};
    const qs = data.questions || { easy: [], medium: [], hard: [] };
    const solved = data.solved || {};

    const easy   = Number.isFinite(solved.easy)   ? solved.easy   : (Array.isArray(qs.easy)   ? qs.easy.length   : 0);
    const medium = Number.isFinite(solved.medium) ? solved.medium : (Array.isArray(qs.medium) ? qs.medium.length : 0);
    const hard   = Number.isFinite(solved.hard)   ? solved.hard   : (Array.isArray(qs.hard)   ? qs.hard.length   : 0);

    return res.json({
      ok: true,
      summary: { easy, medium, hard, total: easy + medium + hard }
    });
  } catch (e) {
    console.warn('SUMMARY route fallback:', e?.message || e);
    // Always return a JSON object so clients (and jq) never fail to parse
    return res.json({
      ok: true,
      summary: { easy: 0, medium: 0, hard: 0, total: 0 }
    });
  }
});

// Public: leaderboard
// /public/leetcode/leaderboard?limit=10&by=ranking|solved|streak
router.get('/public/leetcode/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const by = (req.query.by || 'ranking').toString();

    let orderField;
    let direction = 'asc';

    if (by === 'solved') {
      orderField = 'solved.total';
      direction = 'desc';
    } else if (by === 'streak') {
      orderField = 'streak';
      direction = 'desc';
    } else {
      // default: by global ranking (lower is better)
      orderField = 'profile.ranking';
      direction = 'asc';
    }

    let q = db.collection('leetcode_profiles').orderBy(orderField, direction).limit(limit);
    const rows = [];
    const snap = await q.get();
    snap.forEach(doc => {
      const d = doc.data();
      rows.push({
        username: d.username,
        avatar: d.profile?.userAvatar || '',
        solved: d.solved?.total ?? 0,
        streak: d.streak ?? 0,
        ranking: d.profile?.ranking ?? Number.MAX_SAFE_INTEGER
      });
    });

    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// Public: daily challenge (GraphQL → scrape fallback)
router.get('/public/leetcode/daily', async (_req, res) => {
  try {
    const out = await fetchDailyGraphQL();
    return res.json(out);
  } catch (e1) {
    console.warn('Daily GraphQL failed, falling back to scrape:', e1?.message || e1);
    try {
      const out = await fetchDailyByScrape();
      return res.json(out);
    } catch (e2) {
      console.error('Daily scrape failed:', e2?.message || e2);
      return res.status(500).json({ ok: false, error: e2?.message || String(e2) });
    }
  }
});

// Public: live streak (useful for dashboard)
router.get('/public/leetcode/streak', async (req, res) => {
  try {
    const username = (req.query.username || '').toString().trim();
    if (!username) return res.status(400).json({ ok: false, error: 'username required' });

    const out = await getStreaks(username);
    return res.json({ ok: true, ...out });
  } catch (e) {
    console.warn('STREAK route fallback:', e?.message || e);
    return res.json({ ok: true, streak: 0, lastProgressAt: null, acStreak: null });
  }
});
router.get('/public/leetcode/solved-slugs', async (req, res) => {
    try {
      const username = String(req.query.username || '').trim().toLowerCase();
      if (!username) return res.status(400).json({ ok: false, error: 'username required' });
  
      // from leetcode_profiles/<username> written by your extension ingest
      const doc = await db.collection('leetcode_profiles').doc(username).get();
      const data = doc.exists ? doc.data() : {};
      const qs = data.questions || { easy: [], medium: [], hard: [] };
  
      const toSlugs = (arr = []) =>
        arr
          .map(q => (q?.slug || q?.titleSlug || '').toLowerCase())
          .filter(Boolean);
  
      const easySlugs   = toSlugs(qs.easy);
      const medSlugs    = toSlugs(qs.medium);
      const hardSlugs   = toSlugs(qs.hard);
      const allUnique   = [...new Set([...easySlugs, ...medSlugs, ...hardSlugs])];
  
      return res.json({
        ok: true,
        username,
        slugs: allUnique,
        counts: {
          easy: easySlugs.length,
          medium: medSlugs.length,
          hard: hardSlugs.length
        }
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || String(e) });
    }
  });

// Public: read precomputed track/tier progress percentages
// /public/leetcode/track-progress?username=<name>
router.get('/public/leetcode/track-progress', async (req, res) => {
  try {
    const uname = (req.query.username || '').toString().trim().toLowerCase();
    if (!uname) return res.status(400).json({ ok: false, error: 'username required' });

    const snap = await db.collection('leetcode_profiles').doc(uname).get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'profile not found' });

    const data = snap.data();
    const tracks = data?.trackProgress?.tracks || {};
    const computedAt = data?.trackProgress?.computedAt || null;

    return res.json({ ok: true, username: uname, tracks, computedAt });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});
/**
 * GET /public/leetcode/recommendations
 * Query: username=<lcName>&mode=finish|weakness&limit=5
 * Returns: { ok, username, track: { slug, tier, stats }, suggestions: [ { slug, title, difficulty, tags, acceptance } ] }
 */
router.get('/public/leetcode/recommendations', async (req, res) => {
    try {
      const uname = (req.query.username || '').toString().trim().toLowerCase();
      const mode = ((req.query.mode || 'finish') + '').toLowerCase();
      const limit = Math.max(1, Math.min(10, parseInt(req.query.limit, 10) || 5));
      if (!uname) return res.status(400).json({ ok: false, error: 'username required' });
  
      // Load stored profile (ingested by extension)
      const snap = await db.collection('leetcode_profiles').doc(uname).get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'profile not found' });
      const data = snap.data() || {};
  
      const tracks = data?.trackProgress?.tracks || null;
      if (!tracks) return res.json({ ok: true, username: uname, track: null, suggestions: [] });
  
      const target = chooseTargetTrack(tracks, mode);
      if (!target) return res.json({ ok: true, username: uname, track: null, suggestions: [] });
  
      // Map tier key → diff folder
      const diffMap = { foundation: 'easy', intermediate: 'medium', advanced: 'hard' };
      const diff = diffMap[target.nextKey] || 'easy';
  
      // Build solved set
      const solvedSet = extractSolvedSetFromDoc(data);
  
      // Load frozen questions for this track + tier
      const frozen = loadTopicDiffQuestions(target.slug, diff);
  
      // Filter unsolved and sort:
      // - 'finish': easier first (higher acceptance)
      // - 'weakness': mid-acceptance 40–70 prioritized (skill-builder), then rest
      let candidates = frozen.filter(q => !solvedSet.has(q.slug));
  
      if (mode === 'weakness') {
        const mid = candidates.filter(q => (q.acceptance == null) || (q.acceptance >= 40 && q.acceptance <= 70));
        const rest = candidates.filter(q => !(q.acceptance == null || (q.acceptance >= 40 && q.acceptance <= 70)));
        mid.sort((a, b) => (a.acceptance ?? 0) - (b.acceptance ?? 0)); // slightly harder first
        rest.sort((a, b) => (a.acceptance ?? 0) - (b.acceptance ?? 0));
        candidates = [...mid, ...rest];
      } else {
        candidates.sort((a, b) => (b.acceptance ?? 0) - (a.acceptance ?? 0));
      }
  
      const suggestions = candidates.slice(0, limit).map(q => ({
        slug: q.slug,
        title: q.title,
        difficulty: q.difficulty || (diff.toUpperCase()),
        tags: q.tags || [],
        acceptance: q.acceptance ?? null,
      }));
  
      return res.json({
        ok: true,
        username: uname,
        track: {
          slug: target.slug,
          tier: target.nextKey,
          stats: target.meta
        },
        suggestions
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || String(e) });
    }
  });
export default router;
