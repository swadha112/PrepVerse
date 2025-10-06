import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Static pools used when OPENAI_API_KEY is absent
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

async function nextAIQuestion({ category, topic, history }) {
  // Fallback mode
  if (!openai) {
    const pool = POOLS[category] || POOLS['Resume-based Questions'];
    const asked = new Set(history.map(h => h.q));
    return pool.find(q => !asked.has(q)) || pool[0];
  }

  const sys = `Return STRICT JSON: {"question":"..."}.
- <= 22 words
- Category: ${category}
- Topic: ${topic || 'N/A'}
- Avoid repeating any question in history array (q fields).`;

  const user = { category, topic, history };
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: JSON.stringify(user) }
    ]
  });

  const text = completion.choices?.[0]?.message?.content || '{"question":"Tell me about yourself."}';
  try { return JSON.parse(text).question; } catch { return 'Tell me about yourself.'; }
}

export function initializeInterviewSocket(io) {
  const sessions = new Map();

  io.on('connection', (socket) => {
    sessions.set(socket.id, {
      category: null,
      topic: null,
      history: [],
      index: 0,         // 0..2 for 3 questions
      total: 3
    });

    socket.on('selectCategory', async ({ category, topic }) => {
      sessions.set(socket.id, { category, topic: topic || null, history: [], index: 0, total: 3 });
      const q = await nextAIQuestion({ category, topic, history: [] });
      socket.emit('coachQuestion', { text: q, index: 0, total: 3 });
      socket.emit('feedback', { text: 'Setting up your practice…' });
    });

    socket.on('startRecording', () => {
      socket.emit('feedback', { text: 'Listening… answer naturally and quantify outcomes.' });
    });

    socket.on('stopRecording', () => {
      socket.emit('feedback', { text: 'Stopped. Click “Generate AI Review”.' });
    });

    socket.on('answerSummary', ({ question, transcript, metrics }) => {
      const s = sessions.get(socket.id);
      if (!s) return;
      s.history.push({ q: question, a: transcript, m: metrics });
      sessions.set(socket.id, s);
      // Quick live tip (static, could be AI too)
      socket.emit('review', { quickTip: 'Good start. Add a concrete example and quantify impact.' });
    });

    socket.on('nextQuestion', async () => {
      const s = sessions.get(socket.id);
      if (!s) return;
      s.index = Math.min(s.index + 1, 2);
      sessions.set(socket.id, s);
      const q = await nextAIQuestion({ category: s.category, topic: s.topic, history: s.history });
      socket.emit('coachQuestion', { text: q, index: s.index, total: s.total });
    });

    socket.on('skipQuestion', async () => {
      const s = sessions.get(socket.id);
      if (!s) return;
      s.index = Math.min(s.index + 1, 2);
      sessions.set(socket.id, s);
      const q = await nextAIQuestion({ category: s.category, topic: s.topic, history: s.history });
      socket.emit('coachQuestion', { text: q, index: s.index, total: s.total });
    });

    socket.on('disconnect', () => {
      sessions.delete(socket.id);
    });
  });
}