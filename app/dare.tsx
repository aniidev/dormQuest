import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
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
import { formatDormPillLabel } from '../utils/dormIdentity';

const SOCIAL_TOPICS = [
  "What's your favorite late-night snack?",
  "What's a class you surprisingly enjoyed?",
  "Have you ever pulled an all-nighter?",
  "What's your weirdest dorm story?",
  "Do you believe in ghosts in the dorm?",
];

const TAGS = ['day', 'night', 'funny', 'awkward', 'romantic', 'loud', 'quiet'];

const C = {
  bg: '#09161f',
  surface: '#0d1e2b',
  border: '#162a3a',
  blue: '#2a6089',
  dare: '#df2b2b',
  social: '#ddc433',
  white: '#ffffff',
  sub: '#7a9ab5',
  muted: '#3d5a70',
  green: '#22c55e',
};

export default function DareScreen() {
  const router = useRouter();
  const { dorm: dormParam } = useLocalSearchParams();

  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<'dare' | 'social'>('dare');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /** Firestore `users.dorm` / `dorms` doc id — unique hall + room (legacy may be room-only). */
  const [userDormKey, setUserDormKey] = useState<string>('');
  const [dormPillLabel, setDormPillLabel] = useState<string>('');
  const [publicDorms, setPublicDorms] = useState<string[]>([]);
  const [dormLabelById, setDormLabelById] = useState<Map<string, string>>(() => new Map());
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  useEffect(() => {
    const fetchDorms = async () => {
      const snap = await getDocs(collection(db, 'dorms'));
      const ids: string[] = [];
      const labels = new Map<string, string>();
      snap.docs.forEach((d) => {
        const data = d.data() as {
          dorm?: string;
          hallName?: string;
          roomNumber?: string;
        };
        const id = typeof data.dorm === 'string' ? data.dorm : d.id;
        ids.push(id);
        labels.set(
          id,
          formatDormPillLabel({
            hallName: data.hallName,
            roomNumber: data.roomNumber,
            dormKey: id,
          })
        );
      });
      setPublicDorms(ids);
      setDormLabelById(labels);
    };
    fetchDorms();
  }, []);

  useEffect(() => {
    const loadDorm = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const d = userDoc.data() as {
            dorm?: string;
            hallName?: string;
            roomNumber?: string;
          };
          const key = typeof d.dorm === 'string' ? d.dorm : '';
          setUserDormKey(key);
          setDormPillLabel(
            formatDormPillLabel({
              hallName: d.hallName,
              roomNumber: d.roomNumber,
              dormKey: key,
            })
          );
          return;
        }
      }
      if (typeof dormParam === 'string' && dormParam.length > 0) {
        const key = dormParam.toUpperCase();
        setUserDormKey(key);
        setDormPillLabel(formatDormPillLabel({ dormKey: key }));
      }
    };
    loadDorm();
  }, [dormParam]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(
      doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'),
      (snap) => {
        if (snap.exists()) {
          setActiveChallenge(snap.data());
          setChallenge(snap.data().challengeText);
        } else {
          setActiveChallenge(null);
          setChallenge(null);
        }
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeChallenge?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = activeChallenge.expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const sec = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${sec}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  const generateChallenge = () => {
    if (!userDormKey) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const others = publicDorms.filter((d) => d !== userDormKey);
    const targetId = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : userDormKey;
    const targetLabel = dormLabelById.get(targetId) ?? formatDormPillLabel({ dormKey: targetId });

    const filtered = tasksData.filter(t => {
      if (t.type !== challengeType) return false;
      if (selectedTags.length === 0) return true;
      return selectedTags.every(tag => t.tags.includes(tag));
    });

    if (filtered.length === 0) return setChallenge('No tasks match your filters. Try removing some.');

    const task = filtered[Math.floor(Math.random() * filtered.length)];
    let text = task.text.replace('{{room}}', targetLabel);

    if (challengeType === 'social') {
      const topic = SOCIAL_TOPICS[Math.floor(Math.random() * SOCIAL_TOPICS.length)];
      text += `\n\nBonus topic: ${topic}`;
    }

    setChallenge(text);
  };

  const acceptChallenge = async () => {
    if (!auth.currentUser || !challenge) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
    await setDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'), {
      challengeText: challenge,
      startedAt: serverTimestamp(),
      expiresAt,
      status: 'active',
      type: challengeType,
    });
  };

  const completeChallenge = async () => {
    if (!auth.currentUser) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const pts = activeChallenge?.type === 'social' ? 100 : 150;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      points: increment(pts),
      missions: increment(1),
      streak: increment(1),
    });
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'));

    setPointsEarned(pts);
    setTimeout(() => setPointsEarned(null), 2500);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const typeAccent = challengeType === 'dare' ? C.dare : C.social;
  const activeType = activeChallenge?.type as 'dare' | 'social' | undefined;
  const activeAccent = activeType === 'social' ? C.social : C.dare;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.dormPill}>
          <Text style={s.dormText} numberOfLines={2}>
            {dormPillLabel || '—'}
          </Text>
        </View>
        <Text style={s.appName}>dormQuest</Text>
        <View style={s.headerActions}>
          <Pressable onPress={() => router.push('/leaderboard')} style={s.iconBtn}>
            <Ionicons name="trophy-outline" size={19} color={C.muted} />
          </Pressable>
          <Pressable onPress={handleLogout} style={s.iconBtn}>
            <Ionicons name="log-out-outline" size={19} color={C.muted} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.titleBig}>Your{'\n'}Mission</Text>
          <Text style={s.titleSub}>pick a challenge type to begin</Text>
        </View>

        {/* Type toggle */}
        <View style={s.toggle}>
          <Pressable
            style={[s.toggleBtn, challengeType === 'dare' && { backgroundColor: C.dare }]}
            onPress={() => {
              Haptics.selectionAsync();
              setChallengeType('dare');
              setChallenge(null);
            }}
          >
            <Text style={[s.toggleText, challengeType === 'dare' && s.toggleTextActive]}>
              🎯  Dare
            </Text>
          </Pressable>
          <Pressable
            style={[s.toggleBtn, challengeType === 'social' && { backgroundColor: C.social }]}
            onPress={() => {
              Haptics.selectionAsync();
              setChallengeType('social');
              setChallenge(null);
            }}
          >
            <Text style={[s.toggleText, challengeType === 'social' && s.toggleTextActive]}>
              🗣  Social
            </Text>
          </Pressable>
        </View>

        {/* Filters */}
        {!activeChallenge && (
          <View style={s.filterBlock}>
            <Text style={s.filterLabel}>Filters</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tagRow}
            >
              {TAGS.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedTags(prev =>
                        active ? prev.filter(t => t !== tag) : [...prev, tag]
                      );
                    }}
                    style={[s.tag, active && { backgroundColor: C.blue, borderColor: C.blue }]}
                  >
                    <Text style={[s.tagText, active && { color: '#fff' }]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Generate button — only when no challenge is active */}
        {!activeChallenge && (
          <Pressable
            style={({ pressed }) => [
              s.genBtn,
              { borderColor: typeAccent },
              pressed && { opacity: 0.75 },
            ]}
            onPress={generateChallenge}
          >
            <Ionicons name="shuffle-outline" size={18} color={typeAccent} style={{ marginRight: 8 }} />
            <Text style={[s.genBtnText, { color: typeAccent }]}>Generate Mission</Text>
          </Pressable>
        )}

        {/* Pending challenge (not yet accepted) */}
        {!activeChallenge && challenge && (
          <View style={[s.card, { borderColor: typeAccent }]}>
            <View style={[s.badge, { backgroundColor: typeAccent + '22', borderColor: typeAccent + '55' }]}>
              <Text style={[s.badgeText, { color: typeAccent }]}>
                {challengeType === 'dare' ? 'DARE' : 'SOCIAL'}
              </Text>
            </View>
            <Text style={s.cardText}>{challenge}</Text>
            <Pressable
              style={({ pressed }) => [
                s.solidBtn,
                { backgroundColor: typeAccent },
                pressed && { opacity: 0.85 },
              ]}
              onPress={acceptChallenge}
            >
              <Text style={s.solidBtnText}>Accept Challenge</Text>
            </Pressable>
          </View>
        )}

        {/* Points earned celebration */}
        {pointsEarned !== null && (
          <View style={s.pointsCard}>
            <Ionicons name="star" size={28} color={C.social} />
            <Text style={s.pointsNum}>+{pointsEarned}</Text>
            <Text style={s.pointsLabel}>points earned</Text>
          </View>
        )}

        {/* Active challenge */}
        {activeChallenge && (
          <View style={[s.card, s.activeCard, { borderColor: activeAccent }]}>
            <View style={[s.badge, { backgroundColor: C.green + '22', borderColor: C.green + '55' }]}>
              <Text style={[s.badgeText, { color: C.green }]}>● ACTIVE</Text>
            </View>

            <Text style={s.cardText}>{activeChallenge.challengeText}</Text>

            <View style={s.timerBox}>
              <Text style={s.timerLabel}>Time remaining</Text>
              <Text style={[s.timerValue, { color: activeAccent }]}>{timeLeft}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                s.solidBtn,
                { backgroundColor: C.green },
                pressed && { opacity: 0.85 },
              ]}
              onPress={completeChallenge}
            >
              <Ionicons name="checkmark-circle-outline" size={17} color="#09161f" style={{ marginRight: 6 }} />
              <Text style={s.solidBtnText}>Mark Complete</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#09161f',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#162a3a',
  },
  dormPill: {
    backgroundColor: '#0d1e2b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#162a3a',
    maxWidth: '46%',
  },
  dormText: {
    color: '#7a9ab5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  appName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1e2b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#162a3a',
  },

  /* Scroll content */
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  /* Title */
  titleBlock: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  titleBig: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 44,
    marginBottom: 8,
  },
  titleSub: {
    color: '#3d5a70',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Toggle */
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#0d1e2b',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#162a3a',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: '#3d5a70',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#09161f',
    fontWeight: '700',
  },

  /* Filters */
  filterBlock: {
    marginBottom: 20,
  },
  filterLabel: {
    color: '#3d5a70',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#162a3a',
    backgroundColor: '#0d1e2b',
    marginRight: 8,
  },
  tagText: {
    color: '#3d5a70',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Generate button */
  genBtn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  genBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Challenge card */
  card: {
    backgroundColor: '#0d1e2b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  activeCard: {
    borderWidth: 1.5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 20,
  },

  /* Solid action button */
  solidBtn: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: {
    color: '#09161f',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Points earned */
  pointsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1e2b',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddc43355',
    paddingVertical: 28,
    marginBottom: 12,
  },
  pointsNum: {
    color: '#ddc433',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 4,
  },
  pointsLabel: {
    color: '#3d5a70',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  /* Timer */
  timerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#091a27',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#162a3a',
    marginBottom: 16,
  },
  timerLabel: {
    color: '#3d5a70',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timerValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
