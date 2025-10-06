// content.js — runs on https://leetcode.com/*
// Fetches stats via GraphQL using page cookies (credentials: 'include').

(function () {
  const LOG = (...a) => console.log('[PV-CS]', ...a);
  const ERR = (...a) => console.error('[PV-CS]', ...a);
  const WARN = (...a) => console.warn('[PV-CS]', ...a);

  function readCookie(name) {
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function detectUsernameFromDom() {
    const anchors = Array.from(document.querySelectorAll('a[href^="/u/"]'));
    for (const a of anchors) {
      const parts = (a.getAttribute('href') || '').split('/').filter(Boolean);
      if (parts[0] === 'u' && parts[1]) {
        LOG('Username via /u/:', parts[1]);
        return parts[1];
      }
    }
    const og = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
    if (og.includes('/u/')) {
      const parts = og.split('/').filter(Boolean);
      const idx = parts.indexOf('u');
      if (idx >= 0 && parts[idx + 1]) {
        LOG('Username via og:url:', parts[idx + 1]);
        return parts[idx + 1];
      }
    }
    WARN('Username not found in DOM.');
    return null;
  }

  async function gql(query, variables = {}) {
    const csrf = readCookie('csrftoken');
    const headers = { 'content-type': 'application/json' };
    if (csrf) headers['x-csrftoken'] = csrf;

    const res = await fetch('/graphql', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ query, variables })
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {
      ERR('GraphQL non-JSON response:', text);
      throw new Error(`GraphQL parse error (${res.status})`);
    }
    if (!res.ok || json.errors) {
      ERR('GraphQL error:', res.status, json.errors || text);
      throw new Error(json?.errors?.[0]?.message || `GraphQL ${res.status}`);
    }
    return json.data;
  }

  async function fetchStats(username) {
    const user = username || detectUsernameFromDom();
    if (!user) {
      return { ok: false, needsProfileVisit: true, error: 'Username not found. Visit your LC profile once.' };
    }

    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile { userAvatar realName ranking reputation }
          submitStats {
            acSubmissionNum { difficulty count submissions }
          }
        }
      }
    `;
    const data = await gql(query, { username: user });
    const m = data?.matchedUser;
    if (!m) throw new Error('matchedUser not found');

    const stats = {
      username: m.username,
      profile: m.profile,
      solved: (m.submitStats?.acSubmissionNum || []).reduce((acc, x) => {
        if (x.difficulty === 'All') acc.total = x.count;
        if (x.difficulty === 'Easy') acc.easy = x.count;
        if (x.difficulty === 'Medium') acc.medium = x.count;
        if (x.difficulty === 'Hard') acc.hard = x.count;
        return acc;
      }, { total: 0, easy: 0, medium: 0, hard: 0 })
    };

    LOG('Fetched stats:', stats);
    return { ok: true, stats };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'PV_FETCH_STATS') {
      (async () => {
        try {
          const result = await fetchStats(msg.username);
          sendResponse(result);
        } catch (e) {
          ERR('PV_FETCH_STATS failed:', e);
          sendResponse({ ok: false, error: e.message || String(e) });
        }
      })();
      return true;
    }
  });

  LOG('Content script ready.');
})();