import { admin } from '../firebaseAdmin.js';


export async function requireFirebaseAuth(req, res, next) {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ error: 'No token' });
try {
const decoded = await admin.auth().verifyIdToken(token);
req.user = decoded; // contains uid, email, etc.
return next();
} catch (e) {
return res.status(401).json({ error: 'Invalid token' });
}
}