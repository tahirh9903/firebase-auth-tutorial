import { initializeApp } from '@firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyDaMNgofgnJCciKchPzeBQebRx01dU4_4k",
  authDomain: "fir-auth-tutorial-9a8a7.firebaseapp.com",
  projectId: "fir-auth-tutorial-9a8a7",
  storageBucket: "fir-auth-tutorial-9a8a7.firebasestorage.app",
  messagingSenderId: "371335720376",
  appId: "1:371335720376:web:1a5e510e4d908c0d58f34d"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);