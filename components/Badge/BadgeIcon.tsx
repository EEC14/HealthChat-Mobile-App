import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '../../types/badge';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

interface BadgeIconProps {
  badge: Badge;
  earned: boolean;
  onPress: () => void;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, earned, onPress }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          backgroundColor: earned ? colors.primary : '#e0e0e0',
          opacity: earned ? 1 : 0.5
        }
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{badge.icon}</Text>
      {earned && (
        <View style={styles.earnedIndicator} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
  },
  earnedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  }
});

export default BadgeIcon;