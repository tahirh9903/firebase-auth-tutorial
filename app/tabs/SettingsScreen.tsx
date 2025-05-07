import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { signOut } = { signOut: () => {} }; // Temporary mock since AuthContext is missing
  const { isDarkMode, textSize, setDarkMode, setTextSize } = useAccessibility();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const textColor = isDarkMode ? '#fff' : '#000';
  const secondaryTextColor = isDarkMode ? '#ccc' : '#666';
  const borderColor = isDarkMode ? '#333' : '#e0e0e0';

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * textSize, color: textColor }]}>
          Accessibility
        </Text>
        
        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={[styles.settingLabel, { fontSize: 16 * textSize, color: textColor }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={[styles.settingLabel, { fontSize: 16 * textSize, color: textColor }]}>
            Text Size
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { fontSize: 14 * textSize, color: secondaryTextColor }]}>
              {Math.round(textSize * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.8}
              maximumValue={1.5}
              value={textSize}
              onValueChange={setTextSize}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor={isDarkMode ? '#666' : '#000000'}
              thumbTintColor="#007AFF"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * textSize, color: textColor }]}>
          Account
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={[styles.buttonText, { fontSize: 16 * textSize }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  sliderContainer: {
    flex: 1,
    marginLeft: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'right',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 