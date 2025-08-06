import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../firebase.js';

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dorm, setDorm] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const router = useRouter();

  const handleSignup = async () => {
    const dormTrimmed = dorm.trim().toUpperCase();
    if (!email || !password || !dormTrimmed) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true); // Start loading
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // Save dorm in users collection
      await setDoc(doc(db, 'users', uid), {
        dorm: dormTrimmed,
        timestamp: Date.now()
      });

      // Also store dorm in dorms collection so dare.tsx works
      await setDoc(doc(db, 'dorms', dormTrimmed), {
        dorm: dormTrimmed,
        timestamp: Date.now()
      });

      setLoading(false); // Stop loading before navigation
      router.push({ pathname: '/dare', params: { dorm: dormTrimmed } });
    } catch (error: any) {
      setLoading(false);
      console.error("Signup error:", error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.card}>
        <Text style={styles.title}>Register</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6B6B6B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B6B6B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Dorm Number (e.g. A-103)"
          placeholderTextColor="#6B6B6B"
          value={dorm}
          onChangeText={setDorm}
          autoCapitalize="characters"
        />

        {/* Show loading circle instead of button when signing up */}
        {loading ? (
          <ActivityIndicator size="large" color="#2a6089" style={{ marginVertical: 14 }} />
        ) : (
          <Pressable style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => router.push('/login')}>
        <Text style={{ color: '#2a6089', marginTop: 12 }}>
          Already have an account? Log in
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09161f',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#09161f',
    borderRadius: 24,
    padding: 28,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 1,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#081620ff',
    color: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#35363B',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2a6089',
    borderRadius: 32,
    width: '80%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#09161f',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 170,
    marginBottom: 2,
  },
});
