import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from '@firebase/auth';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PasswordManagerScreen from '../screens/PasswordManagerScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import PaymentMethodScreen from '../screens/PaymentMethodScreen';
import AddCardScreen from '../screens/AddCardScreen';
import type { RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

interface ProfileStackProps {
  user: User | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  handleAuthentication: () => void;
}

const ProfileStackNavigator: React.FC<ProfileStackProps> = ({
  user,
  firstName,
  lastName,
  phoneNumber,
  handleAuthentication,
}) => {
  return (
    <Stack.Navigator 
      initialRouteName="UserProfile"
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          color: '#2c3e50',
          fontSize: 20,
        },
        headerTintColor: '#0066FF',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        presentation: 'card'
      }}
    >
      <Stack.Screen 
        name="UserProfile"
        options={{ 
          headerShown: false
        }}
      >
        {() => (
          <ProfileScreen
            user={user}
            firstName={firstName}
            lastName={lastName}
            phoneNumber={phoneNumber}
            handleAuthentication={handleAuthentication}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="EditProfile"
        options={{ title: 'Edit Profile' }}
      >
        {({ navigation, route }) => (
          <EditProfileScreen 
            userId={route.params?.userId || ''}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Settings"
        options={{ title: 'Settings' }}
      >
        {({ navigation }) => (
          <SettingsScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PrivacyPolicy"
        options={{ title: 'Privacy Policy' }}
      >
        {({ navigation }) => (
          <PrivacyPolicyScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PaymentMethod"
        options={{ title: 'Payment Method' }}
        component={PaymentMethodScreen}
      />

      <Stack.Screen 
        name="PasswordManager"
        options={{ title: 'Password Manager' }}
      >
        {({ navigation }) => (
          <PasswordManagerScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="AddCard"
        options={{ title: 'Add Card' }}
        component={AddCardScreen}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator; 