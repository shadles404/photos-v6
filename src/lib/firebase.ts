// Initialize Firebase with the correct config
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCtOrEY6QRLkhACi-B9C1q95l-dmz2XjFA",
  authDomain: "photo.meycus.eu.org",
  projectId: "photo-meycus",
  storageBucket: "photo-meycus.appspot.com",
  messagingSenderId: "658821971471",
  appId: "1:658821971471:web:094c2eeb37b853ecb36d7a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);