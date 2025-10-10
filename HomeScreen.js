import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation, profile }) {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [fallDetected, setFallDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alertCancelled, setAlertCancelled] = useState(false);
  const [location, setLocation] = useState(null);

  let fallStartTime = null;
  const FREE_FALL_THRESHOLD = 0.5;
  const IMPACT_THRESHOLD = 2.5;
  const FALL_TIME_WINDOW = 1000;

  // Request location permission
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions required', 'Please allow location permission.');
      }
    };
    requestPermissions();
  }, []);

  // Accelerometer & Gyroscope
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

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (fallDetected && !alertCancelled && timer === 0) {
      openSMS();
    }
  }, [timer]);

  const cancelAlert = () => {
    setAlertCancelled(true);
    setFallDetected(false);
    setTimer(0);
    setLocation(null);
    setTimeout(() => setAlertCancelled(false), 5000);
  };

  const rescueArrived = () => {
    setFallDetected(false);
    setTimer(0);
    setLocation(null);
  };

  const openSMS = async () => {
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
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Unable to open SMS app.');
      }
    } catch (e) {
      console.log('openSMS error', e);
      Alert.alert('Error', 'Unable to open SMS app.');
    }
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.mapContainer}>
          <Text style={styles.alert}>Alert sent! View your location:</Text>
          <Button title="Rescue Arrived" onPress={rescueArrived} />
          <Text
            style={styles.mapLink}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`)
            }
          >
            Open Map
          </Text>
        </View>
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 },
  alert: { fontSize: 20, color: 'red', marginTop: 20, fontWeight: 'bold', textAlign: 'center' },
  cancelled: { fontSize: 18, color: 'green', marginTop: 10, fontWeight: 'bold' },
  mapContainer: { marginTop: 20, alignItems: 'center' },
  mapLink: { color: 'blue', marginTop: 10, textDecorationLine: 'underline', fontSize: 16 },
});
