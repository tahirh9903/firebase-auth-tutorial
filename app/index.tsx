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
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function IntroScreen() {
  const router = useRouter();
  const [logoSize] = useState(new Animated.Value(1));
  const [buttonOpacity] = useState(new Animated.Value(0));
  const [buttonTranslateY] = useState(new Animated.Value(50));

  useEffect(() => {
    // Start the animation sequence
    Animated.sequence([
      // Add a 2 second delay before starting animations
      Animated.delay(2000),
      // First, shrink the logo
      Animated.timing(logoSize, {
        toValue: 0.7,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Then, fade in and slide up the buttons
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={[
          styles.logoWrapper,
          {
            transform: [{ scale: logoSize }]
          }
        ]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        </Animated.View>
        <Text style={styles.tagline}>Your Health, Our Priority</Text>
      </View>

      <Animated.View style={[
        styles.buttonContainer,
        {
          opacity: buttonOpacity,
          transform: [{ translateY: buttonTranslateY }]
        }
      ]}>
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
      </Animated.View>
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
    minHeight: 400,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
    height: 250,
  },
  logo: {
    width: '100%',
    height: '100%',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
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
    backgroundColor: '#002B5B',
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#002B5B',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpText: {
    color: '#002B5B',
  },
});