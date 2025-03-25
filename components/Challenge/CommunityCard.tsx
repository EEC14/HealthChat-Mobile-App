import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CommunityChallenge } from '../../types/community-challenge';

interface CommunityChallengeCardProps {
  challenge: CommunityChallenge;
  onPress: () => void;
}

const CommunityChallengeCard: React.FC<CommunityChallengeCardProps> = ({ challenge, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>👤 {challenge.participantCount}</Text>
          <Text style={styles.statsText}>❤️ {challenge.likes}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{challenge.description}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.creator}>Created by: {challenge.creatorName}</Text>
        <View style={styles.tags}>
          {challenge.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {challenge.tags.length > 2 && (
            <Text style={styles.moreTag}>+{challenge.tags.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  creator: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  tags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#00838f',
  },
  moreTag: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
});

export default CommunityChallengeCard;