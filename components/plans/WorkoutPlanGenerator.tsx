import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import useHealthData  from '../../utils/useHealthData'; // Updated import path
import { Alert } from 'react-native';

// Define a fallback color or access the correct structure
const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

interface WorkoutPlanGeneratorProps {
  onGeneratePlan: (plan: string) => void;
  isGenerating: boolean;
  refreshHealthData?: () => Promise<void>;  // Add this property
}

// Define types for the workout data
interface Workout {
  type: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  calories: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  distance?: number;
}

const WorkoutPlanGenerator: React.FC<WorkoutPlanGeneratorProps> = ({
  onGeneratePlan,
  isGenerating,
  refreshHealthData
}) => {
  const { isLoading, recoveryStatus, healthData } = useHealthData();
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [focus, setFocus] = useState<string>('full-body');
  const [duration, setDuration] = useState<number>(30);
  const [showWearableInfo, setShowWearableInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Update intensity based on recovery status
  useEffect(() => {
    if (recoveryStatus) {
      if (recoveryStatus.score < 60) {
        setIntensity('low');
      } else if (recoveryStatus.score < 80) {
        setIntensity('medium');
      } else {
        setIntensity('high');
      }
    }
  }, [recoveryStatus]);


  const generatePlan = () => {
    const planDetails = {
      intensity,
      focus,
      duration,
      recoveryStatus: recoveryStatus || undefined,
      recentWorkouts: healthData?.workouts?.slice(0, 5) || [],
    };

    // This would typically pass to an AI service to generate the plan
    // For now, let's create a simple template
    const planTemplate = `# ${intensity.charAt(0).toUpperCase() + intensity.slice(1)} Intensity ${focus.charAt(0).toUpperCase() + focus.slice(1)} Workout
Duration: ${duration} minutes

${recoveryStatus ? `Recovery Status: ${recoveryStatus.score}/100 - ${recoveryStatus.recommendation}` : ''}

## Warm-up (5 minutes)
- Light cardio: 2 minutes
- Dynamic stretching: 3 minutes

## Main Workout
${getWorkoutByFocus(focus, intensity, duration - 10)}

## Cool Down (5 minutes)
- Static stretching
- Deep breathing

## Notes
${recoveryStatus && recoveryStatus.score < 70 
  ? '- Focus on proper form and listen to your body. This workout is designed for recovery.'
  : '- Push yourself during the intense intervals, but maintain proper form.'}
${healthData?.workouts && healthData.workouts.length > 0
  ? '- Based on your recent workout history, this plan emphasizes different muscle groups than your recent training.'
  : ''}
`;

    onGeneratePlan(planTemplate);
  };

  const getWorkoutByFocus = (focus: string, intensity: string, duration: number): string => {
    // Simplified workout generator
    const focusMap: Record<string, string> = {
      'full-body': `- Circuit Training: 3 rounds
  - Squats: ${intensity === 'low' ? '10' : intensity === 'medium' ? '15' : '20'} reps
  - Push-ups: ${intensity === 'low' ? '8' : intensity === 'medium' ? '12' : '16'} reps
  - Rows: ${intensity === 'low' ? '10' : intensity === 'medium' ? '15' : '20'} reps
  - Plank: ${intensity === 'low' ? '30' : intensity === 'medium' ? '45' : '60'} seconds
  - Rest between rounds: ${intensity === 'low' ? '90' : intensity === 'medium' ? '60' : '45'} seconds`,

      'upper-body': `- Upper Body Focus: 3 rounds
  - Push-ups: ${intensity === 'low' ? '8' : intensity === 'medium' ? '12' : '15'} reps
  - Tricep dips: ${intensity === 'low' ? '8' : intensity === 'medium' ? '12' : '15'} reps
  - Shoulder taps: ${intensity === 'low' ? '10' : intensity === 'medium' ? '16' : '20'} per side
  - Rest between rounds: ${intensity === 'low' ? '90' : intensity === 'medium' ? '60' : '45'} seconds`,

      'lower-body': `- Lower Body Focus: 3 rounds
  - Squats: ${intensity === 'low' ? '12' : intensity === 'medium' ? '15' : '20'} reps
  - Lunges: ${intensity === 'low' ? '8' : intensity === 'medium' ? '10' : '12'} per leg
  - Glute bridges: ${intensity === 'low' ? '12' : intensity === 'medium' ? '15' : '20'} reps
  - Rest between rounds: ${intensity === 'low' ? '90' : intensity === 'medium' ? '60' : '45'} seconds`,

      'cardio': `- Cardio Intervals: 
  - ${intensity === 'low' ? '30' : intensity === 'medium' ? '45' : '60'} seconds high intensity
  - ${intensity === 'low' ? '90' : intensity === 'medium' ? '60' : '45'} seconds recovery
  - Repeat for ${Math.floor(duration / 2)} minutes`,

      'core': `- Core Circuit: 3 rounds
  - Plank: ${intensity === 'low' ? '30' : intensity === 'medium' ? '45' : '60'} seconds
  - Bicycle crunches: ${intensity === 'low' ? '10' : intensity === 'medium' ? '15' : '20'} per side
  - Russian twists: ${intensity === 'low' ? '10' : intensity === 'medium' ? '15' : '20'} per side
  - Rest between rounds: ${intensity === 'low' ? '60' : intensity === 'medium' ? '45' : '30'} seconds`,
    };

    return focusMap[focus] || focusMap['full-body'];
  };

  const handleRefreshData = async () => {
    if (typeof refreshHealthData === 'function') {
      try {
        setIsRefreshing(true);
        await refreshHealthData();
        Alert.alert("Success", "Health data updated successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to update health data.");
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    wearableInfoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
    },
    wearableInfoButtonText: {
      fontSize: 14,
      marginLeft: 4,
    },
    loadingContainer: {
      padding: 30,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#666',
    },
    wearableInfoContainer: {
      margin: 16,
      marginTop: 0,
    },
    recoveryContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    recoveryTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    recoveryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recoveryScore: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    recoveryHigh: {
      backgroundColor: '#4caf50',
    },
    recoveryMedium: {
      backgroundColor: '#ff9800',
    },
    recoveryLow: {
      backgroundColor: '#f44336',
    },
    recoveryScoreText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    recoveryTextContainer: {
      flex: 1,
    },
    recoveryRecommendation: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 6,
    },
    recoveryFactors: {
      fontSize: 13,
      color: '#666',
    },
    recentWorkoutsContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    recentWorkoutsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    workoutItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    workoutType: {
      fontSize: 14,
      fontWeight: '500',
    },
    workoutTime: {
      fontSize: 13,
      color: '#666',
    },
    optionsContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 12,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    optionButton: {
      backgroundColor: '#f0f0f0',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    selectedOption: {
      // backgroundColor will be set dynamically
    },
    optionText: {
      fontSize: 14,
    },
    selectedOptionText: {
      color: '#fff',
    },
    intensityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    intensityButton: {
      flex: 1,
      backgroundColor: '#f0f0f0',
      paddingVertical: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      borderRadius: 8,
    },
    selectedIntensity: {
      // backgroundColor will be set dynamically
    },
    disabledIntensity: {
      backgroundColor: '#f0f0f0',
      opacity: 0.5,
    },
    intensityText: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectedIntensityText: {
      color: '#fff',
    },
    disabledIntensityText: {
      color: '#999',
    },
    recoveryWarning: {
      fontSize: 13,
      color: '#f44336',
      marginTop: 8,
      fontStyle: 'italic',
    },
    durationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    durationButton: {
      flex: 1,
      backgroundColor: '#f0f0f0',
      paddingVertical: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      borderRadius: 8,
    },
    selectedDuration: {
      // backgroundColor will be set dynamically
    },
    durationText: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectedDurationText: {
      color: '#fff',
    },
    generateButton: {
      marginHorizontal: 16,
      marginVertical: 24,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      // backgroundColor will be set dynamically
    },
    generatingButton: {
      opacity: 0.7,
    },
    generateButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 8,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Workout Plan</Text>
        
        {!isLoading && recoveryStatus && (
          <TouchableOpacity 
            style={[styles.wearableInfoButton, { backgroundColor: '#f0f5ff' }]}
            onPress={() => {
              setShowWearableInfo(!showWearableInfo);
            }}
          >
            <Ionicons name="fitness" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.wearableInfoButtonText, { color: PRIMARY_COLOR }]}>
              {showWearableInfo ? 'Hide health data' : 'Show health data'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading your health data...</Text>
        </View>
      ) : (
        <>
          {showWearableInfo && recoveryStatus && (
            <View style={styles.wearableInfoContainer}>
              <View style={styles.recoveryContainer}>
                <Text style={styles.recoveryTitle}>Your Recovery Status</Text>
                <View style={styles.recoveryInfo}>
                  <View style={[
                    styles.recoveryScore,
                    recoveryStatus.score > 80 ? styles.recoveryHigh :
                    recoveryStatus.score > 60 ? styles.recoveryMedium :
                    styles.recoveryLow
                  ]}>
                    <Text style={styles.recoveryScoreText}>{recoveryStatus.score}</Text>
                  </View>
                  <View style={styles.recoveryTextContainer}>
                    <Text style={styles.recoveryRecommendation}>
                      {recoveryStatus.recommendation}
                    </Text>
                    <Text style={styles.recoveryFactors}>
                      Sleep quality: {recoveryStatus.contributingFactors.sleepQuality}%
                    </Text>
                    <Text style={styles.recoveryFactors}>
                      Resting HR: {recoveryStatus.contributingFactors.restingHeartRate} bpm
                    </Text>
                  </View>
                </View>
              </View>
  
              {healthData?.workouts && healthData.workouts.length > 0 && (
                <View style={styles.recentWorkoutsContainer}>
                  <Text style={styles.recentWorkoutsTitle}>Recent Workouts</Text>
                  {healthData.workouts.slice(0, 2).map((workout, index) => (
                    <View key={index} style={styles.workoutItem}>
                      <Text style={styles.workoutType}>{workout.type}</Text>
                      <Text style={styles.workoutTime}>
                        {new Date(workout.startTime.toDate()).toLocaleDateString()} • {
                          Math.round(
                            (workout.endTime.toDate().getTime() - workout.startTime.toDate().getTime()) / 60000
                          )} min
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
  
          {/* Health Data Refresh Button */}
          {!isLoading && refreshHealthData && (
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
                backgroundColor: '#f0f5ff',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                marginTop: 12,
                marginBottom: 12
              }}
              onPress={async () => {
                if (refreshHealthData) {
                  try {
                    setIsRefreshing(true);
                    await refreshHealthData();
                    Alert.alert("Success", "Health data updated successfully!");
                  } catch (error) {
                    console.error('Error refreshing health data:', error);
                    Alert.alert("Error", "Failed to update health data.");
                  } finally {
                    setIsRefreshing(false);
                  }
                }
              }}
              disabled={isRefreshing}
            >
              <Ionicons 
                name="refresh" 
                size={18} 
                color={isRefreshing ? "#999" : PRIMARY_COLOR} 
              />
              <Text style={{ marginLeft: 8, color: isRefreshing ? "#999" : PRIMARY_COLOR }}>
                {isRefreshing ? "Refreshing..." : "Refresh Health Data"}
              </Text>
            </TouchableOpacity>
          )}
  
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Workout Focus</Text>
            <View style={styles.optionsRow}>
              {['full-body', 'upper-body', 'lower-body', 'cardio', 'core'].map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    focus === item && [styles.selectedOption, { backgroundColor: PRIMARY_COLOR }]
                  ]}
                  onPress={() => {
                    setFocus(item);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    focus === item && styles.selectedOptionText
                  ]}>
                    {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
  
            <Text style={styles.sectionTitle}>Intensity</Text>
            <View style={styles.intensityContainer}>
              {['low', 'medium', 'high'].map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.intensityButton,
                    intensity === item && [styles.selectedIntensity, { backgroundColor: PRIMARY_COLOR }],
                    recoveryStatus && recoveryStatus.score < 60 && item !== 'low' && styles.disabledIntensity
                  ]}
                  onPress={() => {
                    if (!(recoveryStatus && recoveryStatus.score < 60 && item !== 'low')) {
                      setIntensity(item as 'low' | 'medium' | 'high');
                    }
                  }}
                >
                  <Text style={[
                    styles.intensityText,
                    intensity === item && styles.selectedIntensityText,
                    recoveryStatus && recoveryStatus.score < 60 && item !== 'low' && styles.disabledIntensityText
                  ]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {recoveryStatus && recoveryStatus.score < 60 && (
              <Text style={styles.recoveryWarning}>
                High intensity workouts not recommended based on your recovery status
              </Text>
            )}
  
            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <View style={styles.durationContainer}>
              {[15, 30, 45, 60].map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.durationButton,
                    duration === item && [styles.selectedDuration, { backgroundColor: PRIMARY_COLOR }]
                  ]}
                  onPress={() => {
                    setDuration(item);
                  }}
                >
                  <Text style={[
                    styles.durationText,
                    duration === item && styles.selectedDurationText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
  
      <TouchableOpacity
        style={[
          styles.generateButton, 
          { backgroundColor: PRIMARY_COLOR },
          isGenerating && styles.generatingButton
        ]}
        onPress={() => {
          generatePlan();
        }}
        disabled={isGenerating || isLoading}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.generateButtonText}>Generating...</Text>
          </>
        ) : (
          <Text style={styles.generateButtonText}>Generate Workout Plan</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

};

export default WorkoutPlanGenerator;