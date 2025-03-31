export interface RecoveryInputData {
    workoutIntensity: number;
    sleepHours: number;
    sleepQuality: number;
    muscleGroups: string[];
    soreness: number;
  }
  
  export interface RecoveryRecommendation {
    trainingAdvice: string;
    workoutIntensityModifier: number;
    recoveryActivities: RecoveryActivity[];
    nutritionTips: string[];
  }
  
  export interface RecoveryActivity {
    type: 'foam_rolling' | 'mobility' | 'stretching' | 'contrast_therapy' | 'meditation';
    title: string;
    duration: number;
    description: string;
  }
  
  export const calculateRecoveryScore = (data: RecoveryInputData): {
    recoveryScore: number;
    recommendations: RecoveryRecommendation;
  } => {
    let score = 100;
    
    // Calculate base recovery score from inputs
    score -= data.workoutIntensity * 3;
    score -= (8 - data.sleepHours) * 5;
    score -= (10 - data.sleepQuality) * 2;
    score -= data.soreness * 3;
    
    // If they worked out major muscle groups, reduce score more
    if (data.muscleGroups.includes('legs') || 
        data.muscleGroups.includes('back') || 
        data.muscleGroups.includes('chest')) {
      score -= 5;
    }
    
    // Ensure score stays within 0-100 range
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    // Generate recommendations
    const recommendations = generateRecoveryRecommendations(
      score, 
      data.muscleGroups, 
      data.soreness
    );
    
    return {
      recoveryScore: score,
      recommendations
    };
  };
  
  // Generate recovery recommendations
  const generateRecoveryRecommendations = (
    score: number, 
    muscleGroups: string[], 
    soreness: number
  ): RecoveryRecommendation => {
    const recommendations: RecoveryRecommendation = {
      trainingAdvice: '',
      workoutIntensityModifier: 1.0,
      recoveryActivities: [],
      nutritionTips: []
    };
    
    // Training advice based on recovery score
    if (score < 30) {
      recommendations.trainingAdvice = 'Rest day recommended. Focus on recovery activities only.';
      recommendations.workoutIntensityModifier = 0;
    } else if (score < 50) {
      recommendations.trainingAdvice = 'Light activity only. Consider active recovery or mobility work.';
      recommendations.workoutIntensityModifier = 0.5;
    } else if (score < 70) {
      recommendations.trainingAdvice = 'Moderate training ok. Avoid high intensity on previously worked muscle groups.';
      recommendations.workoutIntensityModifier = 0.7;
    } else if (score < 85) {
      recommendations.trainingAdvice = 'Regular training is fine. Listen to your body during the session.';
      recommendations.workoutIntensityModifier = 0.9;
    } else {
      recommendations.trainingAdvice = 'You\'re fully recovered. Great day for challenging workouts.';
      recommendations.workoutIntensityModifier = 1.0;
    }
    
    // Recovery activities based on muscle groups and soreness
    if (muscleGroups.includes('legs') && soreness > 5) {
      recommendations.recoveryActivities.push({
        type: 'foam_rolling',
        title: 'Foam Roll: Lower Body',
        duration: 10,
        description: 'Focus on quads, hamstrings, and calves'
      });
    }
    
    if ((muscleGroups.includes('back') || muscleGroups.includes('chest')) && soreness > 4) {
      recommendations.recoveryActivities.push({
        type: 'mobility',
        title: 'Thoracic Spine Mobility',
        duration: 8,
        description: 'Focus on thoracic extensions and rotations'
      });
    }
    
    // Add generic recovery activities
    recommendations.recoveryActivities.push({
      type: 'stretching',
      title: 'Full Body Stretching Routine',
      duration: 15,
      description: 'Gentle static stretches for whole body'
    });
    
    if (score < 60) {
      recommendations.recoveryActivities.push({
        type: 'contrast_therapy',
        title: 'Contrast Shower',
        duration: 10,
        description: '30 seconds cold, 1 minute warm, repeat 5 times'
      });
    }
    
    // Add meditation for mental recovery
    if (score < 70 || soreness > 6) {
      recommendations.recoveryActivities.push({
        type: 'meditation',
        title: 'Recovery Meditation',
        duration: 10,
        description: 'Guided relaxation focused on muscle recovery'
      });
    }
    
    // Nutrition tips
    recommendations.nutritionTips = [
      'Focus on protein intake for muscle repair',
      'Stay hydrated throughout the day',
      'Consider foods rich in anti-inflammatory compounds like turmeric, ginger, and fatty fish'
    ];
    
    return recommendations;
  };