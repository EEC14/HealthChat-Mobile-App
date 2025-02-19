import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Challenge } from '../../types/challenge';
import ProgressBar from './ProgressBar';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.description}>{challenge.description}</Text>
      </View>
      <View style={styles.progressContainer}>
        <ProgressBar progress={challenge.currentProgress} goal={challenge.goal} />
        <Text style={styles.progressText}>
          {challenge.currentProgress} / {challenge.goal}
        </Text>
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
  infoContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
});

export default ChallengeCard;
