import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    age: '45',
    bloodGroup: 'O+',
    phone: '+91 9876543210',
    address: '123, MG Road, Bangalore',
    medicalHistory: 'Hypertension, Diabetes',
    notes: 'Carries insulin. Allergic to penicillin.',
    emergencyContacts: 'Wife - +91 9123456789\nSon - +91 9988776655',
  });

  useEffect(() => {
    loadProfile();
  }, []);

    const loadProfile = async () => {
    const data = await SecureStore.getItemAsync('profile');
    if (data) setProfile(JSON.parse(data));
  };

  const saveProfile = async () => {
    await SecureStore.setItemAsync('profile', JSON.stringify(profile));
    alert('✅ Profile Saved!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Personal Details</Text>
      {Object.keys(profile).map(key => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1')}</Text>
          <TextInput
            style={styles.input}
            value={profile[key]}
            multiline
            onChangeText={text => setProfile(prev => ({ ...prev, [key]: text }))}
          />
        </View>
      ))}
      <Button title="Save Profile" onPress={saveProfile} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  field: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, fontSize: 16 },
});
