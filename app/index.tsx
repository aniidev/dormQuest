import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../firebase.js';

export default function HomeScreen() {
  const [dorm, setDorm] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    const dormTrimmed = dorm.trim().toUpperCase();
    if (!dormTrimmed) return;

    try {
      const dormRef = doc(db, 'dorms', dormTrimmed);
      const dormSnap = await getDoc(dormRef);

      if (dormSnap.exists()) {
        Alert.alert('Dorm already exists', 'This dorm is already registered.');
        return;
      }

      // Save new dorm to Firestore
      await setDoc(dormRef, {
        dorm: dormTrimmed,
        timestamp: Date.now(),
      });

      // Navigate to dare screen
      router.push({ pathname: '/dare', params: { dorm: dormTrimmed } });
    } catch (error) {
      console.error("Error checking or saving dorm to Firestore:", error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Dorm Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. A-103"
        placeholderTextColor="#888"
        value={dorm}
        onChangeText={setDorm}
        autoCapitalize="characters"
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#121212',  // dark background
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',  // light text
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    marginBottom: 16,
    color: '#fff',  // light input text
    backgroundColor: '#222',  // dark input background
  },
});
