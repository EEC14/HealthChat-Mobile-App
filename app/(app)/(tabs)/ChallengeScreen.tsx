import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { db, auth } from "@/firebase";
import { Challenge } from '../../../types/challenge';
import { collection, getDocs } from "firebase/firestore";
import ChallengeCard from '../../../components/Challenge/ChallengeCard';
import ChallengeDetailScreen from '../../../components/Challenge/ChallengeDetailScreen';
import CreateChallengeScreen from '../../../components/Challenge/CreateChallengeScreen';
import { Theme, useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import { ColorsType } from "@/types";
import { UserBadges } from '../../../types/badge';
import BadgesDisplay from '../../../components/Badge/BadgesDisplay';
import { getUserBadges } from '../../../utils/badgeService';

type ViewMode = 'list' | 'detail' | 'create';

const ChallengesScreen: React.FC = () => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userBadges, setUserBadges] = useState<UserBadges | null>(null);

  const loadUserBadges = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const badges = await getUserBadges(currentUser.uid);
        setUserBadges(badges);
      } catch (error) {
        console.error("Error loading user badges:", error);
      }
    } else {
      setUserBadges(null);
    }
  };

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const challengesCol = collection(db, "challenges");
      const snapshot = await getDocs(challengesCol);
      const challengesData: Challenge[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          goal: data.goal,
          currentProgress: data.currentProgress,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          reward: data.reward,
        };
      });
      setChallenges(challengesData);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    loadChallenges();
    loadUserBadges();
    
    // Listen for auth state changes to reload badges
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserBadges();
      } else {
        setUserBadges(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  if (viewMode === 'create') {
    return (
      <CreateChallengeScreen
        onBack={() => {
          setViewMode('list');
          loadChallenges();
        }}
      />
    );
  }

  if (viewMode === 'detail' && selectedChallengeId) {
    return (
      <ChallengeDetailScreen
        challengeId={selectedChallengeId}
        onBack={() => {
          setSelectedChallengeId(null);
          setViewMode('list');
          loadChallenges(); 
        }}
      />
    );
  }
  const renderItem = ({ item }: { item: Challenge }) => (
    <ChallengeCard
      challenge={item}
      onPress={() => {
        setSelectedChallengeId(item.id);
        setViewMode('detail');
      }}
    />
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Text style={[styles.header, { color: currentColors.textPrimary }]}>Fitness Challenges</Text>
      
      {/* Badge display section */}
      <BadgesDisplay userBadges={userBadges} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setViewMode('create')}
        >
          <Text style={styles.createButtonText}>Create New Challenge</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#007AFF', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChallengesScreen;
