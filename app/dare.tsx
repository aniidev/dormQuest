import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tasksData from '../data/tasks.json';
import { auth, db } from '../firebase.js';

const socialTopics = [
  "What's your favorite late-night snack?",
  "What's a class you surprisingly enjoyed?",
  "Have you ever pulled an all-nighter?",
  "What's your weirdest dorm story?",
  "Do you believe in ghosts in the dorm?"
];

const RED = "#f44336";
const BLUE = "#1e88e5";
const GREY_TEXT = "#8B95A1";

export default function DareScreen() {
  const router = useRouter();
  const { dorm: dormParam } = useLocalSearchParams();

  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<'dare' | 'social'>('dare');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dormNumber, setDormNumber] = useState<string>('');
  const [publicDorms, setPublicDorms] = useState<string[]>([]);

  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Fetch dorm list
  useEffect(() => {
    const fetchDorms = async () => {
      const snapshot = await getDocs(collection(db, 'dorms'));
      setPublicDorms(snapshot.docs.map(doc => doc.data().dorm));
    };
    fetchDorms();
  }, []);

  // Get dorm from params or user profile
  useEffect(() => {
    const getDorm = async () => {
      if (typeof dormParam === 'string') {
        setDormNumber(dormParam.toUpperCase());
      } else if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setDormNumber(userDoc.data().dorm);
        }
      }
    };
    getDorm();
  }, [dormParam]);

  // Listen for active challenge in Firestore
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setActiveChallenge(data);
        setChallenge(data.challengeText);
      } else {
        setActiveChallenge(null);
        setChallenge(null);
      }
    });
    return () => unsub();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!activeChallenge?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = activeChallenge.expiresAt.toDate().getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  // Generate challenge
  const generateChallenge = () => {
    if (!dormNumber) return;
    const availableDorms = publicDorms.filter(d => d !== dormNumber);
    const targetRoom = availableDorms.length > 0
      ? availableDorms[Math.floor(Math.random() * availableDorms.length)]
      : dormNumber;

    const filteredTasks = tasksData.filter(task => {
      if (task.type !== challengeType) return false;
      if (selectedTags.length === 0) return true;
      return selectedTags.every(tag => task.tags.includes(tag));
    });

    if (filteredTasks.length === 0) {
      return setChallenge("No tasks available");
    }

    const randomTask = filteredTasks[Math.floor(Math.random() * filteredTasks.length)];
    let finalChallenge = randomTask.text.replace('{{room}}', targetRoom);

    if (challengeType === 'social') {
      const topic = socialTopics[Math.floor(Math.random() * socialTopics.length)];
      finalChallenge += `\n\n🗣 Bonus topic: ${topic}`;
    }

    setChallenge(finalChallenge);
  };

  // Accept challenge → save to Firestore with 24h expiration
  const acceptChallenge = async () => {
    if (!auth.currentUser || !challenge) return;
    const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
    await setDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'), {
      challengeText: challenge,
      startedAt: serverTimestamp(),
      expiresAt,
      status: 'active'
    });
  };

  // Complete challenge → remove from Firestore
  const completeChallenge = async () => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'activeChallenge'));
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Tasks</Text>

        {/* Type toggle */}
        <View style={styles.segmented}>
          <Pressable style={[styles.segmentBtn, challengeType === 'dare' && styles.selectedRedSegment]} onPress={() => setChallengeType('dare')}>
            <Text style={challengeType === 'dare' ? styles.selectedSegmentTextRed : styles.unselectedSegmentText}>🎯 Dare</Text>
          </Pressable>
          <Pressable style={[styles.segmentBtn, challengeType === 'social' && styles.selectedBlueSegment]} onPress={() => setChallengeType('social')}>
            <Text style={challengeType === 'social' ? styles.selectedSegmentTextBlue : styles.unselectedSegmentText}>🗣️ Social</Text>
          </Pressable>
        </View>

        {/* Tag filters */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8, justifyContent: 'center' }}>
          {['day', 'night', 'funny', 'awkward', 'romantic', 'loud', 'quiet'].map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#2a6089',
                  backgroundColor: isSelected ? '#2a6089' : 'transparent',
                }}
              >
                <Text style={{ color: isSelected ? '#fff' : '#2a6089', fontSize: 13 }}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Challenge */}
        {!activeChallenge && (
          <>
            <Pressable style={styles.buttonBlue} onPress={generateChallenge}>
              <Text style={styles.buttonText}>Get Mission</Text>
            </Pressable>
            {challenge && (
              <>
                <View style={styles.challengeBox}>
                  <Text style={challengeType === 'dare' ? styles.challengeTextRed : styles.challengeTextBlue}>{challenge}</Text>
                </View>
                <Pressable style={[styles.buttonBlue, { marginTop: 10 }]} onPress={acceptChallenge}>
                  <Text style={styles.buttonText}>Accept Challenge</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        {activeChallenge && (
          <>
            <View style={styles.challengeBox}>
              <Text style={styles.challengeTextRed}>{activeChallenge.challengeText}</Text>
              <Text style={{ color: '#ccc', marginTop: 8 }}>Time left: {timeLeft}</Text>
            </View>
            <Pressable style={[styles.buttonBlue, { marginTop: 10 }]} onPress={completeChallenge}>
              <Text style={styles.buttonText}>Mark as Complete</Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09161f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#09161f',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    width: '92%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  segmented: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#081620ff',
    paddingVertical: 11,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#35363B',
  },
  selectedRedSegment: {
    backgroundColor: '#df2b2bff',
    shadowColor: '#df2b2bff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBlueSegment: {
    backgroundColor: '#ddc433ff',
    shadowColor: '#ddc433ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentText: {
    fontSize: 25,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  selectedSegmentTextRed: {
    color: '#09161f',
  },
  selectedSegmentTextBlue: {
    color: '#09161f',
  },
  unselectedSegmentText: {
    color: '#888',
  },
  buttonBlue: {
    backgroundColor: '#2a6089',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 42,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
    marginBottom: 25,
    shadowColor: '#2a6089',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#09161f',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  challengeBox: {
    backgroundColor: '#081620ff',
    padding: 22,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
    alignItems: 'center',
    minHeight: 120,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#35363B',
  },
  challengeText: {
    fontSize: 65,
    lineHeight: 27,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  challengeTextRed: {
    color: '#ffffffff',
    fontSize: 17,
    alignItems: 'center'
  },
  challengeTextBlue: {
    color: '#ffffffff',
    fontSize: 17
  },
  logoutBtn: {
    marginTop: 12,
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: '600',
  }
});
