import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen({ profile, setProfile }) {
  const [editableProfile, setEditableProfile] = useState({ ...profile });
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');

  const handleProfileChange = (key, value) => {
    setEditableProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleContactChange = (index, key, value) => {
    const updatedContacts = [...editableProfile.emergencyContacts];
    updatedContacts[index][key] = value;
    setEditableProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addContact = () => {
    if (!newContactName || !newContactNumber) {
      Alert.alert('Error', 'Please provide both name and number.');
      return;
    }
    setEditableProfile(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: newContactName, number: newContactNumber }],
    }));
    setNewContactName('');
    setNewContactNumber('');
  };

  const deleteContact = index => {
    const updatedContacts = editableProfile.emergencyContacts.filter((_, i) => i !== index);
    setEditableProfile(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const saveProfile = () => {
    setProfile(editableProfile);
    Alert.alert('Profile Updated', 'Your personal details have been saved.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}><FontAwesome5 name="user-md" size={24} color="#3A8DFF" /> Personal Details</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={editableProfile.name}
          onChangeText={text => handleProfileChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={editableProfile.age.toString()}
          keyboardType="numeric"
          onChangeText={text => handleProfileChange('age', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Group"
          value={editableProfile.bloodGroup}
          onChangeText={text => handleProfileChange('bloodGroup', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={editableProfile.phone}
          keyboardType="phone-pad"
          onChangeText={text => handleProfileChange('phone', text)}
        />
        <Button title="Save Details" color="#3A8DFF" onPress={saveProfile} />
      </View>

      <Text style={[styles.header, { marginTop: 20 }]}><MaterialIcons name="contact-phone" size={24} color="#3A8DFF" /> Emergency Contacts</Text>
      <View style={styles.card}>
        <FlatList
          data={editableProfile.emergencyContacts}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.contactCard}>
              <TextInput
                style={styles.contactInput}
                value={item.name}
                placeholder="Contact Name"
                onChangeText={text => handleContactChange(index, 'name', text)}
              />
              <TextInput
                style={styles.contactInput}
                value={item.number}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onChangeText={text => handleContactChange(index, 'number', text)}
              />
              <TouchableOpacity onPress={() => deleteContact(index)} style={styles.deleteButton}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <Text style={{ marginTop: 10, fontWeight: 'bold', fontSize: 16 }}>Add New Contact:</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          value={newContactName}
          onChangeText={setNewContactName}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          value={newContactNumber}
          keyboardType="phone-pad"
          onChangeText={setNewContactNumber}
        />
        <Button title="Add Contact" color="#3A8DFF" onPress={addContact} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F0F4F8' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#3A8DFF', marginBottom: 10 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 },
  contactCard: { backgroundColor: '#E8F0FE', padding: 10, borderRadius: 8, marginBottom: 10 },
  contactInput: { borderBottomWidth: 1, borderBottomColor: '#aaa', marginBottom: 5, padding: 5 },
  deleteButton: { backgroundColor: '#FF6B6B', padding: 5, alignItems: 'center', borderRadius: 5 },
});
