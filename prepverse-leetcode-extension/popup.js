// popup.js — enhanced UI for LeetCode connector
const LOG = (...a) => console.log('[PV-PU]', ...a);
const ERR = (...a) => console.error('[PV-PU]', ...a);

const el = (id) => document.getElementById(id);

const viewConnected = el('viewConnected');
const viewEmpty = el('viewEmpty');
const emptyError = el('emptyError');

const avatar = el('avatar');
const uname = el('uname');
const rank = el('rank');
const statTotal = el('statTotal');
const statEasy = el('statEasy');
const statMedium = el('statMedium');
const statHard = el('statHard');
const lastSync = el('lastSync');
const syncPill = el('syncPill');

const backendUrlInput = el('backendUrl');
const usernameInput = el('username');
const raw = el('raw');

const statusEl = el('status');
const btnRefresh = el('btnRefresh');
const btnSend = el('btnSend');
const btnOpenLC = el('btnOpenLC');
const btnOpenLC2 = el('btnOpenLC2');

function setStatus(msg, kind='info') {
  statusEl.textContent = msg ? (kind === 'error' ? `⚠️ ${msg}` : kind === 'ok' ? `✅ ${msg}` : `ℹ️ ${msg}`) : '';
}

function fmtAgo(ts){
  if (!ts) return 'never';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  const ms = Date.now() - d.getTime();
  if (ms < 60e3) return 'just now';
  const m = Math.floor(ms/60e3);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h/24);
  return `${dd}d ago`;
}

function showViews(connected){
  viewConnected.style.display = connected ? 'block' : 'none';
  viewEmpty.style.display = connected ? 'none' : 'block';
  emptyError.style.display = 'none';
}

function setPill(stale){
  if (stale){
    syncPill.className = 'pill warn';
    syncPill.textContent = 'Stale';
  } else {
    syncPill.className = 'pill good';
    syncPill.textContent = 'Connected';
  }
}

function renderStats(resp, fetchedAt){
  if (!resp || !resp.ok){
    showViews(false);
    emptyError.style.display = resp?.error ? 'block' : 'none';
    emptyError.textContent = resp?.error || '';
    raw.textContent = JSON.stringify(resp || {}, null, 2);
    return;
  }
  const s = resp.stats || {};
  const p = s.profile || {};

  avatar.src = p.userAvatar || '';
  uname.textContent = s.username || '—';
  rank.textContent = (p.ranking ?? '—');

  statTotal.textContent = s.solved?.total ?? 0;
  statEasy.textContent = s.solved?.easy ?? 0;
  statMedium.textContent = s.solved?.medium ?? 0;
  statHard.textContent = s.solved?.hard ?? 0;

  const ts = fetchedAt || Date.now();
  lastSync.textContent = fmtAgo(ts);
  const stale = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime()) > 24*60*60*1000;
  setPill(stale);

  raw.textContent = JSON.stringify(resp, null, 2);
  showViews(true);
}

async function loadPrefs(){
  const s = await chrome.storage.local.get(['backendUrl','lcUsernameHint','lastUiRefreshedAt','lastStats']);
  if (s.backendUrl) backendUrlInput.value = s.backendUrl;
  if (s.lcUsernameHint) usernameInput.value = s.lcUsernameHint;
  if (s.lastStats){
    try { renderStats(JSON.parse(s.lastStats), s.lastUiRefreshedAt); } catch {}
  } else {
    showViews(false);
  }
}

async function savePrefs(){
  await chrome.storage.local.set({
    backendUrl: backendUrlInput.value.trim(),
    lcUsernameHint: usernameInput.value.trim(),
  });
}

async function runSync(){
  setStatus('Fetching…');
  btnRefresh.disabled = true; btnSend.disabled = true;
  try{
    await savePrefs();
    const backendUrl = backendUrlInput.value.trim() || null;
    const username = usernameInput.value.trim() || null;

    chrome.runtime.sendMessage({ type: 'PV_RUN_SYNC', backendUrl, username }, async (resp) => {
      if (!resp){
        setStatus('No response from background', 'error');
        showViews(false); return;
      }
      if (!resp.ok){
        setStatus(resp.error || 'Fetch failed', 'error');
        showViews(false);
      } else {
        setStatus('Fetched stats', 'ok');
        renderStats(resp, Date.now());
        await chrome.storage.local.set({ lastUiRefreshedAt: Date.now(), lastStats: JSON.stringify(resp) });
      }
    });
  } catch(e){
    setStatus(e.message || String(e), 'error');
    showViews(false);
  } finally {
    btnRefresh.disabled = false; btnSend.disabled = false;
  }
}

btnRefresh.addEventListener('click', runSync);
btnSend.addEventListener('click', async () => { await runSync(); });
btnOpenLC.addEventListener('click', () => {
  const user = uname.textContent && uname.textContent !== '—' ? uname.textContent : null;
  const url = user ? `https://leetcode.com/u/${encodeURIComponent(user)}/` : 'https://leetcode.com/problemset/';
  chrome.tabs.create({ url });
});
btnOpenLC2.addEventListener('click', () => btnOpenLC.click());

loadPrefs().catch(ERR);