import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function HomeScreen({ navigation }) {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [fallDetected, setFallDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alertCancelled, setAlertCancelled] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

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

      if (magnitude < FREE_FALL_THRESHOLD && !fallStartTime) {
        fallStartTime = currentTime;
      }
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
    return () => { accSub.remove(); gyroSub.remove(); };
  }, [fallDetected]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && fallDetected) {
      setAlertSent(true);
    }
  }, [timer]);

  const cancelAlert = () => {
    setFallDetected(false);
    setTimer(0);
    setAlertSent(false);
    setAlertCancelled(true);
    setTimeout(() => setAlertCancelled(false), 5000);
  };

  const resetAlert = () => {
    setFallDetected(false);
    setTimer(0);
    setAlertSent(false);
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

      {fallDetected && !alertSent && (
        <View>
          <Text style={styles.alert}>Fall detected! Sending alert in {timer}s</Text>
          <Button title="Cancel Alert" onPress={cancelAlert} />
        </View>
      )}

      {alertCancelled && <Text style={styles.cancelled}>Alert Cancelled</Text>}

      {alertSent && (
        <View>
          <Text style={styles.alert}>🚨 ALERT SENT!</Text>
          <Button title="Rescue Arrived" onPress={resetAlert} />
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
  cancelled: { fontSize: 18, color: 'green', marginTop: 10, fontWeight: 'bold' },
});
