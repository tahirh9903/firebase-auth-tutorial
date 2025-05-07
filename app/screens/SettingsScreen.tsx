import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useAccessibility } from '../context/AccessibilityContext';

type SettingsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const { isDarkMode, textSize, setDarkMode, setTextSize } = useAccessibility();
  const router = useRouter();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const route = useRoute();
  const initialTab = (route.params as any)?.initialTab;

  useEffect(() => {
    checkBiometricSettings();
    loadNotificationSettings();
    loadAccessibilitySettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.enabled);
        setEmailNotifications(parsed.email);
        setAppointmentReminders(parsed.appointments);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const settings = {
        enabled: notificationsEnabled,
        email: emailNotifications,
        appointments: appointmentReminders,
      };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const checkBiometricSettings = async () => {
    try {
      // Check if device supports biometric
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      // Get saved preference
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error checking biometric settings:', error);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    try {
      if (value && isBiometricSupported) {
        // Check if biometrics are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
          Alert.alert(
            'Biometric Record Not Found',
            'Please set up fingerprint or Face ID on your device first.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Verify biometric before enabling
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify to enable biometric login',
          fallbackLabel: 'Use password',
        });

        if (result.success) {
          await AsyncStorage.setItem('biometricEnabled', 'true');
          setIsBiometricEnabled(true);
        }
      } else {
        await AsyncStorage.setItem('biometricEnabled', 'false');
        setIsBiometricEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const loadAccessibilitySettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('accessibilitySettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode);
        setTextSize(parsed.textSize);
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const saveAccessibilitySettings = async () => {
    try {
      const settings = {
        darkMode: isDarkMode,
        textSize: textSize,
      };
      await AsyncStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const settingsOptions = [
    {
      icon: <MaterialCommunityIcons name="key-outline" size={24} color="#0066FF" />,
      title: 'Password Manager',
      onPress: () => navigation.navigate('PasswordManager'),
    },
    {
      icon: <MaterialCommunityIcons name="account-remove-outline" size={24} color="#0066FF" />,
      title: 'Delete Account',
      onPress: () => {},
    },
  ];

  useEffect(() => {
    if (initialTab === 'notifications') {
      // Scroll to notifications section if needed
      // You could implement this with a ref if you want to scroll to the section
    }
  }, [initialTab]);

  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#FFFFFF';
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : '#F8F8F8';
  const subCardBackgroundColor = isDarkMode ? '#333333' : '#FAFAFA';
  const borderColor = isDarkMode ? '#444444' : '#F5F6FA';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>Notifications</Text>
          <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                Receive notifications about appointments and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveNotificationSettings();
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={[styles.settingItem, styles.settingSubItem, { backgroundColor: subCardBackgroundColor }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: textColor }]}>Email Notifications</Text>
                  <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                    Receive updates via email
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={(value) => {
                    setEmailNotifications(value);
                    saveNotificationSettings();
                  }}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={emailNotifications ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>

              <View style={[styles.settingItem, styles.settingSubItem, { backgroundColor: subCardBackgroundColor }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: textColor }]}>Appointment Reminders</Text>
                  <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                    Get reminded about upcoming appointments
                  </Text>
                </View>
                <Switch
                  value={appointmentReminders}
                  onValueChange={(value) => {
                    setAppointmentReminders(value);
                    saveNotificationSettings();
                  }}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={appointmentReminders ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>Security</Text>
          <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>Biometric Login</Text>
              <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                {isBiometricSupported 
                  ? 'Use Face ID or Fingerprint for login' 
                  : 'Your device does not support biometric authentication'}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!isBiometricSupported}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isBiometricEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>Accessibility</Text>
          
          <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                Switch between light and dark theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>Text Size</Text>
              <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                Adjust the size of text throughout the app
              </Text>
            </View>
          </View>
          
          <View style={[styles.sliderContainer, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>Small</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.8}
              maximumValue={1.4}
              value={textSize}
              onValueChange={setTextSize}
              minimumTrackTintColor="#0066FF"
              maximumTrackTintColor={isDarkMode ? '#666666' : '#E0E0E0'}
              thumbTintColor="#0066FF"
            />
            <Text style={[styles.sliderLabel, { color: secondaryTextColor }]}>Large</Text>
          </View>
        </View>

        <View style={styles.content}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionItem, { borderBottomColor: borderColor }]}
              onPress={option.onPress}
            >
              <View style={[styles.optionIconContainer, { backgroundColor: cardBackgroundColor }]}>
                {option.icon}
              </View>
              <Text style={[styles.optionText, { color: textColor }]}>{option.title}</Text>
              <Icon name="chevron-right" size={24} color={secondaryTextColor} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  settingSubItem: {
    marginTop: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
});

export default SettingsScreen; 