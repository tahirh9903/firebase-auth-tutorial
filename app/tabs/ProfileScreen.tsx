import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User } from '@firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';

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
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#50cebb',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

interface ProfileScreenProps {
  user: User | null;
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
  const [uploading, setUploading] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().photoURL) {
            setProfilePhotoURL(userDoc.data().photoURL);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);
    try {
      console.log('Starting upload process...');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Blob created');
      
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      console.log('Storage reference created:', storageRef);
      
      console.log('Attempting to upload...');
      await uploadBytes(storageRef, blob);
      console.log('Upload successful');
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL obtained:', downloadURL);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
      });
      console.log('Firestore updated');

      alert('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Detailed error:', error.code, error.message);
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

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
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        <Image
          source={profilePhotoURL ? { uri: profilePhotoURL } : { uri: 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <View style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Change Profile Picture'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.userInfoText}>Name: {firstName} {lastName}</Text>
      <Text style={styles.emailText}>Email: {user.email}</Text>
      <Text style={styles.userInfoText}>Phone Number: {phoneNumber}</Text>
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};

export default ProfileScreen;