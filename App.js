// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    age: 25,
    bloodGroup: 'O+',
    phone: '',
    emergencyContacts: [{ name: 'Alice', number: '1234567890' }],
  });

  // Load profile from AsyncStorage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('profile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch (e) {
        console.log('Error loading profile:', e);
      }
    };
    loadProfile();
  }, []);

  // Save profile to AsyncStorage whenever it changes
  useEffect(() => {
    const saveProfile = async () => {
      try {
        await AsyncStorage.setItem('profile', JSON.stringify(profile));
      } catch (e) {
        console.log('Error saving profile:', e);
      }
    };
    saveProfile();
  }, [profile]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#3A8DFF' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home">
          {props => <HomeScreen {...props} profile={profile} />}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {props => <ProfileScreen {...props} profile={profile} setProfile={setProfile} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
