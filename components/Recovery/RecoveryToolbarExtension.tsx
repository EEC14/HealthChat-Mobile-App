import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecoveryToolbarExtensionProps {
  onAddActivity: (type: string) => void;
}

export const RecoveryToolbarExtension: React.FC<RecoveryToolbarExtensionProps> = ({ 
  onAddActivity 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Recovery Activity:</Text>
      <View style={styles.activityButtons}>
        <TouchableOpacity 
          style={styles.activityButton}
          onPress={() => onAddActivity('stretching')}
        >
          <MaterialCommunityIcons name="human-handsup" size={24} color="#1E3A8A" />
          <Text style={styles.buttonText}>Stretching</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.activityButton}
          onPress={() => onAddActivity('foam_rolling')}
        >
          <MaterialCommunityIcons name="roller-skate" size={24} color="#1E3A8A" />
          <Text style={styles.buttonText}>Foam Rolling</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.activityButton}
          onPress={() => onAddActivity('contrast_therapy')}
        >
          <MaterialCommunityIcons name="shower" size={24} color="#1E3A8A" />
          <Text style={styles.buttonText}>Contrast Therapy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.activityButton}
          onPress={() => onAddActivity('meditation')}
        >
          <MaterialCommunityIcons name="meditation" size={24} color="#1E3A8A" />
          <Text style={styles.buttonText}>Meditation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityButton: {
    alignItems: 'center',
    padding: 8,
    width: '25%',
  },
  buttonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#1E3A8A',
    textAlign: 'center',
  },
});