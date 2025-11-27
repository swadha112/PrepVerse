import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const { candidateName, jobRole, jobDesc, yearsExp, resumeText } = req.body;

  // Correct path to Python script (absolute path)
  const scriptPath = path.join(__dirname, '../utils/resume_analyzer_api.py');

  // Get Python interpreter path from environment or fallback to 'python'
  const pythonPath = process.env.PYTHON_PATH || 'python';

  // Spawn Python process using configurable interpreter
  const py = spawn(pythonPath, [scriptPath]);

  let output = '';
  let errorOutput = '';

  py.stdin.write(JSON.stringify({ resumeText, jobDesc, jobRole, yearsExp }));
  py.stdin.end();

  py.stdout.on('data', data => { output += data.toString(); });
  py.stderr.on('data', data => { errorOutput += data.toString(); });

  py.stdout.on('end', () => {
    // Debug logs for troubleshooting
    console.log("RAW Python output:", output);
    console.log("RAW error output:", errorOutput);

    // Only treat as error if stderr contains critical error keywords
    const isCriticalError = /Traceback|Exception|Error/i.test(errorOutput);

    if (isCriticalError && errorOutput.trim() !== '') {
      console.error('Python error:', errorOutput);
      return res.status(500).json({ error: 'Python script failed', details: errorOutput });
    }

    try {
      const analysis = JSON.parse(output);
      res.json(analysis);
    } catch (err) {
      console.error('JSON parse error:', err.message, output);
      res.status(500).json({ error: 'Analysis failed (bad JSON)', details: err.message });
    }
  });

  py.on('error', err => {
    console.error('Failed to spawn Python process:', err.message);
    res.status(500).json({ error: 'Failed to start analysis', details: err.message });
  });
});

export default router;
