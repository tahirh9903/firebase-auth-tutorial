import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from '@firebase/auth';
import ProfileScreen from '../screens/ProfileScreen';
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
        headerShown: false,
        presentation: 'card'
      }}
    >
      <Stack.Screen 
        name="UserProfile"
      >
        {({ navigation }) => (
          <ProfileScreen
            user={user}
            firstName={firstName}
            lastName={lastName}
            phoneNumber={phoneNumber}
            handleAuthentication={handleAuthentication}
            navigation={navigation}
          />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="EditProfile"
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
      >
        {({ navigation }) => (
          <SettingsScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PrivacyPolicy"
      >
        {({ navigation }) => (
          <PrivacyPolicyScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="PaymentMethod"
        component={PaymentMethodScreen}
      />

      <Stack.Screen 
        name="PasswordManager"
      >
        {({ navigation }) => (
          <PasswordManagerScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="AddCard"
        component={AddCardScreen}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator; 