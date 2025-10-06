import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function fallbackReview(transcript, metrics) {
  const fillers = metrics?.fillers ?? 0;
  const wpm = metrics?.wpm ?? 0;
  const fluency = metrics?.fluency ?? 0;

  return {
    accuracy: 3,
    relevance: 4,
    depth: 3,
    what_went_well: [
      "Clear structure; stayed on-topic.",
      "Used relevant domain keywords.",
      "Good speaking pace."
    ],
    improvements: [
      "Add concrete metrics and outcomes.",
      "Mention trade-offs and decisions.",
      "Tighten intro and close with a takeaway."
    ],
    upgraded_answer: "I led the X initiative where we adopted Y architecture (A+B+C) to reduce latency and improve reliability. I chose A for ..., B for ..., and mitigated risk with .... Over 3 months, we cut p95 latency by 22% and reduced compute cost by 15%.",
    drills: [
      "Record a 60s STAR answer; cut 25% words while preserving meaning.",
      "Answer with two trade-offs and justify one.",
      "Summarize answer into a 20s elevator pitch."
    ],
    delivery_feedback: {
      wpm, fillers, fluency,
      coaching: [
        "Target 130–160 WPM with brief pauses after key points.",
        "Keep fillers <4/min; pre-plan a 3-bullet outline.",
        "Lead with result, then decisions and trade-offs."
      ]
    }
  };
}

// POST /api/interviewCoach/review
router.post('/review', async (req, res) => {
  try {
    const { category, topic, question, transcript, metrics } = req.body || {};
    if (!transcript) return res.status(400).json({ error: 'no_transcript' });

    if (!openai) return res.json(fallbackReview(transcript, metrics));

    const sys = `You are a rigorous interview coach. Return STRICT JSON:
{
 "accuracy": 0-5,
 "relevance": 0-5,
 "depth": 0-5,
 "what_went_well": [3 bullets],
 "improvements": [3 bullets],
 "upgraded_answer": "<=220 words, concise, concrete, quantified>",
 "drills": [3 short tasks],
 "delivery_feedback": {
   "wpm": number,
   "fillers": number,
   "fluency": 0-100,
   "coaching": [3 bullets referencing these metrics]
 }
}
Keep upgraded_answer actionable with metrics and trade-offs.`;

    const user = { category, topic, question, transcript, metrics };
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify(user) }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '{}';
    let json;
    try { json = JSON.parse(text); } catch { json = fallbackReview(transcript, metrics); }
    return res.json(json);
  } catch (e) {
    console.error('[review]', e);
    return res.status(500).json({ error: 'review_failed', message: String(e?.message || e) });
  }
});

export default router;