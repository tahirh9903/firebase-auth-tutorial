import React from 'react';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { User } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // Import icons from a library like Expo Icons
import HomeScreen from './HomeScreen'; // Import the HomeScreen
import ProfileScreen from './ProfileScreen'; // Import the ProfileScreen
import ChatScreen from './ChatScreen';
import CalendarScreen from './CalendarScreen';
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
          let iconName: 'home' | 'home-outline' | 'person' | 'person-outline' | 'chatbubbles' | 'chatbubbles-outline' | 'calendar-sharp' | 'calendar-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'; // Use appropriate icons
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'; // Use appropriate icons
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; // Use appropriate icons
          }
          else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar-sharp' : 'calendar-outline'; // Use appropriate icons
          }else {
            iconName = 'home'; // Default icon
          }

          // Return the icon component
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db', // Active tab color
        tabBarInactiveTintColor: '#7f8c8d', // Inactive tab color
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