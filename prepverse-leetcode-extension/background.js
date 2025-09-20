// background.js
// Automatically grabs LeetCode cookies when a leetcode.com tab finishes loading
// and POSTs them to your backend at /api/leetcode/connect

const BACKEND = "http://localhost:4000"; // ← your backend URL

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url?.startsWith('https://leetcode.com')
  ) {
    chrome.cookies.get(
      { url: 'https://leetcode.com', name: 'LEETCODE_SESSION' },
      (sessionCookie) => {
        chrome.cookies.get(
          { url: 'https://leetcode.com', name: 'csrftoken' },
          (csrfCookie) => {
            if (sessionCookie?.value && csrfCookie?.value) {
              const session = sessionCookie.value;
              const csrf    = csrfCookie.value;

              // Store locally for debugging (optional)
              chrome.storage.local.set({
                lcSession: session,
                lcCSRFT:   csrf,
                lastSeen:  Date.now()
              });

              // Auto-sync to backend
              fetch(`${BACKEND}/api/leetcode/connect`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sessionCookie: session,
                  csrfToken:     csrf
                })
              })
              .then(res => {
                if (!res.ok) {
                  console.error('LeetCode-connect failed:', res.statusText);
                } else {
                  console.log('✅ LeetCode creds synced to backend');
                }
              })
              .catch(err => {
                console.error('❌ Error syncing to backend:', err);
              });
            }
          }
        );
      }
    );
  }
});