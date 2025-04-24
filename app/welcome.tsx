import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from './firebaseConfig';
import AppNavigator from './tabs/AppNavigator';
import AuthScreen from './AuthScreen';
import { useLocalSearchParams } from 'expo-router';

export default function Welcome() {
  const { mode } = useLocalSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(mode !== 'signup');

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch additional user info from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setFirstName(userDoc.data().firstName);
          setLastName(userDoc.data().lastName);
          setPhoneNumber(userDoc.data().phoneNumber);
        }
      }
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleAuthentication = async () => {
    try {
      if (user) {
        // If user is already authenticated, log out
        await signOut(auth);
      } else {
        // Sign in or sign up
        if (isLogin) {
          // Sign in
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          // Sign up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          // Store additional user info in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            firstName,
            lastName,
            phoneNumber,
            email,
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', (error as Error).message);
    }
  };

  return (
    <>
      {user ? (
        // If the user is authenticated, show the tab navigation
        <AppNavigator
          user={user}
          firstName={firstName}
          lastName={lastName}
          phoneNumber={phoneNumber}
          handleAuthentication={handleAuthentication}
        />
      ) : (
        // If the user is not authenticated, show the login/signup screen
        <AuthScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          handleAuthentication={handleAuthentication}
        />
      )}
    </>
  );
} 