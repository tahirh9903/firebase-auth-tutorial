import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface PasswordManagerScreenProps {
  onBack: () => void;
}

const PasswordManagerScreen: React.FC<PasswordManagerScreenProps> = ({ onBack }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password should be at least 6 characters long');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      Alert.alert('Error', 'No user is currently signed in');
      return;
    }

    try {
      // First, reauthenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Then update the password
      await updatePassword(user, newPassword);
      
      Alert.alert('Success', 'Password updated successfully', [
        { text: 'OK', onPress: onBack }
      ]);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Manager</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#CCCCCC"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showNewPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#CCCCCC"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#CCCCCC"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    color: '#0066FF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  changePasswordButton: {
    backgroundColor: '#0066FF',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  changePasswordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PasswordManagerScreen; 