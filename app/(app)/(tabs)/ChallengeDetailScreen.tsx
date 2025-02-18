// /src/screens/Challenge/ChallengeDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Challenge } from '../../../types/challenge';
import { updateChallengeProgress } from '../../../utils/challengeService';

// Define the component's props
interface ChallengeDetailScreenProps {
  challengeId: string;
  onBack: () => void;
}

const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({ challengeId, onBack }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch detailed challenge data from Firestore
  const fetchChallengeDetail = async () => {
    try {
      const doc = await firebase.firestore().collection('challenges').doc(challengeId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          setChallenge({
            id: doc.id,
            title: data.title,
            description: data.description,
            goal: data.goal,
            currentProgress: data.currentProgress,
            startDate: data.startDate.toDate(), // Assuming Firebase Timestamp
            endDate: data.endDate.toDate(),       // Assuming Firebase Timestamp
            reward: data.reward,
          });
        }
      } else {
        Alert.alert('Error', 'Challenge not found.');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching challenge detail:', error);
      Alert.alert('Error', 'Unable to load challenge details.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetail();
  }, [challengeId]);

  const handleProgressUpdate = async () => {
    if (challenge) {
      const newProgress = challenge.currentProgress + 10;
      await updateChallengeProgress(challenge.id, newProgress);
      setChallenge({ ...challenge, currentProgress: newProgress });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76c7c0" />
      </View>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description}>{challenge.description}</Text>
      <Text style={styles.progress}>
        Progress: {challenge.currentProgress} / {challenge.goal}
      </Text>
      <Button title="Add Progress" onPress={handleProgressUpdate} />
      <View style={styles.separator} />
      <Button title="Back" onPress={onBack} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  progress: {
    fontSize: 16,
    marginBottom: 16,
  },
  separator: {
    marginVertical: 8,
  },
});

export default ChallengeDetailScreen;
