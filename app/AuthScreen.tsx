import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, DimensionValue } from 'react-native';

// Define the type for the styles
interface Styles {
  container: any;
  logoContainer: any;
  logoText: any;
  tagline: any;
  authContainer: any;
  title: any;
  input: any;
  button: any;
  buttonText: any;
  toggleText: any;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    justifyContent: 'center' as 'center', // Explicitly type as 'center'
    alignItems: 'center' as 'center', // Explicitly type as 'center'
    backgroundColor: '#ffffff', // White background
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center' as 'center', // Explicitly type as 'center'
    marginBottom: 40,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold', // Explicitly type as 'bold'
    color: '#2c3e50', // Dark blue-gray color
  },
  tagline: {
    fontSize: 16,
    color: '#7f8c8d', // Gray color
    textAlign: 'center' as 'center', // Explicitly type as 'center'
    marginTop: 10,
  },
  authContainer: {
    width: '100%' as DimensionValue, // Explicitly type as DimensionValue
    maxWidth: 400,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold' as 'bold', // Explicitly type as 'bold'
    color: '#2c3e50',
    textAlign: 'center' as 'center', // Explicitly type as 'center'
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#bdc3c7', // Light gray border
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f5f6fa', // Light gray background
  },
  button: {
    height: 50,
    backgroundColor: '#3498db', // Blue color
    justifyContent: 'center' as 'center', // Explicitly type as 'center'
    alignItems: 'center' as 'center', // Explicitly type as 'center'
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: '#ffffff', // White text
    fontSize: 16,
    fontWeight: 'bold' as 'bold', // Explicitly type as 'bold'
  },
  toggleText: {
    color: '#3498db', // Blue color
    textAlign: 'center' as 'center', // Explicitly type as 'center'
    fontSize: 14,
  },
});

interface AuthScreenProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  firstName: string;
  setFirstName: (firstName: string) => void;
  lastName: string;
  setLastName: (lastName: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  handleAuthentication: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
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
  handleAuthentication,
}) => {
  return (
    <View style={styles.container}>
      {/* Logo and Tagline */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>MediConnect</Text>
        <Text style={styles.tagline}>Health Authenticator</Text>
        <Text style={styles.tagline}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore</Text>
      </View>

      {/* Auth Form */}
      <View style={styles.authContainer}>
        <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              autoCapitalize="words"
              placeholderTextColor="#7f8c8d"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              autoCapitalize="words"
              placeholderTextColor="#7f8c8d"
            />
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#7f8c8d"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          placeholderTextColor="#7f8c8d"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor="#7f8c8d"
        />

        <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
          <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthScreen;