// popup.js
// Handles the "Open & Auto-Sync LeetCode" button

const statusEl = document.getElementById('status');
const OPEN_URL = 'https://leetcode.com';

// Open a new LeetCode tab (background.js will grab cookies & sync)
document.getElementById('openLc').onclick = () => {
  statusEl.textContent = 'Status: opening LeetCode...';
  chrome.tabs.create({ url: OPEN_URL }, () => {
    statusEl.textContent = 'Status: waiting for LeetCode login...';
  });
};

// Listen to storage updates to reflect last sync status
chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastSeen) {
    const ts = new Date(changes.lastSeen.newValue).toLocaleTimeString();
    statusEl.textContent = `Status: last synced at ${ts}`;
  }
});

// On load, read lastSeen if any:
chrome.storage.local.get(['lastSeen'], ({ lastSeen }) => {
  if (lastSeen) {
    const ts = new Date(lastSeen).toLocaleTimeString();
    statusEl.textContent = `Status: last synced at ${ts}`;
  }
});