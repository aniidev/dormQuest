import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const sampleDares = [
  "Knock on the door of room {{room}} and give them a compliment.",
  "Challenge room {{room}} to a thumb war.",
  "Ask room {{room}} what their favorite song is.",
  "Slide a mystery note under the door of {{room}}.",
  "Offer a snack to someone in {{room}}.",
];

export default function Home() {
  const [dormNumber, setDormNumber] = useState('');
  const [dare, setDare] = useState<string | null>(null);

  const generateDare = () => {
    if (!dormNumber.trim()) {
      Alert.alert('Please enter your dorm room!');
      return;
    }

    // Generate a random nearby room number
    const floorLetter = dormNumber.trim()[0].toUpperCase();
    const randomRoomNum = Math.floor(Math.random() * 50 + 100); // room 100-149
    const targetRoom = `${floorLetter}-${randomRoomNum}`;

    // Pick random dare and replace placeholder
    const randomIndex = Math.floor(Math.random() * sampleDares.length);
    const chosenDare = sampleDares[randomIndex].replace('{{room}}', targetRoom);

    setDare(chosenDare);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Dorm Room</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. B-305"
        value={dormNumber}
        onChangeText={setDormNumber}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Button title="Get Dare" onPress={generateDare} />

      {dare && (
        <View style={styles.dareBox}>
          <Text style={styles.dareText}>{dare}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fefefe',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  dareBox: {
    marginTop: 30,
    backgroundColor: '#d0e8ff',
    padding: 20,
    borderRadius: 10,
  },
  dareText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    color: '#003366',
  },
});