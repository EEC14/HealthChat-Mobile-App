// /src/screens/Challenge/ChallengesScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { Challenge } from '../../../types/challenge';
import ChallengeCard from '../../../components/Challenge/ChallengeCard';
import ChallengeDetailScreen from './ChallengeDetailScreen';
import CreateChallengeScreen from './CreateChallengeScreen';
import { fetchChallenges } from '../../../utils/challengeService';

type ViewMode = 'list' | 'detail' | 'create';

const ChallengesScreen: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Function to load challenges from Firestore.
  const loadChallenges = async () => {
    setLoading(true);
    const data = await fetchChallenges();
    setChallenges(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  // Render the Create Challenge screen.
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

  // Render the detail view when a challenge is selected.
  if (viewMode === 'detail' && selectedChallengeId) {
    return (
      <ChallengeDetailScreen
        challengeId={selectedChallengeId}
        onBack={() => {
          setSelectedChallengeId(null);
          setViewMode('list');
        }}
      />
    );
  }

  // Render the list of challenges.
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#76c7c0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fitness Challenges</Text>
      <Button title="Create New Challenge" onPress={() => setViewMode('create')} />
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
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChallengesScreen;
