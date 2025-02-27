import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
  goal: number; 
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, goal }) => {
  const progressPercentage = Math.min((progress / goal) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={[styles.filler, { width: `${progressPercentage}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 10,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  filler: {
    height: '100%',
    backgroundColor: '#76c7c0',
  },
});

export default ProgressBar;
