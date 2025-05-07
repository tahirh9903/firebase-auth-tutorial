import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDaMNgofgnJCciKchPzeBQebRx01dU4_4k",
  authDomain: "fir-auth-tutorial-9a8a7.firebaseapp.com",
  projectId: "fir-auth-tutorial-9a8a7",
  storageBucket: "fir-auth-tutorial-9a8a7.firebasestorage.app",
  messagingSenderId: "371335720376",
  appId: "1:371335720376:web:1a5e510e4d908c0d58f34d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, db, storage, auth };

// Add default export
export default { app, db, storage, auth };