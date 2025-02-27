import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { db } from "@/firebase";
import { Challenge } from "../../types/challenge";
import { doc, getDoc } from "firebase/firestore";
import { updateChallengeProgress, deleteChallenge } from '../../utils/challengeService';
import { Colors } from "@/constants/Colors";
import ProgressBar from '../../components/Challenge/ProgressBar';
import { Theme, useTheme } from '@/context/ThemeContext';

interface ChallengeDetailScreenProps {
  challengeId: string;
  onBack: () => void;
}

const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({ challengeId, onBack }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progressInput, setProgressInput] = useState<string>('');

  const fetchChallengeDetail = async () => {
    try {
      const challengeDocRef = doc(db, "challenges", challengeId);
      const challengeSnap = await getDoc(challengeDocRef);
      if (challengeSnap.exists()) {
        const data = challengeSnap.data();
        const challengeObj: Challenge = {
          id: challengeSnap.id,
          title: data.title,
          description: data.description,
          goal: data.goal,
          currentProgress: data.currentProgress,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          reward: data.reward,
        };
        setChallenge(challengeObj);
        setProgressInput(challengeObj.currentProgress.toString());
      } else {
        Alert.alert("Error", "Challenge not found.");
        onBack();
      }
    } catch (error) {
      console.error("Error fetching challenge detail:", error);
      Alert.alert("Error", "Failed to fetch challenge details.");
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
      const parsedProgress = parseInt(progressInput, 10);
      if (isNaN(parsedProgress)) {
        Alert.alert("Invalid Input", "Please enter a valid number.");
        return;
      }
      try {
        await updateChallengeProgress(challenge.id, parsedProgress);
        if (parsedProgress >= challenge.goal) {
          await deleteChallenge(challenge.id);
          Alert.alert("Challenge Completed!", "This challenge has been completed and will be removed.");
          onBack();
        } else {
          setChallenge({ ...challenge, currentProgress: parsedProgress });
          Alert.alert("Success", "Progress updated successfully.");
        }
      } catch (error) {
        console.error("Error in progress update/delete flow:", error);
        Alert.alert("Error", "Failed to update progress.");
      }
    }
  };
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{challenge.description}</Text>

      <View style={[styles.progressSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress</Text>
        <ProgressBar progress={challenge.currentProgress} goal={challenge.goal} />
        <Text style={[styles.progressText, { color: colors.textPrimary }]}>
          {challenge.currentProgress} / {challenge.goal}
        </Text>
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Update Progress</Text>
        <TextInput
          style={[styles.input, { color: '#000000', borderColor: colors.primary }]}
          keyboardType="numeric"
          value={progressInput}
          onChangeText={setProgressInput}
          placeholder="Enter new progress"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={styles.updateButton}>
          <Button title="Update" onPress={handleProgressUpdate} color={colors.primary} />
        </View>
      </View>

      <View style={styles.backButtonContainer}>
        <Button title="Back" onPress={onBack} color={colors.secondary} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "justify",
  },
  progressSection: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  inputSection: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 18,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  updateButton: {
    marginTop: 5,
  },
  backButtonContainer: {
    marginTop: 10,
  },
});

export default ChallengeDetailScreen;
