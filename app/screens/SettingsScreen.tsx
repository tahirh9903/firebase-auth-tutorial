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
  const router = useRouter();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const route = useRoute();
  const initialTab = (route.params as any)?.initialTab;

  useEffect(() => {
    checkBiometricSettings();
    loadNotificationSettings();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications about appointments and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveNotificationSettings();
              }}
            />
          </View>

          {notificationsEnabled && (
            <>
              <View style={[styles.settingItem, styles.settingSubItem]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive updates via email
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={(value) => {
                    setEmailNotifications(value);
                    saveNotificationSettings();
                  }}
                />
              </View>

              <View style={[styles.settingItem, styles.settingSubItem]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Appointment Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get reminded about upcoming appointments
                  </Text>
                </View>
                <Switch
                  value={appointmentReminders}
                  onValueChange={(value) => {
                    setAppointmentReminders(value);
                    saveNotificationSettings();
                  }}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingDescription}>
                {isBiometricSupported 
                  ? 'Use Face ID or Fingerprint for login' 
                  : 'Your device does not support biometric authentication'}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!isBiometricSupported}
            />
          </View>
        </View>

        <View style={styles.content}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionIconContainer}>
                {option.icon}
              </View>
              <Text style={styles.optionText}>{option.title}</Text>
              <Icon name="chevron-right" size={24} color="#CCCCCC" />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
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
    color: '#666',
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
    borderBottomColor: '#F5F6FA',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  settingSubItem: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
  },
});

export default SettingsScreen; 