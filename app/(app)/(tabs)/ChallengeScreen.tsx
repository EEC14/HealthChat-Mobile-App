import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button, TouchableOpacity, SectionList, TextInput } from 'react-native';
import { db, auth } from "@/firebase";
import { Challenge } from '../../../types/challenge';
import { CommunityChallenge } from '../../../types/community-challenge';
import { collection, getDocs } from "firebase/firestore";
import ChallengeCard from '../../../components/Challenge/ChallengeCard';
import CommunityChallengeCard from '../../../components/Challenge/CommunityCard';
import ChallengeDetailScreen from '../../../components/Challenge/ChallengeDetailScreen';
import CommunityDetailScreen from '../../../components/Challenge/CommunityDetailScreen';
import CreateChallengeScreen from '../../../components/Challenge/CreateChallengeScreen';
import { CreateCommunityScreen } from '../../../components/Challenge/CreateCommunityScreen';
import { Theme, useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import { ColorsType } from "@/types";
import { UserBadges } from '../../../types/badge';
import BadgesDisplay from '../../../components/Badge/BadgesDisplay';
import { getUserBadges } from '../../../utils/badgeService';
import { fetchCommunityChallengers } from '../../../utils/communityService';

type ViewMode = 'list' | 'detail' | 'community-detail' | 'create' | 'create-community';

const ChallengesScreen: React.FC = () => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [communityChallenges, setCommunityChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'personal' | 'community'>('personal');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userBadges, setUserBadges] = useState<UserBadges | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      // Load personal challenges
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

      // Load community challenges
      const communityData = await fetchCommunityChallengers();
      setCommunityChallenges(communityData);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadChallenges();
  };

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
  
  if (viewMode === 'create-community') {
    return (
      <CreateCommunityScreen
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

  if (viewMode === 'community-detail' && selectedChallengeId) {
    return (
      <CommunityDetailScreen
        challengeId={selectedChallengeId}
        onBack={() => {
          setSelectedChallengeId(null);
          setViewMode('list');
          loadChallenges(); 
        }}
      />
    );
  }

  // Filter challenges based on search query
  const filteredPersonalChallenges = searchQuery 
    ? challenges.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : challenges;

  const filteredCommunityChallenges = searchQuery
    ? communityChallenges.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : communityChallenges;

  const renderPersonalItem = ({ item }: { item: Challenge }) => (
    <ChallengeCard
      challenge={item}
      onPress={() => {
        setSelectedChallengeId(item.id);
        setSelectedType('personal');
        setViewMode('detail');
      }}
    />
  );

  const renderCommunityItem = ({ item }: { item: CommunityChallenge }) => (
    <CommunityChallengeCard
      challenge={item}
      onPress={() => {
        setSelectedChallengeId(item.id);
        setSelectedType('community');
        setViewMode('community-detail');
      }}
    />
  );

  if (loading && !refreshing) {
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
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: currentColors.surface || '#f5f5f5', 
            color: currentColors.textPrimary 
          }]}
          placeholder="Search challenges..."
          placeholderTextColor={currentColors.textSecondary || '#aaa'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'my' && [styles.activeTab, { borderColor: currentColors.primary }]
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my' && { color: currentColors.primary }
            ]}
          >
            My Challenges
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'community' && [styles.activeTab, { borderColor: currentColors.primary }]
          ]}
          onPress={() => setActiveTab('community')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'community' && { color: currentColors.primary }
            ]}
          >
            Community
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Create button container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: currentColors.primary }]}
          onPress={() => setViewMode(activeTab === 'my' ? 'create' : 'create-community')}
        >
          <Text style={styles.createButtonText}>
            {activeTab === 'my' ? 'Create Challenge' : 'Create Community Challenge'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Challenge lists */}
      {activeTab === 'my' ? (
        <FlatList
          data={filteredPersonalChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonalItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                {searchQuery
                  ? 'No challenges match your search'
                  : 'You have no challenges yet. Create one to get started!'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredCommunityChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                {searchQuery
                  ? 'No community challenges match your search'
                  : 'No community challenges available yet. Be the first to create one!'}
              </Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  searchInput: {
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  emptyContainer: {
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
});

export default ChallengesScreen;