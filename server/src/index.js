import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import { requireFirebaseAuth } from './middleware/requireFirebaseAuth.js';
import resumeAnalyzerRouter from './routes/resumeAnalyzer.js';
import leetcodeRouter from './routes/leetcodeRoutes.js';
import interviewCoachRouter from './routes/interviewCoach.js';
import { initializeInterviewSocket } from './socket/interviewSocket.js';

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === 'http://localhost:5173') return callback(null, true);
      if (origin.startsWith('chrome-extension://')) return callback(null, true);
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// CORS setup for frontend dev and Chrome extensions
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === 'http://localhost:5173') return callback(null, true);
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Primary API routes (modular)
app.use('/api/resumeAnalyzer', resumeAnalyzerRouter);
app.use('/api/interviewCoach', interviewCoachRouter);
app.use('/api', leetcodeRouter);

// If you want to restore firebase-auth protected Leetcode routes, you may uncomment these lines:
/*
import leetcodeConnect from './routes/leetcodeConnect.js';
import leetcodeProfile from './routes/leetcodeProfile.js';
app.use('/api/leetcode', requireFirebaseAuth, leetcodeConnect);
app.use('/api/leetcode', requireFirebaseAuth, leetcodeProfile);

app.post('/api/leetcode/stats', (req, res) => {
  const { source, username, profile, solved, fetchedAt } = req.body || {};
  const ts = new Date(fetchedAt || Date.now()).toISOString();

  console.log('--- /api/leetcode/stats ---');
  console.log('ts :', ts);
  console.log('source :', source);
  console.log('username :', username);
  console.log('solved :', solved);
  console.log('profile :', profile);
  console.log('----------------------------');

  return res.json({ ok: true, stored: false });
});
*/

// Socket.IO live interview features
initializeInterviewSocket(io);

const port = process.env.PORT || 4000;
server.listen(port, () =>
  console.log(`API + Socket.IO on http://localhost:${port}`)
);
