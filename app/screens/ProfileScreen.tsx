import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getAuth, updateProfile, updateEmail, updatePassword, User } from '@firebase/auth';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import { db } from '../firebaseConfig';
import { useAccessibility } from '../context/AccessibilityContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProfileScreenProps {
  user: User | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  handleAuthentication: () => void;
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserProfile'>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, firstName, lastName, phoneNumber: initialPhoneNumber, handleAuthentication, navigation }) => {
  const { isDarkMode, textSize } = useAccessibility();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [address, setAddress] = useState('');
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          setDisplayName(user.displayName || '');
          setEmail(user.email || '');
          setProfilePhotoURL(user.photoURL);
          
          // Fetch additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setPhoneNumber(userData.phoneNumber || '');
            setAddress(userData.address || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Update profile
      if (displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName });
      }

      // Update email
      if (email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }

      // Update additional user data in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        phoneNumber,
        address,
      });

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profile_photos/${currentUser.uid}`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update profile
      await updateProfile(currentUser, { photoURL: downloadURL });
      setProfilePhotoURL(downloadURL);

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL,
      });

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Dynamic colors based on dark mode
  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  const headerBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444444' : '#ddd';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const inputBackgroundColor = isDarkMode ? '#2a2a2a' : '#fff';
  const inputBorderColor = isDarkMode ? '#444444' : '#ddd';
  const buttonBackgroundColor = isDarkMode ? '#0066cc' : '#50cebb';
  const cancelButtonBackgroundColor = isDarkMode ? '#444444' : '#ddd';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <Text style={[styles.headerTitle, { color: textColor, fontSize: 24 * textSize }]}>Profile</Text>
        </View>

        <View style={[styles.profileContainer, { backgroundColor: cardBackgroundColor }]}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : profilePhotoURL ? (
              <Image
                source={{ uri: profilePhotoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Text style={styles.profileImagePlaceholderText}>
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Icon name="camera-alt" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }]}
                placeholder="Display Name"
                placeholderTextColor={secondaryTextColor}
                value={displayName}
                onChangeText={setDisplayName}
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }]}
                placeholder="Email"
                placeholderTextColor={secondaryTextColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }]}
                placeholder="Phone Number"
                placeholderTextColor={secondaryTextColor}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                  color: textColor
                }]}
                placeholder="Address"
                placeholderTextColor={secondaryTextColor}
                value={address}
                onChangeText={setAddress}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: cancelButtonBackgroundColor }]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: textColor, fontSize: 24 * textSize }]}>{user?.displayName || 'No name set'}</Text>
              <Text style={[styles.email, { color: secondaryTextColor, fontSize: 16 * textSize }]}>{user?.email}</Text>
              {phoneNumber && (
                <Text style={[styles.info, { color: secondaryTextColor, fontSize: 16 * textSize }]}>Phone: {phoneNumber}</Text>
              )}
              {address && (
                <Text style={[styles.info, { color: secondaryTextColor, fontSize: 16 * textSize }]}>Address: {address}</Text>
              )}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: buttonBackgroundColor }]}
                onPress={() => setEditing(true)}
              >
                <Text style={[styles.editButtonText, { color: textColor }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.settingsContainer, { backgroundColor: cardBackgroundColor }]}>
          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomColor: borderColor }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={[styles.settingsText, { color: textColor, fontSize: 16 * textSize }]}>Settings</Text>
            <Text style={[styles.settingsArrow, { color: secondaryTextColor, fontSize: 16 * textSize }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomColor: borderColor }]}
            onPress={() => navigation.navigate('PasswordManager')}
          >
            <Text style={[styles.settingsText, { color: textColor, fontSize: 16 * textSize }]}>Password Manager</Text>
            <Text style={[styles.settingsArrow, { color: secondaryTextColor, fontSize: 16 * textSize }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomColor: borderColor }]}
            onPress={() => navigation.navigate('PaymentMethod')}
          >
            <Text style={[styles.settingsText, { color: textColor, fontSize: 16 * textSize }]}>Payment Method</Text>
            <Text style={[styles.settingsArrow, { color: secondaryTextColor, fontSize: 16 * textSize }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomColor: borderColor }]}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={[styles.settingsText, { color: textColor, fontSize: 16 * textSize }]}>Privacy Policy</Text>
            <Text style={[styles.settingsArrow, { color: secondaryTextColor, fontSize: 16 * textSize }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsItem, { borderBottomColor: borderColor }]}
            onPress={handleAuthentication}
          >
            <Text style={[styles.settingsText, { color: '#FF3B30', fontSize: 16 * textSize }]}>Logout</Text>
            <Text style={[styles.settingsArrow, { color: '#FF3B30', fontSize: 16 * textSize }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editForm: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
  },
  editButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  settingsContainer: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingsText: {
    fontSize: 16,
  },
  settingsArrow: {
    fontSize: 16,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0066FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default ProfileScreen; 