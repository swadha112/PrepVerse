import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requireFirebaseAuth } from './middleware/requireFirebaseAuth.js';


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  

app.get('/api/health', (_req, res) => res.json({ ok: true }));


// Example protected route
app.get('/api/me', requireFirebaseAuth, (req, res) => {
const { uid, email, name, picture } = req.user;
res.json({ uid, email, name, picture });
});


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));