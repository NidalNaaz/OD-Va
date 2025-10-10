import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function ProfileScreen({ profile }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <Text style={styles.text}>Name: {profile.name}</Text>
      <Text style={styles.text}>Age: {profile.age}</Text>
      <Text style={styles.text}>Blood Group: {profile.bloodGroup}</Text>
      <Text style={styles.text}>Phone: {profile.phone}</Text>

      <Text style={[styles.header, { marginTop: 20 }]}>Emergency Contacts</Text>
      <FlatList
        data={profile.emergencyContacts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.contact}>
            <Text style={styles.text}>Name: {item.name}</Text>
            <Text style={styles.text}>Number: {item.number}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 18, marginBottom: 5 },
  contact: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 5 },
});
