// content.js — PrepVerse x LeetCode (stable version)
// Profile via GraphQL (matchedUser). Solved lists via REST /api/problems/all/.
// No GraphQL filters used.

const CS_LOG = (...a) => console.log('[PV-CS]', ...a);
CS_LOG('Content script ready.');

// ---------- GraphQL helper ----------
async function lcGraphQL(query, variables = {}) {
  const r = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    credentials: 'include'
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  const j = JSON.parse(t);
  if (j.errors) throw new Error(j.errors.map(e => e.message).join('; '));
  return j.data;
}

// ---------- Current username ----------
async function getCurrentUsername() {
  const q = `query { userStatus { username } }`;
  const d = await lcGraphQL(q, {});
  const u = d?.userStatus?.username || null;
  if (!u) throw new Error('Not logged in on leetcode.com');
  return u;
}

// ---------- Profile + AC counts via matchedUser ----------
async function fetchProfileAndCounts() {
  const username = await getCurrentUsername();
  const q = `
    query getUser($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty   # "ALL" | "EASY" | "MEDIUM" | "HARD"
            count
          }
        }
      }
    }
  `;
  const d = await lcGraphQL(q, { username });
  const u = d?.matchedUser;
  if (!u) throw new Error('User not found');

  const byDiff = Object.fromEntries(
    (u.submitStats?.acSubmissionNum || []).map(x => [x.difficulty, x.count])
  );

  return {
    username,
    profile: {
      userAvatar: u.profile?.userAvatar || '',
      realName:   u.profile?.realName   || '',
      ranking:    u.profile?.ranking ?? null,
      reputation: u.profile?.reputation ?? 0
    },
    solved: {
      total:  byDiff.ALL    ?? 0,
      easy:   byDiff.EASY   ?? 0,
      medium: byDiff.MEDIUM ?? 0,
      hard:   byDiff.HARD   ?? 0
    }
  };
}

// ---------- REST: solved lists (robust) ----------
async function fetchSolvedFromRest() {
  const r = await fetch('https://leetcode.com/api/problems/all/', {
    credentials: 'include',
    headers: { 'accept': 'application/json' }
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  const j = JSON.parse(t);

  const easy = [];
  const medium = [];
  const hard = [];

  for (const p of j.stat_status_pairs || []) {
    if (p.status === 'ac') {
      const diff =
        p.difficulty?.level === 1 ? 'EASY' :
        p.difficulty?.level === 2 ? 'MEDIUM' :
        p.difficulty?.level === 3 ? 'HARD' : 'UNKNOWN';

      const item = {
        title: p.stat?.question__title || '',
        slug:  p.stat?.question__title_slug || '',
        difficulty: diff,
        paidOnly: !!p.paid_only,
        acRate: undefined,
        tags: []
      };

      if (diff === 'EASY')   easy.push(item);
      if (diff === 'MEDIUM') medium.push(item);
      if (diff === 'HARD')   hard.push(item);
    }
  }

  return { easy, medium, hard, total: easy.length + medium.length + hard.length };
}

// ---------- Message handler ----------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'PV_FETCH_STATS') {
    (async () => {
      try {
        const base = await fetchProfileAndCounts();
        const lists = await fetchSolvedFromRest();

        // trust REST for counts
        base.solved.easy   = lists.easy.length;
        base.solved.medium = lists.medium.length;
        base.solved.hard   = lists.hard.length;
        base.solved.total  = lists.total;

        sendResponse({
          ok: true,
          stats: {
            username: base.username,
            profile:  base.profile,
            solved:   base.solved,
            questions: {
              easy:   lists.easy,
              medium: lists.medium,
              hard:   lists.hard
            }
          }
        });
      } catch (e) {
        console.error('[PV-CS] Fetch error:', e);
        sendResponse({ ok:false, error: e.message || String(e) });
      }
    })();
    return true; // async
  }
});
