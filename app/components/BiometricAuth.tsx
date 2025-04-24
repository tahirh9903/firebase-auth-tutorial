import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricAuthProps {
  onAuthenticate: () => void;
  onSkip: () => void;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthenticate, onSkip }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          authenticateUser();
        } else {
          Alert.alert(
            'Biometric Record Not Found',
            'Please verify your identity with your password',
            [{ text: 'OK', onPress: onSkip }]
          );
        }
      } else {
        onSkip();
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      onSkip();
    } finally {
      setIsChecking(false);
    }
  };

  const authenticateUser = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use password instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onAuthenticate();
      } else {
        // If authentication fails or user cancels, fall back to password
        onSkip();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      onSkip();
    }
  };

  return (
    <View style={styles.container}>
      {isChecking && <ActivityIndicator size="large" color="#0066FF" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default BiometricAuth; 