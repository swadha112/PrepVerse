import express from 'express';
import multer from 'multer';
import { admin } from '../firebaseAdmin.js';

const db = admin.firestore();
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /api/resumeAnalyzer/analyze
router.post('/analyze', upload.single('resumeFile'), async (req, res) => {
  try {
    const { candidateName, jobRole, jobDesc, yearsExp } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Resume file missing' });
    }

    // Dummy/static analysis for MVP
    const analysis = {
      atsScore: 88,
      issues: 25,
      breakdown: {
        toneAndStyle: 55,
        content: 25,
        structure: 70,
        skills: 32,
      },
      skillsMatched: ['Python', 'React', 'APIs'],
      skillsMissing: ['Docker', 'CI/CD', 'AWS'],
    };

    // Save to Firestore (optional for your demo)
    await db.collection('resumeAnalyses').add({
      candidateName,
      jobRole,
      jobDesc,
      yearsExp,
      analysis,
      createdAt: new Date(),
    });

    // Send analysis JSON to frontend
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
