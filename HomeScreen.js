import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen({ navigation }) {
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

      if (fallStartTime && currentTime - fallStartTime >= FALL_TIME_WINDOW) fallStartTime = null;
    });

    const gyroSub = Gyroscope.addListener(data => setGyroData(data));
    return () => { accSub.remove(); gyroSub.remove(); };
  }, [fallDetected]);

  // Countdown timer and location fetching
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (fallDetected && !alertCancelled && timer === 0) {
      // Timer ended → get location
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied!');
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      })();
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
          <Button title="Cancel Alert" onPress={cancelAlert} />
        </View>
      )}

      {alertCancelled && <Text style={styles.alert}>Alert cancelled</Text>}

      {fallDetected && timer === 0 && !alertCancelled && (
        <View>
          <Text style={styles.alert}>🚨 ALERT SENT!</Text>
          {location && (
            <MapView style={styles.map} region={location}>
              <Marker coordinate={location} title="Accident Location" />
            </MapView>
          )}
          <Button title="Rescue Arrived" onPress={rescueArrived} />
        </View>
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 },
  alert: { fontSize: 20, color: 'red', marginTop: 20, fontWeight: 'bold', textAlign: 'center' },
  map: { width: 300, height: 300, marginTop: 20 },
});
