function readCookie(name) {
    return document.cookie
      .split(";")
      .map(c => c.trim())
      .find(c => c.startsWith(name + "="))
      ?.split("=")[1];
  }
  
  async function fetchRecentAccepted(username) {
    const csrf = readCookie("csrftoken");
    const query = `
      query recentAc($username: String!) {
        recentAcSubmissionList(username: $username, limit: 50) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;
    const headers = { "content-type": "application/json", "referer": "https://leetcode.com" };
    if (csrf) headers["x-csrftoken"] = csrf;
  
    // Try to infer username if not supplied
    let variables = { username };
    if (!variables.username) {
      const a = document.querySelector('a[href^="/u/"]');
      if (a) variables.username = a.getAttribute("href").split("/").filter(Boolean)[1];
    }
    if (!variables.username) throw new Error("Cannot determine LeetCode username. Visit your profile once.");
  
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      credentials: "include", // attaches cookies automatically
      headers,
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`LeetCode ${res.status}`);
    const json = await res.json();
    const list = json?.data?.recentAcSubmissionList || [];
    return list.map(x => ({
      submission_id: x.id,
      problem_slug: x.titleSlug,
      status: "Accepted",
      lang: null,
      runtime_ms: null,
      ts: new Date(parseInt(x.timestamp, 10) * 1000).toISOString(),
      source: "leetcode"
    }));
  }
  
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      if (msg?.type === "PV_FETCH_RECENT_AC") {
        try { sendResponse({ items: await fetchRecentAccepted(msg.username) }); }
        catch (e) { sendResponse({ error: e.message || "fetch failed" }); }
      }
    })();
    return true;
  });
  