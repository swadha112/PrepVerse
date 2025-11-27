// background.js
const BG = (...a) => console.log('[PV-BG]', ...a);
const BGE = (...a) => console.error('[PV-BG]', ...a);

async function findOrOpenLeetCodeTab() {
  const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
  if (tabs.length) return tabs[0];
  const tab = await chrome.tabs.create({ url: 'https://leetcode.com/problemset/' });
  await new Promise(r => {
    const L = (id, info) => { if (id === tab.id && info.status === 'complete') { chrome.tabs.onUpdated.removeListener(L); r(); } };
    chrome.tabs.onUpdated.addListener(L);
  });
  return tab;
}

async function sendToContent(tabId, payload) {
  try { return await chrome.tabs.sendMessage(tabId, payload); }
  catch (e) {
    if (!/Receiving end does not exist/i.test(e?.message || '')) throw e;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await new Promise(r => setTimeout(r, 120));
    return await chrome.tabs.sendMessage(tabId, payload);
  }
}

async function fetchStatsViaContentScript(username) {
  const tab = await findOrOpenLeetCodeTab();
  try { return await sendToContent(tab.id, { type: 'PV_FETCH_STATS', username }); }
  catch (e) { return { ok:false, error: e?.message || String(e) }; }
}

async function postStatsToBackend(stats, backendUrl) {
  if (!backendUrl) return { ok: true, skipped: true };

  const questions = stats?.questions && typeof stats.questions === 'object'
    ? stats.questions
    : { easy: [], medium: [], hard: [] };

  BG('posting stats summary', {
    e: questions.easy?.length, m: questions.medium?.length, h: questions.hard?.length
  });

  const payload = {
    username:  stats?.username,
    profile:   stats?.profile,
    solved:    stats?.solved,
    questions,                 // ← make sure this is present
    fetchedAt: Date.now(),
  };

  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text || res.statusText}`);
  return { ok: true };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // 1) Full sync: fetch from LC, store, post
  if (msg?.type === 'PV_RUN_SYNC') {
    (async () => {
      try {
        const { username, backendUrl } = msg;
        BG('PV_RUN_SYNC', { backendUrl });

        const result = await fetchStatsViaContentScript(username);
        if (!result?.ok) return sendResponse(result);

        // store the full object (not just a string)
        await chrome.storage.local.set({ lastStatsObj: result.stats, lastSyncedAt: Date.now() });

        const posted = await postStatsToBackend(result.stats, backendUrl);
        sendResponse({ ok:true, stats: result.stats, backend: posted });
      } catch (e) {
        BGE('PV_RUN_SYNC error', e);
        sendResponse({ ok:false, error: e.message || String(e) });
      }
    })();
    return true;
  }

  // 2) Post again: read from storage, post the exact same stats
  if (msg?.type === 'PV_SEND_LAST') {
    (async () => {
      try {
        const { backendUrl } = msg;
        const { lastStatsObj } = await chrome.storage.local.get(['lastStatsObj']);
        if (!lastStatsObj) return sendResponse({ ok:false, error:'No cached stats. Run Sync first.' });

        const posted = await postStatsToBackend(lastStatsObj, backendUrl);
        sendResponse({ ok:true, backend: posted, stats: lastStatsObj });
      } catch (e) {
        BGE('PV_SEND_LAST error', e);
        sendResponse({ ok:false, error: e.message || String(e) });
      }
    })();
    return true;
  }
});

console.log('[PV-BG] Background ready.');
