import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CommunityChallenge } from '../../types/community-challenge';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { Colors } from '@/constants/Colors';
import { Theme, useTheme } from '@/context/ThemeContext';
import ProgressBar from './ProgressBar';
import { joinCommunityChallenge, likeCommunityChallenge } from '../../utils/communityService';

interface CommunityDetailScreenProps {
  challengeId: string;
  onBack: () => void;
}

const CommunityDetailScreen: React.FC<CommunityDetailScreenProps> = ({ challengeId, onBack }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [challenge, setChallenge] = useState<CommunityChallenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  useEffect(() => {
    const fetchChallengeDetail = async () => {
      try {
        const challengeDocRef = doc(db, 'communityChallenges', challengeId);
        const challengeSnap = await getDoc(challengeDocRef);
        
        if (challengeSnap.exists()) {
          const data = challengeSnap.data();
          const challengeObj: CommunityChallenge = {
            id: challengeSnap.id,
            title: data.title,
            description: data.description,
            goal: data.goal,
            currentProgress: data.currentProgress,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            reward: data.reward,
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            participantCount: data.participantCount,
            isPublic: data.isPublic,
            tags: data.tags || [],
            likes: data.likes || 0,
          };
          setChallenge(challengeObj);
        } else {
          Alert.alert('Error', 'Challenge not found.');
          onBack();
        }
        
        // Check if user has liked this challenge
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userLikesRef = doc(db, 'userLikes', currentUser.uid);
          const userLikesSnap = await getDoc(userLikesRef);
          
          if (userLikesSnap.exists()) {
            const likedChallenges = userLikesSnap.data().likedChallenges || [];
            setIsLiked(likedChallenges.includes(challengeId));
          }
        }
      } catch (error) {
        console.error('Error fetching community challenge detail:', error);
        Alert.alert('Error', 'Failed to fetch challenge details.');
        onBack();
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetail();
  }, [challengeId]);

  const handleJoinChallenge = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in to join this challenge.');
      return;
    }
    
    setJoining(true);
    try {
      const personalChallengeId = await joinCommunityChallenge(challengeId);
      Alert.alert(
        'Challenge Joined!',
        'This challenge has been added to your personal challenges.',
        [
          {
            text: 'View My Challenges',
            onPress: onBack,
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ]
      );
      
      // Update participant count locally
      if (challenge) {
        setChallenge({
          ...challenge,
          participantCount: challenge.participantCount + 1,
        });
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', 'Failed to join challenge. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleLikeChallenge = async () => {
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in to like this challenge.');
      return;
    }
    
    if (isLiked) {
      return; // Already liked
    }
    
    try {
      await likeCommunityChallenge(challengeId);
      setIsLiked(true);
      
      // Update likes count locally
      if (challenge) {
        setChallenge({
          ...challenge,
          likes: challenge.likes + 1,
        });
      }
    } catch (error) {
      console.error('Error liking challenge:', error);
      Alert.alert('Error', 'Failed to like challenge. Please try again.');
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
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{challenge.participantCount}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <TouchableOpacity 
          style={styles.statItem} 
          onPress={handleLikeChallenge}
          disabled={isLiked}
        >
          <Text style={styles.statValue}>{challenge.likes}</Text>
          <Text style={[styles.statLabel, isLiked && styles.likedText]}>
            {isLiked ? 'Liked' : 'Likes'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.creatorText, { color: colors.textSecondary }]}>
        Created by: {challenge.creatorName}
      </Text>
      
      <View style={styles.tagsContainer}>
        {challenge.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {challenge.description}
      </Text>

      <View style={[styles.goalSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Challenge Goal</Text>
        <Text style={[styles.goalText, { color: colors.textPrimary }]}>
          {challenge.goal} {challenge.goal === 1 ? 'unit' : 'units'}
        </Text>
      </View>
      
      <View style={[styles.rewardSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Reward</Text>
        <Text style={[styles.rewardText, { color: colors.textSecondary }]}>
          {challenge.reward || 'Personal satisfaction and growth'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {joining ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.primary }]}
            onPress={handleJoinChallenge}
          >
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </TouchableOpacity>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#FF2D55',
  },
  creatorText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#00838f',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'justify',
  },
  goalSection: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 18,
    textAlign: 'center',
  },
  rewardSection: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButtonContainer: {
    marginTop: 8,
  },
});

export default CommunityDetailScreen;