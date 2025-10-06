import admin from 'firebase-admin';
import fs from 'fs';

// Debug Print your env variable and file existence
console.log("GOOGLE_APPLICATION_CREDENTIALS=", process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const exists = fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log("File exists?", exists);
  if (exists) {
    const content = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    const json = JSON.parse(content);
    console.log("project_id: ", json.project_id);
  }
}

function initFromEnv() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(json) });
    return;
  }
  // else fallback to GOOGLE_APPLICATION_CREDENTIALS env var
  admin.initializeApp();
}

if (!admin.apps.length) initFromEnv();

export { admin };
