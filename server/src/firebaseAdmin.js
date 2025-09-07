import admin from 'firebase-admin';


function initFromEnv() {
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (b64) {
const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(json) });
return;
}
// else fall back to GOOGLE_APPLICATION_CREDENTIALS
admin.initializeApp();
}


if (!admin.apps.length) initFromEnv();


export { admin };