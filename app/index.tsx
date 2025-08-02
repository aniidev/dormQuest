import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

      await setDoc(dormRef, {
        dorm: dormTrimmed,
        timestamp: Date.now(),
      });

      router.push({ pathname: '/dare', params: { dorm: dormTrimmed } });
    } catch (error) {
      console.error("Error checking or saving dorm to Firestore:", error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Dorm Room</Text>
        <Text style={styles.subtitle}>Enter your dorm number to join</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. A-103"
          placeholderTextColor="#6B6B6B"
          value={dorm}
          onChangeText={setDorm}
          autoCapitalize="characters"
        />
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#22242A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#23242C',
    borderRadius: 24,
    padding: 28,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#BFC2CD',
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    backgroundColor: '#282931',
    color: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 26,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#35363B',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#FFD600',
    borderRadius: 32,
    width: '80%',
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: "#FFD600",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  buttonText: {
    color: '#23242C',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
