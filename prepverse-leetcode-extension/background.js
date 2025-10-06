// background.js — MV3 service worker
const LOG = (...a) => console.log('[PV-BG]', ...a);
const ERR = (...a) => console.error('[PV-BG]', ...a);

async function findOrOpenLeetCodeTab() {
  const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
  if (tabs.length) return tabs[0];

  LOG('Opening LeetCode…');
  const tab = await chrome.tabs.create({ url: 'https://leetcode.com/problemset/' });
  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
  return tab;
}

async function fetchStatsViaContentScript(username) {
  const tab = await findOrOpenLeetCodeTab();
  LOG('Requesting stats on tab', tab.id);

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { type: 'PV_FETCH_STATS', username }, (resp) => {
      if (chrome.runtime.lastError) {
        ERR('sendMessage error:', chrome.runtime.lastError.message);
        return resolve({ ok: false, error: chrome.runtime.lastError.message });
      }
      resolve(resp || { ok: false, error: 'No response from content script' });
    });
  });
}

async function postStatsToBackend(stats, backendUrl) {
  if (!backendUrl) return { ok: true, skipped: true };
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'leetcode',
        username: stats.username,
        profile: stats.profile,
        solved: stats.solved,
        fetchedAt: Date.now()
      })
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`${res.status} ${text || res.statusText}`);
    LOG('Posted to backend:', backendUrl);
    return { ok: true };
  } catch (e) {
    ERR('Backend POST failed:', e);
    return { ok: false, error: e.message || String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'PV_RUN_SYNC') {
    (async () => {
      const { username, backendUrl } = msg;
      const result = await fetchStatsViaContentScript(username);
      if (!result?.ok) return sendResponse(result);

      const posted = await postStatsToBackend(result.stats, backendUrl);
      await chrome.storage.local.set({
        lastUiRefreshedAt: Date.now(),
        lastStats: JSON.stringify(result)
      });

      return sendResponse({ ok: true, stats: result.stats, backend: posted });
    })();
    return true;
  }
});

LOG('Background ready.');