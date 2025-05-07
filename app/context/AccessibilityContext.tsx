import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityContextType {
  isDarkMode: boolean;
  textSize: number;
  setDarkMode: (value: boolean) => void;
  setTextSize: (value: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSizeState] = useState(1.0);

  useEffect(() => {
    loadAccessibilitySettings();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('accessibilitySettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setIsDarkMode(parsed.darkMode);
        setTextSizeState(parsed.textSize);
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const saveAccessibilitySettings = async (darkMode: boolean, size: number) => {
    try {
      const settings = {
        darkMode,
        textSize: size,
      };
      await AsyncStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    saveAccessibilitySettings(value, textSize);
  };

  const setTextSize = (value: number) => {
    setTextSizeState(value);
    saveAccessibilitySettings(isDarkMode, value);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isDarkMode,
        textSize,
        setDarkMode,
        setTextSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}; 