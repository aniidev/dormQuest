import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../firebase.js';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const dorm = userDoc.data().dorm;
        router.push({ pathname: '/dare', params: { dorm } });
      } else {
        Alert.alert('Error', 'Dorm info not found.');
      }
    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Login to DormDare</Text>
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
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/')}>
          <Text style={{ color: '#FFD600', marginTop: 12 }}>
            Need an account? Sign up
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#22242A', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#23242C', borderRadius: 24, padding: 28, width: '90%', maxWidth: 360, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 23, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#282931', color: '#FFF', borderRadius: 12, padding: 15, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#35363B', fontWeight: '600' },
  button: { backgroundColor: '#FFD600', borderRadius: 32, width: '80%', paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#23242C', fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
});