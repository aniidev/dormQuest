import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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
  const [dormNumber, setDormNumber] = useState<string>('');
  const [publicDorms, setPublicDorms] = useState<string[]>([]);

  useEffect(() => {
    const fetchDorms = async () => {
      const snapshot = await getDocs(collection(db, 'dorms'));
      const dormList = snapshot.docs.map(doc => doc.data().dorm);
      setPublicDorms(dormList);
    };
    fetchDorms();
  }, []);

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

  const generateChallenge = () => {
    if (!dormNumber) return;

    // Pick a random dorm other than the current one
    const availableDorms = publicDorms.filter(d => d !== dormNumber);
    const targetRoom =
      availableDorms.length > 0
        ? availableDorms[Math.floor(Math.random() * availableDorms.length)]
        : dormNumber;

    // Filter tasks by selected type
    const filteredTasks = tasksData.filter(task => task.type === challengeType);
    if (filteredTasks.length === 0) return;

    const randomTask = filteredTasks[Math.floor(Math.random() * filteredTasks.length)];
    let finalChallenge = randomTask.text.replace('{{room}}', targetRoom);

    // Add bonus topic for social challenges
    if (challengeType === 'social') {
      const topic = socialTopics[Math.floor(Math.random() * socialTopics.length)];
      finalChallenge += `\n\n🗣 Bonus topic: ${topic}`;
    }

    setChallenge(finalChallenge);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Tasks</Text>

        <View style={styles.segmented}>
          <Pressable
            style={[styles.segmentBtn, challengeType === 'dare' && styles.selectedRedSegment]}
            onPress={() => setChallengeType('dare')}
          >
            <Text style={challengeType === 'dare' ? styles.selectedSegmentTextRed : styles.unselectedSegmentText}>
              🎯 Dare
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, challengeType === 'social' && styles.selectedBlueSegment]}
            onPress={() => setChallengeType('social')}
          >
            <Text style={challengeType === 'social' ? styles.selectedSegmentTextBlue : styles.unselectedSegmentText}>
              🗣️ Social
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.buttonBlue} onPress={generateChallenge}>
          <Text style={styles.buttonText}>Generate Challenge</Text>
        </Pressable>

        {challenge && (
          <View style={styles.challengeBox}>
            <Text style={challengeType === 'dare' ? styles.challengeTextRed : styles.challengeTextBlue}>
              {challenge}
            </Text>
          </View>
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
    shadowColor: '#2a6089',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedBlueSegment: {
    backgroundColor: '#ddc433ff',
    shadowColor: '#2a6089',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentText: {
    fontSize: 15,
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
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  challengeTextRed: {
    color: '#2a6089',
  },
  challengeTextBlue: {
    color: '#2a6089',
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
