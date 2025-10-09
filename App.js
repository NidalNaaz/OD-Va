import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function App() {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

  const [fallDetected, setFallDetected] = useState(false);
  const [timer, setTimer] = useState(0);

  // Thresholds
  const FREE_FALL_THRESHOLD = 0.5;   // below this = falling
  const IMPACT_THRESHOLD = 2.5;      // above this = hitting ground
  const FALL_TIME_WINDOW = 1000;     // 1s window to detect impact after free fall

  let fallStartTime = null;

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    const accSub = Accelerometer.addListener(data => {
      setAccData(data);
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

      const currentTime = Date.now();

      // Detect start of fall
      if (magnitude < FREE_FALL_THRESHOLD && !fallStartTime) {
        fallStartTime = currentTime;
      }

      // Detect impact within the fall window
      if (fallStartTime && currentTime - fallStartTime < FALL_TIME_WINDOW) {
        if (magnitude > IMPACT_THRESHOLD && !fallDetected) {
          setFallDetected(true);
          setTimer(10);
          fallStartTime = null;
        }
      }

      // Reset if no impact detected in time
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

  // Countdown timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

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
        <Text style={styles.alert}>Fall detected! Sending alert in {timer}s</Text>
      )}
      {fallDetected && timer === 0 && <Text style={styles.alert}>ALERT SENT!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 },
  alert: { fontSize: 20, color: 'red', marginTop: 20, fontWeight: 'bold' }
});
