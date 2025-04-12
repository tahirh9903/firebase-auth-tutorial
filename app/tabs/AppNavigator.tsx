import React from 'react';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { User } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // Import icons from a library like Expo Icons
import HomeScreen from './HomeScreen'; // Import the HomeScreen
import ProfileScreen from './ProfileScreen'; // Import the ProfileScreen
import ChatScreen from './ChatScreen';
import CalendarScreen from './CalendarScreen';
import DoctorsScreen from './DoctorsScreen';

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  user: User;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  handleAuthentication: () => void;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({
  user,
  firstName,
  lastName,
  phoneNumber,
  handleAuthentication,
}) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: BottomTabScreenProps<any>) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: 'home' | 'home-outline' | 'person' | 'person-outline' | 'chatbubbles' | 'chatbubbles-outline' | 'calendar-sharp' | 'calendar-outline' | 'medical' | 'medical-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home-outline' : 'home-outline'; // Use appropriate icons
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-outline' : 'person-outline'; // Use appropriate icons
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles-outline' : 'chatbubbles-outline'; // Use appropriate icons
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar-outline' : 'calendar-outline'; // Use appropriate icons
          } else if (route.name === 'Doctors') {
            iconName = focused ? 'medical-outline' : 'medical-outline'; // Use appropriate icons
          } else {
            iconName = 'home'; // Default icon
          }

          // Return the icon component
          return <Ionicons name={iconName} size={size} color={focused ? '#000000' : '#FFFFFF'} />;
        },
        tabBarShowLabel: false, // This hides the labels
        tabBarActiveTintColor: '#000000', // Black text for active tab
        tabBarInactiveTintColor: '#FFFFFF', // White text for inactive tab
        tabBarStyle: {
          backgroundColor: '#335FF6', // Background color of the tab bar
          borderTopWidth: 0,
          borderTopColor: '#bdc3c7', // Border color
          borderRadius: 50,
          paddingBottom: 5,
          paddingTop: 5,
          marginBottom: 20,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home', // Label for the tab
        }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          tabBarLabel: 'Doctors',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat', // Label for the tab
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile', // Label for the tab
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
      </Tab.Screen>
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar', // Label for the tab
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;