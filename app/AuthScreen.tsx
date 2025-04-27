import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from './firebaseConfig';

interface AuthScreenProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  firstName: string;
  setFirstName: Dispatch<SetStateAction<string>>;
  lastName: string;
  setLastName: Dispatch<SetStateAction<string>>;
  phoneNumber: string;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
  isLogin: boolean;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
  handleAuthentication: () => Promise<void>;
}

export default function AuthScreen({
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phoneNumber,
  setPhoneNumber,
  isLogin,
  setIsLogin,
  handleAuthentication
}: AuthScreenProps) {
  const router = useRouter();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      setIsResettingPassword(true);
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
            </Text>
          </View>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder={isLogin ? "Enter your password" : "Create a strong password"}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={isResettingPassword}
            >
              <Text style={styles.forgotPasswordText}>
                {isResettingPassword ? 'Sending reset email...' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, isResettingPassword && styles.disabledButton]} 
            onPress={handleAuthentication}
            disabled={isResettingPassword}
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Login' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={isResettingPassword}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#002B5B',
    fontWeight: '600',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#002B5B',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#002B5B',
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#002B5B',
    fontSize: 14,
  },
}); 