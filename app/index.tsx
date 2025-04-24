import React, { useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from '@firebase/auth'; // Import Firebase auth functions
import { getFirestore, doc, setDoc, getDoc } from '@firebase/firestore'; // Import Firestore functions
import { app } from './firebaseConfig';
import AppNavigator from './tabs/AppNavigator';
import AuthScreen from './AuthScreen';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MediConnect</Text>
        <Text style={styles.tagline}>Your Health, Our Priority</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.signInButton]} 
          onPress={() => router.push('/welcome?mode=signin')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.signUpButton]}
          onPress={() => router.push('/welcome?mode=signup')}
        >
          <Text style={[styles.buttonText, styles.signUpText]}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#002B5B', // MediConnect navy blue
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#002B5B', // MediConnect navy blue
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#002B5B', // MediConnect navy blue
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpText: {
    color: '#002B5B', // MediConnect navy blue
  },
});