import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking, ScrollView } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

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
      <Text style={styles.header}>Accelerometer</Text>
      <Text style={styles.text}>x: {accData.x.toFixed(2)}</Text>
      <Text style={styles.text}>y: {accData.y.toFixed(2)}</Text>
      <Text style={styles.text}>z: {accData.z.toFixed(2)}</Text>

      <Text style={styles.header}>Gyroscope</Text>
      <Text style={styles.text}>x: {gyroData.x.toFixed(2)}</Text>
      <Text style={styles.text}>y: {gyroData.y.toFixed(2)}</Text>
      <Text style={styles.text}>z: {gyroData.z.toFixed(2)}</Text>

      {fallDetected && timer > 0 && (
        <View>
          <Text style={styles.alert}>Fall detected! Sending alert in {timer}s</Text>
          <Button title="Cancel" onPress={cancelAlert} />
        </View>
      )}

      {alertCancelled && <Text style={styles.cancelled}>Alert Cancelled</Text>}

      {fallDetected && timer === 0 && !alertCancelled && location && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.alert}>Alert sent! Your location:</Text>
          <MapView
            style={{ width: '100%', height: 250 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} title="You are here" pinColor="red" />
          </MapView>

          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Nearby Hospitals:</Text>
          {hospitals.map((h, index) => (
            <View key={index} style={styles.hospitalItem}>
              <Text>🏥 {h.name}</Text>
              <Text>📍 {h.formatted_address}</Text>
              {h.formatted_phone_number && <Text>📞 {h.formatted_phone_number}</Text>}
              <Text
                style={styles.mapLink}
                onPress={() =>
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${h.geometry.location.lat},${h.geometry.location.lng}`)
                }
              >
                View on Map
              </Text>
            </View>
          ))}

          <Button title="Rescue Arrived" onPress={rescueArrived} />
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 },
  alert: { fontSize: 20, color: 'red', marginTop: 10, fontWeight: 'bold', textAlign: 'center' },
  cancelled: { fontSize: 18, color: 'green', marginTop: 10, fontWeight: 'bold' },
  hospitalItem: { padding: 5, borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 5 },
  mapLink: { color: 'blue', textDecorationLine: 'underline' },
});
