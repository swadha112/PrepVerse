import OpenAI from 'openai';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// -------------------------------
// TOKENIZER (js-tiktoken)
// -------------------------------
const tiktoken = require("js-tiktoken");

let enc;

(async () => {
  try {
    enc = await tiktoken.getEncoding("cl100k_base");
    console.log("Tokenizer loaded ✔ (cl100k_base)");
  } catch (err) {
    console.error("Tokenizer failed to load:", err);
  }
})();

const MAX_TOKENS_ALLOWED = 8000;

function countTokens(input) {
  if (!enc) return 0;
  const text = typeof input === "string" ? input : JSON.stringify(input);
  return enc.encode(text).length;
}

// -------------------------------
// OPENAI
// -------------------------------
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// -------------------------------
// QUESTION POOLS
// -------------------------------
const POOLS = {
  'Resume-based Questions': [
    'Walk me through your resume in 60 seconds.',
    'Pick one project from your resume and explain the architecture.',
    'What was a challenging bug you fixed recently and how did you resolve it?'
  ],
  'Technical Interview': [
    'Explain time and space complexity of QuickSort.',
    'How does HTTP keep-alive work and why is it useful?',
    'What is the difference between a process and a thread?'
  ],
  'HR Interview': [
    'Tell me about a significant challenge you faced at work.',
    'Why should we hire you for this role?',
    'Describe a situation where you demonstrated leadership.'
  ],
  'Group Discussion': [
    'Remote work vs office work — which is better and why?',
    'AI replacing jobs: opportunity or threat?',
    'Should social media platforms be regulated more strictly?'
  ]
};

// -------------------------------
// AI NEXT QUESTION
// -------------------------------
async function nextAIQuestion({ category, topic, history }) {

  if (!openai) {
    const pool = POOLS[category] || POOLS['Resume-based Questions'];
    const asked = new Set(history.map(h => h.q));
    return pool.find(q => !asked.has(q)) || pool[0];
  }

  const sys = `Return STRICT JSON: {"question":"..."}.
- <= 22 words
- Category: ${category}
- Topic: ${topic || 'N/A'}
- Avoid repeating questions in history (q fields).`;

  const user = { category, topic, history };
  let promptTokens = countTokens(sys) + countTokens(user);

  while (history.length > 0 && promptTokens > MAX_TOKENS_ALLOWED) {
    history.shift();
    user.history = history;
    promptTokens = countTokens(sys) + countTokens(user);
  }

  if (promptTokens > MAX_TOKENS_ALLOWED) {
    return "Prompt too large. Please restart the practice session.";
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) }
    ]
  });

  const text =
    completion.choices?.[0]?.message?.content ||
    '{"question":"Tell me about yourself."}';

  try {
    return JSON.parse(text).question;
  } catch {
    return "Tell me about yourself.";
  }
}


// -------------------------------
// SOCKET LOGIC (UPDATED)
// -------------------------------
export function initializeInterviewSocket(io) {
  const sessions = new Map();

  io.on("connection", (socket) => {

    // Each interview session
    sessions.set(socket.id, {
      category: null,
      topic: null,
      history: [],
      index: 0,
      total: 3,

      // 🎯 NEW: Track eye-contact metrics for the current question
      eyeSamples: [],
      yawSamples: [],
      pitchSamples: []
    });

    // User chooses a category
    socket.on("selectCategory", async ({ category, topic }) => {
      sessions.set(socket.id, {
        category,
        topic: topic || null,
        history: [],
        index: 0,
        total: 3,
        eyeSamples: [],
        yawSamples: [],
        pitchSamples: []
      });

      const q = await nextAIQuestion({ category, topic, history: [] });
      socket.emit("coachQuestion", { text: q, index: 0, total: 3 });
      socket.emit("feedback", { text: "Setting up your practice…" });
    });

    // Start
    socket.on("startRecording", () => {
      const s = sessions.get(socket.id);
      if (!s) return;

      s.eyeSamples = [];
      s.yawSamples = [];
      s.pitchSamples = [];
      sessions.set(socket.id, s);

      socket.emit("feedback", { text: "Listening…" });
    });

    // Stop
    socket.on("stopRecording", () => {
      socket.emit("feedback", { text: "Stopped. Click “Generate AI Review”." });
    });

    // 🎯 NEW — Real-time EyeContact data from frontend
    socket.on("eyeMetrics", ({ eyeContact, yaw, pitch }) => {
      const s = sessions.get(socket.id);
      if (!s) return;

      // Push rolling samples
      if (typeof eyeContact === "number") s.eyeSamples.push(eyeContact);
      if (typeof yaw === "number") s.yawSamples.push(yaw);
      if (typeof pitch === "number") s.pitchSamples.push(pitch);

      sessions.set(socket.id, s);
    });

    // Receive summary of answer
    socket.on("answerSummary", ({ question, transcript, metrics }) => {
      const s = sessions.get(socket.id);
      if (!s) return;

      // 🎯 Compute average camera metrics
      const avg = (arr) =>
        arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

      const eyeAvg = avg(s.eyeSamples);
      const yawAvg = avg(s.yawSamples);
      const pitchAvg = avg(s.pitchSamples);

      const enrichedMetrics = {
        ...metrics,
        eyeContact: eyeAvg,
        yaw: yawAvg,
        pitch: pitchAvg
      };

      s.history.push({
        q: question,
        a: transcript,
        m: enrichedMetrics
      });

      sessions.set(socket.id, s);

      socket.emit("review", {
        quickTip:
          "Good start. Try maintaining steady eye-contact with the lens and quantify your impact."
      });
    });

    // Next
    socket.on("nextQuestion", async () => {
      const s = sessions.get(socket.id);
      if (!s) return;

      s.index = Math.min(s.index + 1, 2);
      s.eyeSamples = [];
      s.yawSamples = [];
      s.pitchSamples = [];
      sessions.set(socket.id, s);

      const q = await nextAIQuestion({
        category: s.category,
        topic: s.topic,
        history: s.history
      });

      socket.emit("coachQuestion", {
        text: q,
        index: s.index,
        total: s.total
      });
    });

    // Skip
    socket.on("skipQuestion", async () => {
      const s = sessions.get(socket.id);
      if (!s) return;

      s.index = Math.min(s.index + 1, 2);
      s.eyeSamples = [];
      s.yawSamples = [];
      s.pitchSamples = [];
      sessions.set(socket.id, s);

      const q = await nextAIQuestion({
        category: s.category,
        topic: s.topic,
        history: s.history
      });

      socket.emit("coachQuestion", {
        text: q,
        index: s.index,
        total: s.total
      });
    });

    // Cleanup
    socket.on("disconnect", () => {
      sessions.delete(socket.id);
    });
  });
}
