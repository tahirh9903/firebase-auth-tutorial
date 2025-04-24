import React from 'react';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { User } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // Import icons from a library like Expo Icons
import HomeScreen from './HomeScreen'; // Import the HomeScreen
import ProfileStack from './ProfileStack';
import ChatScreen from './ChatScreen';
import CalendarScreen from './CalendarScreen';
import DoctorsScreen from './DoctorsScreen';
import DismissKeyboard from '../components/DismissKeyboard';
import type { RootTabParamList } from '../navigation/types';

const Tab = createBottomTabNavigator<RootTabParamList>();

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
    <DismissKeyboard>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Chat') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Doctors') {
                iconName = focused ? 'medical' : 'medical-outline';
              } else {
                iconName = 'home';
              }

              return <Ionicons name={iconName} size={24} color={focused ? '#000000' : '#FFFFFF'} />;
            },
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#000000',
            tabBarInactiveTintColor: '#FFFFFF',
            tabBarStyle: {
              backgroundColor: '#335FF6',
              borderTopWidth: 0,
              borderRadius: 50,
              height: 60,
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 20 : 10,
              left: 20,
              right: 20,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            tabBarItemStyle: {
              height: 60,
              padding: 10,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen
            name="Home"
            options={{
              tabBarLabel: 'Home', // Label for the tab
            }}
          >
            {() => <HomeScreen user={user} />}
          </Tab.Screen>
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
              tabBarLabel: 'Profile',
            }}
          >
            {() => (
              <ProfileStack
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
      </View>
    </DismissKeyboard>
  );
};

export default AppNavigator;