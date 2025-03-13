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
  Modal
} from 'react-native';
import { Challenge } from "../../types/challenge";
import { doc, getDoc } from "firebase/firestore";
import { updateChallengeProgress, deleteChallenge } from '../../utils/challengeService';
import { Colors } from "@/constants/Colors";
import ProgressBar from '../../components/Challenge/ProgressBar';
import { Theme, useTheme } from '@/context/ThemeContext';
import { db, auth } from "@/firebase";
import { Badge } from "../../types/badge";
import { trackChallengeCompletion, BADGES } from '../../utils/badgeService';
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
  const [newBadgesEarned, setNewBadgesEarned] = useState<string[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);

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
        console.log(`[DEBUG] Updating progress to: ${parsedProgress}, goal: ${challenge.goal}`);
        await updateChallengeProgress(challenge.id, parsedProgress);
        
        // Check if challenge is completed
        if (parsedProgress >= challenge.goal) {
          console.log(`[DEBUG] Challenge completed! Goal reached.`);
          const currentUser = auth.currentUser;
          
          // Track the completion and check for new badges if user is logged in
          if (currentUser) {
            console.log(`[DEBUG] User authenticated: ${currentUser.uid}`);
            console.log(`[DEBUG] Calling trackChallengeCompletion`);
            const earnedBadges = await trackChallengeCompletion(currentUser.uid);
            console.log(`[DEBUG] Returned from trackChallengeCompletion with badges:`, earnedBadges);
            
            if (earnedBadges.length > 0) {
              console.log(`[DEBUG] New badges earned:`, earnedBadges);
              setNewBadgesEarned(earnedBadges);
              setShowBadgeModal(true);
            } else {
              console.log(`[DEBUG] No new badges earned`);
              // No new badges, just delete the challenge
              await deleteChallenge(challenge.id);
              Alert.alert("Challenge Completed!", "This challenge has been completed and will be removed.");
              onBack();
            }
          } else {
            console.log(`[DEBUG] User not authenticated, skipping badge checks`);
            // User not logged in, just delete the challenge
            await deleteChallenge(challenge.id);
            Alert.alert("Challenge Completed!", "This challenge has been completed and will be removed.");
            onBack();
          }
        } else {
          console.log(`[DEBUG] Progress updated but challenge not completed yet`);
          setChallenge({ ...challenge, currentProgress: parsedProgress });
          Alert.alert("Success", "Progress updated successfully.");
        }
      } catch (error) {
        console.error("[DEBUG] Error in progress update/delete flow:", error);
        Alert.alert("Error", "Failed to update progress.");
      }
    }
  };

  const handleBadgeModalClose = async () => {
    setShowBadgeModal(false);
    setNewBadgesEarned([]);
    
    // Delete the challenge after showing badges
    if (challenge) {
      await deleteChallenge(challenge.id);
    }
    onBack();
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showBadgeModal}
        onRequestClose={handleBadgeModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Challenge Complete!
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              You've earned new badges:
            </Text>
            
            <View style={styles.badgesContainer}>
              {newBadgesEarned.map(badgeId => (
                <View key={badgeId} style={styles.badgeItem}>
                  <Text style={styles.badgeIcon}>{BADGES[badgeId].icon}</Text>
                  <Text style={[styles.badgeName, { color: colors.textPrimary }]}>
                    {BADGES[badgeId].name}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>
                    {BADGES[badgeId].description}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Awesome!"
                onPress={handleBadgeModalClose}
                color={colors.primary}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  badgesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(118, 199, 192, 0.15)',
  },
  badgeIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  badgeDesc: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});

export default ChallengeDetailScreen;
