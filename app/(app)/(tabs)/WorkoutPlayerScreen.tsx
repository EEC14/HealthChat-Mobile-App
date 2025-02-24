import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { VoiceGuidancePlayer } from '../../../components/VoiceGuidancePlayer';
import { VoiceGuidanceSettings } from '../../../components/VoiceGuidanceSettings';
import { AudioCue, VoiceGuidanceConfig } from '../../../types/voiceTypes';
import { voiceGuidanceManager } from '../../../utils/voiceGuidance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutPlayerScreen: React.FC = () => {
  const [settings, setSettings] = useState<VoiceGuidanceConfig | null>(null);

  // Example workout cues - in real app, these would come from your workout plan generator
  const sampleWorkoutCues: AudioCue[] = [
    {
      id: '1',
      type: 'exercise',
      text: 'Starting workout. First exercise: Push-ups',
      duration: 3,
      priority: 1,
    },
    {
      id: '2',
      type: 'form',
      text: 'Keep your core tight and back straight',
      duration: 3,
      priority: 2,
    },
    {
      id: '3',
      type: 'countdown',
      text: 'Starting in 3, 2, 1',
      duration: 3,
      priority: 1,
    },
    // Add more exercises as needed
  ];

  useEffect(() => {
    const initVoiceGuidance = async () => {
      // Initialize audio
      await voiceGuidanceManager.init();

      // Load saved settings
      try {
        const savedSettings = await AsyncStorage.getItem('voiceGuidanceSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    initVoiceGuidance();

    return () => {
      voiceGuidanceManager.stop();
    };
  }, []);

  const handleSettingsChange = (newSettings: VoiceGuidanceConfig) => {
    setSettings(newSettings);
  };

  const handleWorkoutComplete = () => {
    // Handle workout completion - navigate away or show summary
    console.log('Workout completed');
  };

  return (
    <ScrollView style={styles.container}>
      <VoiceGuidanceSettings onSettingsChange={handleSettingsChange} />
      <VoiceGuidancePlayer 
        exerciseCues={sampleWorkoutCues}
        onComplete={handleWorkoutComplete}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default WorkoutPlayerScreen;