import axios from 'axios';
import { auth } from '../firebase';
import { onIdTokenChanged, getIdToken } from 'firebase/auth';


export const api = axios.create({ baseURL: 'http://localhost:4000/api' });


async function setTokenHeader(user) {
if (!user) {
delete api.defaults.headers.common['Authorization'];
return;
}
const token = await getIdToken(user, /*forceRefresh*/ false);
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}


// keep header updated when token refreshes
onIdTokenChanged(auth, (user) => { setTokenHeader(user); });