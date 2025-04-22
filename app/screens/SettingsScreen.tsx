import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type SettingsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const settingsOptions = [
    {
      icon: <Icon name="notifications-none" size={24} color="#0066FF" />,
      title: 'Notification Setting',
      onPress: () => {},
    },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#0066FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
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
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0066FF',
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
});

export default SettingsScreen; 