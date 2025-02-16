import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { User } from '@firebase/auth';

const styles = StyleSheet.create({
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});

interface ProfileScreenProps {
  user: User | null; // Allow user to be null
  firstName: string;
  lastName: string;
  phoneNumber: string;
  handleAuthentication: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  firstName,
  lastName,
  phoneNumber,
  handleAuthentication,
}) => {
  // Check if user is defined before accessing its properties
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>No User Found</Text>
        <Button title="Go to Login" onPress={handleAuthentication} color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.userInfoText}>Name: {firstName} {lastName}</Text>
      <Text style={styles.emailText}>Email: {user.email}</Text>
      <Text style={styles.userInfoText}>Phone Number: {phoneNumber}</Text>
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};

export default ProfileScreen;