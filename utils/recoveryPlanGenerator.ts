import { RecoveryInputData, calculateRecoveryScore } from './recoveryCalculator';
import { RecoveryStatus } from '../types/WearableTypes';
export const generateRecoveryPlanQuestions = (): string[] => {
  return [
    "How intense was your most recent workout on a scale from 1-10?",
    "How many hours of sleep did you get last night?",
    "How would you rate your sleep quality from 1-10?",
    "Which muscle groups did you work in your last workout? (e.g., legs, chest, back, shoulders, arms, core)",
    "How sore are you currently on a scale from 1-10?"
  ];
};

export const generateRecoveryPlan = (
  goals: string, 
  answers: Record<string, string>,
  recoveryStatus?: RecoveryStatus | null): string => {
  // Parse the answers
  const workoutIntensity = parseInt(answers["How intense was your most recent workout on a scale from 1-10?"] || "5");
  const sleepHours = parseFloat(answers["How many hours of sleep did you get last night?"] || "7");
  const sleepQuality = parseInt(answers["How would you rate your sleep quality from 1-10?"] || "7");
  
  // Parse muscle groups from the answer
  const muscleGroupsAnswer = answers["Which muscle groups did you work in your last workout? (e.g., legs, chest, back, shoulders, arms, core)"] || "";
  const muscleGroups = muscleGroupsAnswer
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(group => ['legs', 'chest', 'back', 'shoulders', 'arms', 'core'].includes(group));
  
  const soreness = parseInt(answers["How sore are you currently on a scale from 1-10?"] || "3");
  
  // Calculate recovery score and get recommendations
  const { recoveryScore, recommendations } = calculateRecoveryScore({
    workoutIntensity,
    sleepHours,
    sleepQuality,
    muscleGroups,
    soreness
  });
  
  // Format the recovery score section
  const recoveryScoreSection = `# Your Recovery Score: ${recoveryScore}/100

## Training Recommendation
${recommendations.trainingAdvice}

## Recovery Activities
${recommendations.recoveryActivities.map(activity => (
  `### ${activity.title}
- **Duration:** ${activity.duration} minutes
- **Description:** ${activity.description}`
)).join('\n\n')}

## Nutrition Tips
${recommendations.nutritionTips.map(tip => `- ${tip}`).join('\n')}
`;

  // Add personalized goal-based content
  let personalizedContent = '';
  if (recoveryStatus) {
    personalizedContent += `
## Wearable Recovery Insights
- **Wearable Recovery Score:** ${recoveryStatus.score}/100
- **Status:** ${recoveryStatus.recommendation}
`;
  }
  
  if (goals.toLowerCase().includes('performance')) {
    personalizedContent += `
## Performance Optimization
- Prioritize recovery to maximize your next performance
- Consider tracking heart rate variability (HRV) to objectively measure recovery
- Focus on quality rather than quantity in your next training session
`;
  }
  
  if (goals.toLowerCase().includes('muscle') || goals.toLowerCase().includes('strength')) {
    personalizedContent += `
## Muscle Recovery Focus
- Ensure adequate protein intake (1.6-2.2g per kg of bodyweight)
- Prioritize sleep - aim for 7-9 hours for optimal muscle repair
- Consider branched-chain amino acids (BCAAs) if in a caloric deficit
`;
  }
  
  if (goals.toLowerCase().includes('injury') || goals.toLowerCase().includes('pain')) {
    personalizedContent += `
## Injury Prevention Focus
- Apply ice to sore areas for 15-20 minutes
- Consider gentle movement rather than complete rest for recovery
- Gradually increase training volume to prevent re-injury
`;
  }
  
  // Combine all sections
  return recoveryScoreSection + personalizedContent;
};