import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../firebase.js';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }
    try {
      setLoading(true); // Start loading
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      setLoading(false); // Stop loading before navigation
      if (userDoc.exists()) {
        const dorm = userDoc.data().dorm;
        router.push({ pathname: '/dare', params: { dorm } });
      } else {
        Alert.alert('Error', 'Dorm info not found.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login failed', error.message);
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
        <Text style={styles.title}>Login</Text>
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

        {/* Show loading circle instead of button when logging in */}
        {loading ? (
          <ActivityIndicator size="large" color="#2a6089" style={{ marginVertical: 14 }} />
        ) : (
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.push('/')}>
          <Text style={{ color: '#2a6089', marginTop: 12 }}>
            Need an account? Sign up
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09161f', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#09161f', borderRadius: 24, padding: 28, width: '90%', maxWidth: 360, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 23, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#081620ff', color: '#FFF', borderRadius: 12, padding: 15, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#35363B', fontWeight: '600' },
  button: { backgroundColor: '#2a6089', borderRadius: 32, width: '80%', paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
  logo: {
    width: 100,
    height: 100,
    marginTop: 12,
    marginBottom: 2,
  },
});
