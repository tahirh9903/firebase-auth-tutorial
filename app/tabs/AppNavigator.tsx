import React from 'react';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { User } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
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
          screenOptions={({ route }: { route: { name: keyof RootTabParamList } }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Chat') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'list' : 'list-outline';
              } else if (route.name === 'Doctors') {
                iconName = focused ? 'medical' : 'medical-outline';
              } else {
                iconName = 'home';
              }

              return (
                <View style={{
                  backgroundColor: focused ? '#FFFFFF30' : 'transparent',
                  padding: 8,
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 2,
                }}>
                  <Ionicons 
                    name={iconName} 
                    size={20} 
                    color={focused ? '#FFFFFF' : '#FFFFFF90'} 
                    style={{
                      opacity: focused ? 1 : 0.9,
                    }}
                  />
                </View>
              );
            },
            tabBarShowLabel: true,
            tabBarActiveTintColor: '#FFFFFF',
            tabBarInactiveTintColor: '#FFFFFF90',
            tabBarStyle: {
              backgroundColor: '#2C56F5',
              borderTopWidth: 0,
              borderRadius: 20,
              height: 70,
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 40 : 20,
              left: 30,
              right: 30,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              paddingHorizontal: 10,
              paddingBottom: 8,
              paddingTop: 8,
              borderWidth: 1,
              borderColor: '#4364F720',
            },
            tabBarItemStyle: {
              height: 54,
              paddingVertical: 4,
              marginHorizontal: 1,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              marginTop: 2,
              letterSpacing: 0.2,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen
            name="Home"
            options={{
              tabBarLabel: 'Home',
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
              tabBarLabel: 'Chat',
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
              tabBarLabel: 'Tasks',
            }}
          />
        </Tab.Navigator>
      </View>
    </DismissKeyboard>
  );
};

export default AppNavigator;