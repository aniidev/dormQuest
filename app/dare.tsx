import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const sampleDares = [
  "Slide a mystery love note under the door of {{room}}.",
  "Post an awkward selfie with the person living at {{room}} to your story with no caption.",
  "Sing your favorite song outside {{room}}.",
  "Go to {{room}} and make a TikTok dance video with the other person.",
  "Give a tour of room {{room}} to the owner.",
  "Ask if you can sleepover at {{room}}.",
  "Pull up in the worst fit possible to dorm {{room}} and ask them to rate it.",
  "Say a pickup line to the person at dorm {{room}}."
];

const sampleSocial = [
  "Knock on the door of room {{room}} and give them a compliment.",
  "Challenge room {{room}} to a thumb war.",
  "Ask the person in {{room}} what their favorite song is.",
  "Offer a snack to someone in {{room}}.",
  "Ask the person at {{room}} for one fun fact about themselves.",
];

const socialTopics = [
  "What's your favorite late-night snack?",
  "What's a class you surprisingly enjoyed?",
  "Have you ever pulled an all-nighter?",
  "What's your weirdest dorm story?",
  "Do you believe in ghosts in the dorm?",
];

export default function DareScreen() {
  const { dorm } = useLocalSearchParams();
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<'dare' | 'social'>('dare');
  const [dormNumber, setDormNumber] = useState<string>('');

  useEffect(() => {
    if (typeof dorm === 'string') {
      setDormNumber(dorm.toUpperCase());
    }
  }, [dorm]);

  const generateChallenge = () => {
    if (!dormNumber) return;

    const floorLetter = dormNumber[0];
    const randomRoomNum = Math.floor(Math.random() * 50 + 100);
    const targetRoom = `${floorLetter}-${randomRoomNum}`;

    let selected: string;

    if (challengeType === 'dare') {
      const rand = sampleDares[Math.floor(Math.random() * sampleDares.length)];
      selected = rand.replace('{{room}}', targetRoom);
    } else {
      const challenge = sampleSocial[Math.floor(Math.random() * sampleSocial.length)];
      const topic = socialTopics[Math.floor(Math.random() * socialTopics.length)];
      selected = `${challenge.replace('{{room}}', targetRoom)}\n🗣 Bonus topic: ${topic}`;
    }

    setChallenge(selected);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Challenge</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.optionBtn, challengeType === 'dare' && styles.selectedBtn]}
          onPress={() => setChallengeType('dare')}
        >
          <Text style={styles.optionText}>🎯 Dare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, challengeType === 'social' && styles.selectedBtn]}
          onPress={() => setChallengeType('social')}
        >
          <Text style={styles.optionText}>🗣️ Social</Text>
        </TouchableOpacity>
      </View>

      <Button title="Generate Challenge" onPress={generateChallenge} />

      {challenge && (
        <View style={styles.dareBox}>
          <Text style={styles.dareText}>{challenge}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fefefe',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  selectedBtn: {
    backgroundColor: '#0077ff',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  dareBox: {
    marginTop: 30,
    backgroundColor: '#d0e8ff',
    padding: 20,
    borderRadius: 10,
  },
  dareText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    color: '#003366',
  },
});
