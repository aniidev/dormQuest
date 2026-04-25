import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebase.js';
import { buildDormDocKey } from '../utils/dormIdentity';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hallName, setHallName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    const hallTrimmed = hallName.trim();
    const roomTrimmed = roomNumber.trim().toUpperCase();
    if (!email || !password || !hallTrimmed || !roomTrimmed) {
      Alert.alert('Missing info', 'Please fill in email, password, hall name, and room number.');
      return;
    }
    const dormKey = buildDormDocKey(hallTrimmed, roomTrimmed);
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      const userPayload = {
        hallName: hallTrimmed,
        roomNumber: roomTrimmed,
        dorm: dormKey,
        timestamp: Date.now(),
      };
      await setDoc(doc(db, 'users', uid), userPayload);
      await setDoc(doc(db, 'dorms', dormKey), {
        dorm: dormKey,
        hallName: hallTrimmed,
        roomNumber: roomTrimmed,
        timestamp: Date.now(),
      });
      setLoading(false);
      router.push({ pathname: '/dare', params: { dorm: dormKey } });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoWrap}>
              <Image
                source={require('../assets/images/logo.png')}
                style={s.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={s.brandName}>dormQuest</Text>
            <Text style={s.brandTag}>your dorm. your mission.</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.formTitle}>Create account</Text>

            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="#3d5a70"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="#3d5a70"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={s.input}
              placeholder="Hall / building (e.g. Ellicott Hall)"
              placeholderTextColor="#3d5a70"
              value={hallName}
              onChangeText={setHallName}
              autoCapitalize="words"
            />
            <TextInput
              style={s.input}
              placeholder="Room number (e.g. A-103)"
              placeholderTextColor="#3d5a70"
              value={roomNumber}
              onChangeText={setRoomNumber}
              autoCapitalize="characters"
            />

            {loading ? (
              <ActivityIndicator size="large" color="#2a6089" style={s.loader} />
            ) : (
              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnDown]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleSignup();
                }}
              >
                <Text style={s.btnText}>Get Started</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <Pressable
            onPress={() => router.push('/login')}
            style={s.footer}
          >
            <Text style={s.footerText}>Already have an account?</Text>
            <Text style={s.footerLink}> Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#09161f',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  brand: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 44,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#0d1e2b',
    borderWidth: 1,
    borderColor: '#162a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 50,
    height: 50,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  brandTag: {
    color: '#3d5a70',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0d1e2b',
    color: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#162a3a',
    fontWeight: '500',
  },
  loader: {
    marginTop: 12,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#2a6089',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDown: {
    opacity: 0.8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  footerText: {
    color: '#3d5a70',
    fontSize: 14,
  },
  footerLink: {
    color: '#2a6089',
    fontSize: 14,
    fontWeight: '600',
  },
});
