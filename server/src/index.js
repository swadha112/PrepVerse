import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requireFirebaseAuth } from './middleware/requireFirebaseAuth.js';
import resumeAnalyzerRouter from './routes/resumeAnalyzer.js';


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    // 1) allow requests with no origin (e.g. curl, mobile, extension background)
    if (!origin) return callback(null, true);
    // 2) allow the React front-end
    if (origin === 'http://localhost:5173') return callback(null, true);
    // 3) allow any chrome-extension:// origin
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // 4) otherwise block
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,        // so cookies & auth headers work
  methods: ['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
import leetcodeConnect from './routes/leetcodeConnect.js';
import leetcodeProfile from './routes/leetcodeProfile.js';
app.use('/api/resumeAnalyzer', resumeAnalyzerRouter);

app.use('/api/leetcode', requireFirebaseAuth, leetcodeConnect);
app.use('/api/leetcode', requireFirebaseAuth, leetcodeProfile);
app.post('/api/leetcode/stats', (req, res) => {
  const { source, username, profile, solved, fetchedAt } = req.body || {};
  const ts = new Date(fetchedAt || Date.now()).toISOString();

  console.log('--- /api/leetcode/stats ---');
  console.log('ts       :', ts);
  console.log('source   :', source);
  console.log('username :', username);
  console.log('solved   :', solved);
  console.log('profile  :', profile);
  console.log('----------------------------');

  // store it somewhere if you want; here we just ACK
  return res.json({ ok: true, stored: false });
});

app.listen(4000, () => console.log('Stats sink up on http://localhost:4000'));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));