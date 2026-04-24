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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dorm, setDorm] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    const dormTrimmed = dorm.trim().toUpperCase();
    if (!email || !password || !dormTrimmed) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), { dorm: dormTrimmed, timestamp: Date.now() });
      await setDoc(doc(db, 'dorms', dormTrimmed), { dorm: dormTrimmed, timestamp: Date.now() });
      setLoading(false);
      router.push({ pathname: '/dare', params: { dorm: dormTrimmed } });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoWrap}>
              <Image source={require('../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.wordmark}>DormQuest</Text>
            <Text style={s.sub}>challenges · connections · chaos</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.formTitle}>Create account</Text>

            <Field
              label="Email address"
              placeholder="you@university.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />

            <Field
              label="Password"
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              focused={focused === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />

            <Field
              label="Dorm room"
              placeholder="e.g. A-103"
              value={dorm}
              onChangeText={setDorm}
              autoCapitalize="characters"
              focused={focused === 'dorm'}
              onFocus={() => setFocused('dorm')}
              onBlur={() => setFocused(null)}
            />

            {loading ? (
              <ActivityIndicator color="#2a6089" style={s.loader} />
            ) : (
              <Pressable style={({ pressed }) => [s.cta, pressed && s.ctaPressed]} onPress={handleSignup}>
                <Text style={s.ctaText}>Get Started</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <Pressable style={s.footer} onPress={() => router.push('/login')}>
            <Text style={s.footerMuted}>Already have an account? </Text>
            <Text style={s.footerLink}>Sign in</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, placeholder, value, onChangeText, focused, onFocus, onBlur,
  secureTextEntry, keyboardType, autoCapitalize,
}: any) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={[s.input, focused && s.inputFocused]}
        placeholder={placeholder}
        placeholderTextColor="#243d52"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09161f' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  brand: { alignItems: 'center', paddingTop: 52, paddingBottom: 40 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#0e2234',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#2a6089',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: { width: 64, height: 64 },
  wordmark: { color: '#f0f4f8', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: '#2e4d66', fontSize: 12, marginTop: 6, letterSpacing: 0.8 },

  form: {
    backgroundColor: '#0c1c29',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#142840',
  },
  formTitle: { color: '#f0f4f8', fontSize: 18, fontWeight: '700', marginBottom: 24, letterSpacing: -0.3 },

  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    color: '#2e5a7a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#071219',
    color: '#f0f4f8',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#112030',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#2a6089',
    backgroundColor: '#0a1c2c',
  },

  loader: { marginVertical: 22 },
  cta: {
    backgroundColor: '#2a6089',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#2a6089',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaPressed: { backgroundColor: '#1d4a6b', shadowOpacity: 0.1 },
  ctaText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerMuted: { color: '#2e4d66', fontSize: 14 },
  footerLink: { color: '#4a90c4', fontSize: 14, fontWeight: '600' },
});
