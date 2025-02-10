import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { User } from '@firebase/auth';
import HomeScreen from './HomeScreen'; // Import the HomeScreen
import ProfileScreen from './ProfileScreen'; // Import the ProfileScreen

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  user: User;
  handleAuthentication: () => void;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ user, handleAuthentication }) => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen user={user} handleAuthentication={handleAuthentication} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default AppNavigator;