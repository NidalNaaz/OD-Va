import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';

const Stack = createNativeStackNavigator();

// Sample profile data
const profileData = {
  name: 'John Doe',
  age: 30,
  bloodGroup: 'O+',
  phone: '+911234567890',
  emergencyContacts: [
    { name: 'Alice', number: '+911112223333' },
    { name: 'Bob', number: '+911114445555' },
  ],
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home">
          {props => <HomeScreen {...props} profile={profileData} />}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {props => <ProfileScreen {...props} profile={profileData} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
