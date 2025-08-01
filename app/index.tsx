import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const [dorm, setDorm] = useState('');
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Dorm Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. A-103"
        value={dorm}
        onChangeText={setDorm}
      />
      <Button
        title="Continue"
        onPress={() => {
          if (!dorm.trim()) return;
          router.push({ pathname: '/dare', params: { dorm } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    marginBottom: 16,
  },
});
