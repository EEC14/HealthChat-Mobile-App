// In app/components/VoiceGuidancePlayer.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { workoutVoiceQueue } from '../utils/workoutVoiceQueue';
import { AudioCue } from '../types/voiceTypes';

interface VoiceGuidancePlayerProps {
  exerciseCues: AudioCue[];
  onComplete?: () => void;
}

export const VoiceGuidancePlayer: React.FC<VoiceGuidancePlayerProps> = ({
  exerciseCues,
  onComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCue, setCurrentCue] = useState<AudioCue | null>(null);
  const [skipNonExercises, setSkipNonExercises] = useState(false);

  useEffect(() => {
    const checkCurrentCue = setInterval(() => {
      const cue = workoutVoiceQueue.getCurrentCue();
      setCurrentCue(cue);
    }, 1000);

    return () => {
      clearInterval(checkCurrentCue);
      workoutVoiceQueue.stopQueue();
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await workoutVoiceQueue.pauseQueue();
      setIsPlaying(false);
    } else {
      // Filter cues if skip mode is enabled
      const queue = workoutVoiceQueue.createQueue(
        skipNonExercises 
          ? exerciseCues.filter(cue => cue.type === 'exercise' && cue.duration > 0)
          : exerciseCues
      );
      await workoutVoiceQueue.startQueue(queue);
      setIsPlaying(true);
    }
  };

  const handleStop = async () => {
    await workoutVoiceQueue.stopQueue();
    setIsPlaying(false);
    onComplete?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.currentCueContainer}>
        <Text style={styles.label}>Current Exercise:</Text>
        <Text style={styles.cueText}>{currentCue?.text || 'Ready to start'}</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          onPress={() => setSkipNonExercises(!skipNonExercises)}
          style={[
            styles.toggleButton,
            skipNonExercises && styles.toggleButtonActive
          ]}
        >
          <Text style={[
            styles.toggleText,
            skipNonExercises && styles.toggleTextActive
          ]}>
            {skipNonExercises ? 'Timed Exercises Only' : 'All Instructions'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.button}>
          <Text style={styles.buttonText}>
            {isPlaying ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleStop} 
          style={[styles.button, styles.stopButton]}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  currentCueContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cueText: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggleContainer: {
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});