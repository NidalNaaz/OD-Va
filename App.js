import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function App() {
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    const accSub = Accelerometer.addListener(data => setAccData(data));
    const gyroSub = Gyroscope.addListener(data => setGyroData(data));

    return () => {
      accSub.remove();
      gyroSub.remove();
    };
  }, []);

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  text: { fontSize: 18, margin: 5 }
});
