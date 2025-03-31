import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface RecoveryScoreCardProps {
  score: number;
  date: Date;
  colors: any;
}

export const RecoveryScoreCard: React.FC<RecoveryScoreCardProps> = ({ score, date, colors }) => {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Yellow
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };
  
  const color = getScoreColor(score);
  
  // Get text status based on score
  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Fully Recovered';
    if (score >= 60) return 'Moderately Recovered';
    if (score >= 40) return 'Partially Recovered';
    return 'Needs Recovery';
  };
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Recovery Score</Text>
          <Text style={[styles.status, { color: colors.textPrimary }]} numberOfLines={1}>{getScoreStatus(score)}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Svg height="100" width="100" viewBox="0 0 100 100">
            {/* Background circle */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E0E0E0"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Foreground circle (progress) */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${Math.PI * 2 * 45 * score / 100} ${Math.PI * 2 * 45 * (1 - score / 100)}`}
              strokeDashoffset={(Math.PI * 2 * 45) / 4} // Start from top
            />
            {/* Score text */}
            <SvgText
              x="50"
              y="55"
              fontSize="24"
              fontWeight="bold"
              fill={color}
              textAnchor="middle"
            >
              {Math.round(score)}
            </SvgText>
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  scoreContainer: {
    width: 100,
    height: 100,
  },
});