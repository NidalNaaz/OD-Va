import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function App() {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

  const [fallDetected, setFallDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alertCancelled, setAlertCancelled] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const timerRef = useRef(null);
  const fallStartTime = useRef(null);

  // Thresholds
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

      // Detect start of fall
      if (magnitude < FREE_FALL_THRESHOLD && !fallStartTime.current) {
        fallStartTime.current = currentTime;
      }

      // Detect impact within the fall window
      if (
        fallStartTime.current &&
        currentTime - fallStartTime.current < FALL_TIME_WINDOW
      ) {
        if (magnitude > IMPACT_THRESHOLD && !fallDetected) {
          setFallDetected(true);
          setTimer(10);
          setAlertCancelled(false);
          setAlertSent(false);
          fallStartTime.current = null;
        }
      }

      // Reset if no impact detected in time
      if (
        fallStartTime.current &&
        currentTime - fallStartTime.current >= FALL_TIME_WINDOW
      ) {
        fallStartTime.current = null;
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
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setAlertSent(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timer]);

  // Cancel alert
  const cancelAlert = () => {
    clearInterval(timerRef.current);
    setTimer(0);
    setFallDetected(false);
    setAlertCancelled(true);

    // Hide cancellation message after 5 seconds
    setTimeout(() => {
      setAlertCancelled(false);
    }, 5000);
  };

  // Rescue arrived → reset everything
  const handleRescueArrived = () => {
    setFallDetected(false);
    setAlertSent(false);
    setTimer(0);
    setAlertCancelled(false);
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
        <View style={styles.alertBox}>
          <Text style={styles.alert}>
            Fall detected! Sending alert in {timer}s
          </Text>
          <Button title="Cancel Alert" onPress={cancelAlert} color="red" />
        </View>
      )}

      {alertSent && (
        <View style={styles.alertBox}>
          <Text style={styles.alert}>🚨 ALERT SENT!</Text>
          <Button title="Rescue Arrived" onPress={handleRescueArrived} />
        </View>
      )}

      {alertCancelled && (
        <Text style={styles.cancelled}>✅ Alert cancelled successfully</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 },
  alertBox: { marginTop: 20, alignItems: 'center' },
  alert: { fontSize: 20, color: 'red', fontWeight: 'bold', marginBottom: 10 },
  cancelled: { fontSize: 18, color: 'green', marginTop: 10, fontWeight: 'bold' },
});
