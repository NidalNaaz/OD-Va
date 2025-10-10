import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking, ScrollView, TouchableOpacity } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const GOOGLE_API_KEY = 'YOUR_API_KEY'; // Replace with your Google Maps API Key

export default function HomeScreen({ navigation, profile }) {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [fallDetected, setFallDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alertCancelled, setAlertCancelled] = useState(false);
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  let fallStartTime = null;
  const FREE_FALL_THRESHOLD = 0.5;
  const IMPACT_THRESHOLD = 2.5;
  const FALL_TIME_WINDOW = 1000;

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions required', 'Please allow location permission.');
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    const accSub = Accelerometer.addListener(data => {
      setAccData(data);
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const currentTime = Date.now();

      if (magnitude < FREE_FALL_THRESHOLD && !fallStartTime) fallStartTime = currentTime;

      if (fallStartTime && currentTime - fallStartTime < FALL_TIME_WINDOW) {
        if (magnitude > IMPACT_THRESHOLD && !fallDetected) {
          setFallDetected(true);
          setTimer(10);
          fallStartTime = null;
        }
      }

      if (fallStartTime && currentTime - fallStartTime >= FALL_TIME_WINDOW) {
        fallStartTime = null;
      }
    });

    const gyroSub = Gyroscope.addListener(data => setGyroData(data));

    return () => {
      accSub.remove();
      gyroSub.remove();
    };
  }, [fallDetected]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (fallDetected && !alertCancelled && timer === 0) {
      sendSMS();
    }
  }, [timer]);

  const cancelAlert = () => {
    setAlertCancelled(true);
    setFallDetected(false);
    setTimer(0);
    setLocation(null);
    setHospitals([]);
    setTimeout(() => setAlertCancelled(false), 5000);
  };

  const rescueArrived = () => {
    setFallDetected(false);
    setTimer(0);
    setLocation(null);
    setHospitals([]);
  };

  const sendSMS = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const firstContact = profile.emergencyContacts[0];
      const message = `SOS! Emergency detected!\nName: ${profile.name}\nAge: ${profile.age}\nBlood Group: ${profile.bloodGroup}\nPhone: ${profile.phone}\nLocation: https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;

      const smsUrl = `sms:${firstContact.number}?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) await Linking.openURL(smsUrl);
      else Alert.alert('Error', 'Unable to open SMS app.');

      const nearbyHospitals = await getNearestHospitals(loc.coords.latitude, loc.coords.longitude);
      setHospitals(nearbyHospitals);
    } catch (e) {
      console.log('sendSMS error', e);
      Alert.alert('Error', 'Unable to send SMS or fetch location.');
    }
  };

  const getNearestHospitals = async (lat, lon) => {
    try {
      const nearby = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&type=hospital&key=${GOOGLE_API_KEY}`
      );
      const nearbyData = await nearby.json();
      const results = nearbyData.results.slice(0, 5);

      const hospitalsDetails = await Promise.all(results.map(async hospital => {
        const placeId = hospital.place_id;
        const details = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,geometry&key=${GOOGLE_API_KEY}`
        );
        const detailsData = await details.json();
        return detailsData.result;
      }));

      return hospitalsDetails;
    } catch (err) {
      console.log('getNearestHospitals error', err);
      return [];
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}><FontAwesome5 name="heartbeat" size={24} color="#3A8DFF" /> Sensors Data</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>Accelerometer:</Text>
          <Text style={styles.cardText}>x: {accData.x.toFixed(2)} y: {accData.y.toFixed(2)} z: {accData.z.toFixed(2)}</Text>
          <Text style={styles.cardText}>Gyroscope:</Text>
          <Text style={styles.cardText}>x: {gyroData.x.toFixed(2)} y: {gyroData.y.toFixed(2)} z: {gyroData.z.toFixed(2)}</Text>
        </View>
      </View>

      {fallDetected && timer > 0 && (
        <View style={styles.alertBox}>
          <MaterialIcons name="warning" size={28} color="white" />
          <Text style={styles.alertText}>Fall detected! Sending alert in {timer}s</Text>
          <Button title="Cancel" color="#FF6B6B" onPress={cancelAlert} />
        </View>
      )}

      {fallDetected && timer === 0 && !alertCancelled && location && (
        <View style={styles.section}>
          <Text style={styles.header}><FontAwesome5 name="hospital" size={24} color="#3A8DFF" /> Emergency Response</Text>
          <MapView
            style={{ width: '100%', height: 250, borderRadius: 10, marginVertical: 10 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} title="You are here" pinColor="red" />
          </MapView>

          <Text style={styles.subHeader}>Nearby Hospitals:</Text>
          {hospitals.map((h, i) => (
            <TouchableOpacity
              key={i}
              style={styles.hospitalCard}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${h.geometry.location.lat},${h.geometry.location.lng}`)}
            >
              <Text style={styles.hospitalName}>{h.name}</Text>
              <Text style={styles.hospitalAddress}>{h.formatted_address}</Text>
              {h.formatted_phone_number && <Text style={styles.hospitalPhone}>📞 {h.formatted_phone_number}</Text>}
            </TouchableOpacity>
          ))}

          <Button title="Rescue Arrived" color="#4CAF50" onPress={rescueArrived} />
        </View>
      )}

      <View style={{ marginVertical: 20 }}>
        <Button title="Go to Profile" color="#3A8DFF" onPress={() => navigation.navigate('Profile')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#F0F4F8' },
  section: { marginVertical: 10 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#3A8DFF', marginBottom: 10 },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 10 },
  cardText: { fontSize: 16, marginBottom: 5 },
  alertBox: { backgroundColor: '#FF6B6B', padding: 15, borderRadius: 10, marginVertical: 10, alignItems: 'center' },
  alertText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginVertical: 5 },
  hospitalCard: { backgroundColor: 'white', padding: 10, borderRadius: 8, marginBottom: 8, elevation: 1 },
  hospitalName: { fontWeight: 'bold', fontSize: 16, color: '#3A8DFF' },
  hospitalAddress: { fontSize: 14, color: '#555' },
  hospitalPhone: { fontSize: 14, color: '#555' },
});
