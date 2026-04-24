import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tasksData from '../data/tasks.json';
import { auth, db } from '../firebase.js';

const SOCIAL_TOPICS = [
  "What's your favorite late-night snack?",
  "What's a class you surprisingly enjoyed?",
  "Have you ever pulled an all-nighter?",
  "What's your weirdest dorm story?",
  "Do you believe in ghosts in the dorm?",
];

const TAGS = ['day', 'night', 'funny', 'awkward', 'romantic', 'loud', 'quiet'];

// Accent colors per mode
const ACCENT = { dare: '#d64545', social: '#c49a00' } as const;

export default function DareScreen() {
  const router = useRouter();
  const { dorm: dormParam } = useLocalSearchParams();

  const [challengeType, setChallengeType] = useState<'dare' | 'social'>('dare');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dormNumber, setDormNumber] = useState('');
  const [publicDorms, setPublicDorms] = useState<string[]>([]);
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Fetch participating dorms
  useEffect(() => {
    getDocs(collection(db, 'dorms')).then(snap =>
      setPublicDorms(snap.docs.map(d => d.data().dorm))
    );
  }, []);

  // Resolve dorm number
  useEffect(() => {
    if (typeof dormParam === 'string') {
      setDormNumber(dormParam.toUpperCase());
    } else if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists()) setDormNumber(snap.data().dorm);
      });
    }
  }, [dormParam]);

  // Listen for active challenge
  useEffect(() => {
    if (!auth.currentUser) return;
    return onSnapshot(
      doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'),
      snap => {
        if (snap.exists()) {
          setActiveChallenge(snap.data());
          setPendingChallenge(null);
        } else {
          setActiveChallenge(null);
        }
      }
    );
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!activeChallenge?.expiresAt) return;
    const tick = () => {
      const diff = activeChallenge.expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) return setTimeLeft('00:00:00');
      const h = String(Math.floor(diff / 3_600_000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeChallenge]);

  const rollMission = () => {
    if (!dormNumber) return;
    const others = publicDorms.filter(d => d !== dormNumber);
    const target = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : dormNumber;

    const pool = tasksData.filter(t => {
      if (t.type !== challengeType) return false;
      if (selectedTags.length === 0) return true;
      return selectedTags.every(tag => t.tags.includes(tag));
    });

    if (pool.length === 0) {
      setPendingChallenge('No tasks match those filters. Try removing some tags.');
      return;
    }

    const task = pool[Math.floor(Math.random() * pool.length)];
    let text = task.text.replace('{{room}}', target);
    if (challengeType === 'social') {
      text += `\n\nBonus: ${SOCIAL_TOPICS[Math.floor(Math.random() * SOCIAL_TOPICS.length)]}`;
    }
    setPendingChallenge(text);
  };

  const acceptChallenge = async () => {
    if (!auth.currentUser || !pendingChallenge) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'), {
      challengeText: pendingChallenge,
      type: challengeType,
      startedAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
      status: 'active',
    });
  };

  const completeChallenge = async () => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'));
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  const accent = ACCENT[challengeType];
  const hasActive = !!activeChallenge;
  const hasPending = !!pendingChallenge && !hasActive;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerLabel}>YOUR ROOM</Text>
            <Text style={s.headerRoom}>{dormNumber || '—'}</Text>
          </View>
          <Pressable onPress={handleLogout} style={({ pressed }) => [s.logoutBtn, pressed && s.logoutPressed]}>
            <Text style={s.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        {/* ── Page title ── */}
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Missions</Text>
          {hasActive && (
            <View style={s.activePill}>
              <View style={s.activeDot} />
              <Text style={s.activePillText}>Active</Text>
            </View>
          )}
        </View>

        {/* ── Type switcher ── */}
        <View style={s.switcher}>
          {(['dare', 'social'] as const).map(type => {
            const active = challengeType === type;
            const col = ACCENT[type];
            return (
              <Pressable
                key={type}
                style={[s.switchBtn, active && { backgroundColor: col + '22', borderColor: col }]}
                onPress={() => { setChallengeType(type); setPendingChallenge(null); }}
              >
                <Text style={s.switchIcon}>{type === 'dare' ? '🎯' : '🗣️'}</Text>
                <Text style={[s.switchLabel, active && { color: col }]}>
                  {type === 'dare' ? 'Dare' : 'Social'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tag filters (hidden when active challenge) ── */}
        {!hasActive && (
          <View style={s.filtersSection}>
            <Text style={s.sectionMeta}>FILTER TAGS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tagsRow}>
              {TAGS.map(tag => {
                const on = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[s.tag, on && { backgroundColor: accent + '25', borderColor: accent }]}
                  >
                    <Text style={[s.tagText, on && { color: accent }]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Challenge card ── */}
        <View style={[s.missionCard, { borderColor: accent + '30' }]}>
          {!hasActive && !hasPending && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🕵️</Text>
              <Text style={s.emptyTitle}>No mission yet</Text>
              <Text style={s.emptyBody}>Roll a mission below to get your next challenge.</Text>
            </View>
          )}

          {hasPending && (
            <>
              <Text style={s.cardMeta}>{challengeType === 'dare' ? 'DARE' : 'SOCIAL CHALLENGE'}</Text>
              <Text style={s.missionText}>{pendingChallenge}</Text>
            </>
          )}

          {hasActive && (
            <>
              <Text style={s.cardMeta}>ACTIVE · {activeChallenge.type?.toUpperCase() ?? 'MISSION'}</Text>
              <Text style={s.missionText}>{activeChallenge.challengeText}</Text>

              {/* Timer */}
              <View style={s.timerRow}>
                <View style={s.timerDivider} />
                <View style={s.timerInner}>
                  <Text style={s.timerLabel}>TIME LEFT</Text>
                  <Text style={s.timerValue}>{timeLeft || '—'}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Actions ── */}
        {!hasActive && (
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent }, pressed && s.primaryBtnPressed]}
              onPress={rollMission}
            >
              <Text style={s.primaryBtnText}>{hasPending ? 'Roll Again' : 'Roll Mission'}</Text>
            </Pressable>

            {hasPending && (
              <Pressable
                style={({ pressed }) => [s.secondaryBtn, pressed && s.secondaryBtnPressed]}
                onPress={acceptChallenge}
              >
                <Text style={s.secondaryBtnText}>Accept Challenge</Text>
              </Pressable>
            )}
          </View>
        )}

        {hasActive && (
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.completeBtn, pressed && s.completeBtnPressed]}
              onPress={completeChallenge}
            >
              <Text style={s.completeBtnText}>Mark Complete</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09161f' },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 48 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerLabel: {
    color: '#2e5a7a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  headerRoom: {
    color: '#f0f4f8',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0c1c29',
    borderWidth: 1,
    borderColor: '#142840',
  },
  logoutPressed: { opacity: 0.6 },
  logoutText: { color: '#3d6888', fontSize: 13, fontWeight: '600' },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  pageTitle: {
    color: '#f0f4f8',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e2c1c',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1a4a2e',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c97e',
  },
  activePillText: { color: '#34c97e', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  /* Type switcher */
  switcher: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#0c1c29',
    borderWidth: 1.5,
    borderColor: '#142840',
  },
  switchIcon: { fontSize: 16 },
  switchLabel: {
    color: '#2e5a7a',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Filter tags */
  filtersSection: { marginBottom: 20 },
  sectionMeta: {
    color: '#2e5a7a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  tagsRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#0c1c29',
    borderWidth: 1,
    borderColor: '#142840',
  },
  tagText: { color: '#2e5a7a', fontSize: 13, fontWeight: '600' },

  /* Mission card */
  missionCard: {
    backgroundColor: '#0c1c29',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    minHeight: 220,
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardMeta: {
    color: '#2e5a7a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  missionText: {
    color: '#f0f4f8',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 28,
  },

  /* Empty state */
  emptyState: { alignItems: 'center', paddingVertical: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { color: '#f0f4f8', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyBody: { color: '#2e5a7a', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  /* Timer */
  timerRow: { marginTop: 22 },
  timerDivider: {
    height: 1,
    backgroundColor: '#142840',
    marginBottom: 18,
  },
  timerInner: { alignItems: 'center' },
  timerLabel: {
    color: '#2e5a7a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  timerValue: {
    color: '#f0f4f8',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },

  /* Actions */
  actions: { gap: 10 },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnPressed: { opacity: 0.75 },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#0c1c29',
    borderWidth: 1.5,
    borderColor: '#2a6089',
  },
  secondaryBtnPressed: { opacity: 0.7 },
  secondaryBtnText: { color: '#4a90c4', fontSize: 15, fontWeight: '700' },

  completeBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: '#0d2218',
    borderWidth: 1.5,
    borderColor: '#1c5c38',
  },
  completeBtnPressed: { opacity: 0.7 },
  completeBtnText: { color: '#34c97e', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
});
