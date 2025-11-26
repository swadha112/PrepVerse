// popup.js — PrepVerse ↔ LeetCode (MV3)

// ---------- Config ----------
const DEFAULT_BACKEND = 'http://localhost:4000/api/ingest/leetcode';

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const btnRefresh   = $('btnRefresh');
const btnSend      = $('btnSend');
const btnOpenLC    = $('btnOpenLC');
const btnOpenLC2   = $('btnOpenLC2');

const viewConnected= $('viewConnected');
const viewEmpty    = $('viewEmpty');
const emptyError   = $('emptyError');

const avatar       = $('avatar');
const uname        = $('uname');
const rank         = $('rank');
const syncPill     = $('syncPill');

const statTotal    = $('statTotal');
const statEasy     = $('statEasy');
const statMedium   = $('statMedium');
const statHard     = $('statHard');

const lastSync     = $('lastSync');

const backendUrlIn = $('backendUrl');
const usernameIn   = $('username');

const rawPre       = $('raw');
const statusEl     = $('status');

// ---------- Storage keys ----------
const SKEY_BACKEND = 'backendUrl';
const SKEY_USERHINT= 'lcUsernameHint';
const SKEY_LAST    = 'lastStats';
const SKEY_LAST_TS = 'lastUiRefreshedAt';

// ---------- Helpers ----------
function setStatus(msg, kind = 'info') {
  if (!statusEl) return;
  statusEl.textContent = msg || '';
  statusEl.className = 'sub';
  if (kind === 'ok') statusEl.classList.add('ok');
  if (kind === 'error') statusEl.classList.add('error');
}

function showConnected(on) {
  viewConnected.style.display = on ? 'block' : 'none';
  viewEmpty.style.display = on ? 'none' : 'block';
  syncPill.textContent = on ? 'Connected' : 'Not synced';
  syncPill.className = 'pill ' + (on ? 'good' : '');
}

function setLastSync(ts) {
  if (!ts) { lastSync.textContent = '—'; return; }
  const d = new Date(ts);
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  lastSync.textContent = mins < 1 ? 'just now' : `${mins}m ago`;
  lastSync.title = d.toLocaleString();
}

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2); }
  catch { return String(obj); }
}

function showRaw(obj) {
  rawPre.textContent = pretty(obj ?? '—');
}

// ---------- Render ----------
function render(resp, whenTs) {
  const s = resp?.stats || {};
  const p = s.profile || {};
  const solved = s.solved || {};

  avatar.src = p.userAvatar || '';
  uname.textContent = s.username || '—';
  rank.textContent  = (p.ranking ?? '—');

  statTotal.textContent  = solved.total  ?? 0;
  statEasy.textContent   = solved.easy   ?? 0;
  statMedium.textContent = solved.medium ?? 0;
  statHard.textContent   = solved.hard   ?? 0;

  setLastSync(whenTs || Date.now());
  showConnected(!!s.username);
  showRaw(resp);
}

// ---------- Storage ----------
async function loadPrefs() {
  const s = await chrome.storage.local.get([SKEY_BACKEND, SKEY_USERHINT, SKEY_LAST, SKEY_LAST_TS]);
  backendUrlIn.value = s[SKEY_BACKEND] || DEFAULT_BACKEND;
  usernameIn.value   = s[SKEY_USERHINT] || '';

  if (s[SKEY_LAST]) {
    try {
      const cached = JSON.parse(s[SKEY_LAST]);
      render(cached, s[SKEY_LAST_TS] || Date.now());
      setStatus('Showing cached data');
    } catch {
      showConnected(false);
      setStatus('Not synced yet');
    }
  } else {
    showConnected(false);
    setStatus('Not synced yet');
  }
}

async function savePrefs() {
  const backendUrl = (backendUrlIn.value.trim() || DEFAULT_BACKEND);
  const lcUsername = (usernameIn.value.trim() || '');
  await chrome.storage.local.set({
    [SKEY_BACKEND]: backendUrl,
    [SKEY_USERHINT]: lcUsername
  });
  return { backendUrl, lcUsername };
}

// ---------- Actions ----------
async function runSync() {
  try {
    setStatus('Fetching…');
    btnRefresh.disabled = true;
    btnSend.disabled = true;

    const { backendUrl, lcUsername } = await savePrefs();

    chrome.runtime.sendMessage(
      { type: 'PV_RUN_SYNC', backendUrl, username: lcUsername || null },
      async (resp) => {
        btnRefresh.disabled = false;
        btnSend.disabled = false;

        if (!resp) {
          showConnected(false);
          showRaw({ ok:false, error:'No response from background' });
          setStatus('No response from background', 'error');
          return;
        }
        if (!resp.ok) {
          showConnected(false);
          showRaw(resp);
          setStatus(resp.error || 'Sync failed', 'error');
          emptyError.style.display = 'block';
          emptyError.textContent = resp.error || 'Sync failed';
          return;
        }

        // success
        const now = Date.now();
        render(resp, now);
        setStatus(resp.backend?.ok ? 'Synced to backend' : 'Fetched stats', resp.backend?.ok ? 'ok' : 'info');
        emptyError.style.display = 'none';

        await chrome.storage.local.set({
          [SKEY_LAST]: JSON.stringify(resp),
          [SKEY_LAST_TS]: now
        });
      }
    );
  } catch (e) {
    btnRefresh.disabled = false;
    btnSend.disabled = false;
    setStatus(e.message || 'Sync error', 'error');
  }
}

async function sendToBackend() {
  try {
    const { backendUrl } = await savePrefs();
    const s = await chrome.storage.local.get([SKEY_LAST]);
    if (!s[SKEY_LAST]) {
      setStatus('No cached result to send', 'error');
      return;
    }
    const payload = JSON.parse(s[SKEY_LAST]);
    const stats = payload?.stats;
    if (!stats?.username) {
      setStatus('Invalid cached payload', 'error');
      return;
    }

    setStatus('Posting to backend…');

    const res = await fetch(backendUrl || DEFAULT_BACKEND, {
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

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    setStatus('Posted to backend', 'ok');
  } catch (e) {
    setStatus(e.message || 'Post failed', 'error');
  }
}

function openLeetCode() {
  chrome.runtime.sendMessage({ type: 'PV_OPEN_LEETCODE' });
}

// ---------- Events ----------
document.addEventListener('DOMContentLoaded', async () => {
  await loadPrefs();

  btnRefresh?.addEventListener('click', runSync);
  btnSend?.addEventListener('click', sendToBackend);
  btnOpenLC?.addEventListener('click', openLeetCode);
  btnOpenLC2?.addEventListener('click', openLeetCode);
});
