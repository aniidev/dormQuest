import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }
    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      setLoading(false);
      if (userDoc.exists()) {
        router.push({ pathname: '/dare', params: { dorm: userDoc.data().dorm } });
      } else {
        Alert.alert('Error', 'Dorm info not found.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login failed', error.message);
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
            <Text style={s.brandTag}>welcome back</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.formTitle}>Sign in</Text>

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

            {loading ? (
              <ActivityIndicator size="large" color="#2a6089" style={s.loader} />
            ) : (
              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnDown]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleLogin();
                }}
              >
                <Text style={s.btnText}>Sign In</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <Pressable
            onPress={() => router.push('/')}
            style={s.footer}
          >
            <Text style={s.footerText}>New to dormQuest?</Text>
            <Text style={s.footerLink}> Create account</Text>
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
    paddingTop: 72,
    paddingBottom: 52,
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
  form: {},
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
    paddingTop: 36,
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
