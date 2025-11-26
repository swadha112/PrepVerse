// background.js — MV3 service worker
const LOG = (...a) => console.log('[PV-BG]', ...a);
const ERR = (...a) => console.error('[PV-BG]', ...a);

// Open or find a leetcode.com tab and wait until it's complete
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

// Try to send a message to the content script; if it isn't there,
// inject content.js and retry once.
async function sendToContentWithFallback(tabId, payload) {
  // First attempt
  try {
    const resp = await chrome.tabs.sendMessage(tabId, payload);
    return resp;
  } catch (e) {
    // MV3 throws if no receiver; message usually: "Could not establish connection. Receiving end does not exist."
    const msg = (e && (e.message || String(e))) || '';
    if (!/Receiving end does not exist/i.test(msg)) throw e; // real error, bubble up

    LOG('No content script detected, injecting content.js and retrying…');
    // Inject our declared content script as a fallback
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    // Small delay to let it boot
    await new Promise(r => setTimeout(r, 150));

    // Retry once
    const resp2 = await chrome.tabs.sendMessage(tabId, payload);
    return resp2;
  }
}

async function fetchStatsViaContentScript(username) {
  const tab = await findOrOpenLeetCodeTab();
  LOG('Requesting stats on tab', tab.id);

  try {
    const resp = await sendToContentWithFallback(tab.id, { type: 'PV_FETCH_STATS', username });
    if (!resp) return { ok: false, error: 'No response from content script' };
    return resp;
  } catch (e) {
    const msg = e?.message || String(e);
    ERR('sendMessage failed:', msg);
    return { ok: false, error: msg };
  }
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
    return true; // keep the message channel open
  }

  if (msg?.type === 'PV_OPEN_LEETCODE') {
    (async () => {
      const tab = await findOrOpenLeetCodeTab();
      try { await chrome.tabs.update(tab.id, { active: true }); } catch {}
      sendResponse({ ok: true, tabId: tab.id });
    })();
    return true;
  }
});

LOG('Background ready.');
