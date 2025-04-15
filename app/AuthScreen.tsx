import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, DimensionValue } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SignUpScreen from './SignUpScreen';

// Define the type for the styles
interface Styles {
  container: any;
  backButton: any;
  mainContent: any;
  title: any;
  subtitle: any;
  inputLabel: any;
  input: any;
  inputContainer: any;
  showPasswordButton: any;
  forgetPassword: any;
  button: any;
  buttonText: any;
  socialContainer: any;
  socialText: any;
  socialButtonsContainer: any;
  socialButton: any;
  signUpContainer: any;
  signUpText: any;
  signUpLink: any;
  orText: any;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  mainContent: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  showPasswordButton: {
    position: 'absolute' as const,
    right: 16,
    top: 12,
  },
  forgetPassword: {
    alignSelf: 'flex-end' as const,
    color: '#0066FF',
    fontSize: 14,
    marginBottom: 24,
  },
  button: {
    height: 50,
    backgroundColor: '#0066FF',
    borderRadius: 25,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  socialContainer: {
    alignItems: 'center' as const,
  },
  socialText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  signUpContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: 24,
  },
  signUpText: {
    color: '#666666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#0066FF',
    fontSize: 14,
    marginLeft: 4,
  },
  orText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
});

interface AuthScreenProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleAuthentication: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  handleAuthentication,
}) => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignUp = (data: {
    fullName: string;
    password: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
  }) => {
    // Handle sign up logic here
    console.log('Sign up data:', data);
  };

  if (isSignUp) {
    return (
      <SignUpScreen
        onBack={() => setIsSignUp(false)}
        onSignUp={handleSignUp}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>

      <View style={styles.mainContent}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="***************"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon 
              name={showPassword ? "visibility-off" : "visibility"} 
              size={24} 
              color="#666666" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Text style={styles.forgetPassword}>Forget Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or sign up with</Text>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={20} color="#4267B2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <MaterialCommunityIcons name="fingerprint" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => setIsSignUp(true)}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AuthScreen;