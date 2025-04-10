import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView
} from "react-native";
import { generatePlan, generatePlanQuestions, parseWorkoutPlan } from "@/utils/OpenAi";
import Markdown from "react-native-markdown-display";
import { ColorsType, FoodItem, PlanType, StepType } from "@/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useAuthContext } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { Theme, useTheme } from "@/context/ThemeContext";
import { MotiText } from "moti";
import { Link } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { AudioCue } from "@/types/voiceTypes";
import { useTranslation } from 'react-i18next';
import { VoiceGuidancePlayer } from "@/components/VoiceGuidancePlayer";
import { SavedPlansModal } from "@/components/DietPlan/SavedPlansModal";
import { PlanModifierToolbar } from "@/components/DietPlan/PlanModifierToolbar";
import { savePlan, updatePlan } from "@/utils/planStorage";
import { RecoveryScoreCard } from '../../../components/Recovery/RecoveryScoreCard';
import { generateRecoveryPlan, generateRecoveryPlanQuestions } from '../../../utils/recoveryPlanGenerator';
import NutritionScannerScreen from '@/components/nutrition/NutritionScannerScreen';
import WearableIntegrationScreen from '@/components/wearable/WearableIntegrationScreen';
import useHealthData from '@/utils/useHealthData';
import WorkoutPlanGenerator from '@/components/plans/WorkoutPlanGenerator';
import { getUserWearableConnections } from "@/utils/wearableService";

const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

const getRecoveryScoreFromPlan = (plan: string): number => {
  // Extract score from the plan text
  const scoreMatch = plan.match(/Your Recovery Score: (\d+)\/100/);
  if (scoreMatch && scoreMatch[1]) {
    return parseInt(scoreMatch[1]);
  }
  return 70;
};

const CarePlan: React.FC = () => {
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [step, setStep] = useState<StepType>("select");
  const [goals, setGoals] = useState("");
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedPlan, setGeneratedPlan] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [workoutAudioCues, setWorkoutAudioCues] = useState<AudioCue[] | null>(null);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dietView, setDietView] = useState<'plan' | 'scanner'>('plan');
  const [showWearableSetup, setShowWearableSetup] = useState(false);
  const { t } = useTranslation();
  const [ scannedItems, setScannedItems ] = useState<FoodItem[]>([]);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const { isLoading: isHealthDataLoading, healthData, recoveryStatus, dataAvailability, error: healthDataError, refreshData } = useHealthData();
  const didAttemptRefresh = React.useRef(false);
  const previousDataState = React.useRef('');
  const didInitialRefresh = React.useRef(false);



  useEffect(() => {
    // Only log when isLoading changes to avoid excessive logging
    if (healthData && dataAvailability) {
      const healthDataState = {
        hasSteps: healthData.steps?.length > 0,
        hasHeartRate: healthData.heartRate?.length > 0,
        hasSleepData: healthData.sleepData?.length > 0,
        hasWorkouts: healthData.workouts?.length > 0,
      };
      
      // Stringify to compare with previous state
      const stateString = JSON.stringify(healthDataState);
      if (stateString !== previousDataState.current) {
        previousDataState.current = stateString;
      }
    }
  }, [healthData, dataAvailability, isHealthDataLoading]);
  


  const handleGoalsSubmit = async () => {
    if (!goals.trim()) return;
    setIsLoading(true);
    try {
      if (planType === "recovery") {
        // For recovery, we can use pre-defined questions
        const recoveryQuestions = generateRecoveryPlanQuestions();
        setQuestions(recoveryQuestions);
        setStep("questionnaire");
        setIsLoading(false);
        return;
      }
      const generatedQuestions = await generatePlanQuestions(planType!, goals);

      setQuestions(generatedQuestions);
      setStep("questionnaire");
    } catch (error) {
      Alert.alert("Error", "Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  function formatWorkoutPlan(plan: string): string {
    const cleanPlan = plan.replace(/```json[\s\S]*?```/g, '');
    return cleanPlan
      .replace(/\*\*Form Tips:\*\*/g, '#### Form Tips:')
      .replace(/\*\*Description:\*\*/g, '#### Description:')
      .replace(/\*\*Sets:\*\*/g, '**🔄 Sets:**')
      .replace(/\*\*Reps:\*\*/g, '**🔁 Reps:**')
      .replace(/\*\*Duration:\*\*/g, '**⏱️ Duration:**')
      .replace(/\*\*Rest:\*\*/g, '**💤 Rest:**');
  }

  const handleAnswersSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (planType === "recovery") {
        const plan = generateRecoveryPlan(goals, answers, recoveryStatus);
        setGeneratedPlan(plan);
        setStep("plan");
        setIsLoading(false);
        return;
      }
      const enhancedAnswers = { ...answers };
      let additionalData = {};
      if (healthData) {
        if (planType === 'workout' && recoveryStatus) {
          enhancedAnswers['__healthData__'] = 
            `Recovery Status: ${recoveryStatus.score}/100. ${recoveryStatus.recommendation}`;
          
          if (healthData.workouts && healthData.workouts.length > 0) {
            const recentWorkouts = healthData.workouts.slice(0, 3).map(w => 
              `${w.type} on ${new Date(w.startTime.toDate()).toLocaleDateString()}`
            ).join(', ');
            enhancedAnswers['__recentWorkouts__'] = `Recent workouts: ${recentWorkouts}`;
          }
        } 
        else if (planType === 'diet') {
          if (healthData.caloriesBurned?.length > 0) {
            const activityLevel = healthData.caloriesBurned[0].value > 2000 ? 'high' : 'moderate';
            enhancedAnswers['__activityLevel__'] = 
              `Activity level based on wearable data: ${activityLevel}`;
          }
        }
      }
      
      // Call the original function with the enhanced answers
      const plan = await generatePlan(planType!, goals, enhancedAnswers);  
      if (planType === 'workout') {
        try {
          const audioCues = parseWorkoutPlan(plan);
          setWorkoutAudioCues(audioCues);
        } catch (parseError) {
          console.error('Error parsing workout plan:', parseError);
        }
      }
      
      setGeneratedPlan(plan);
      setCurrentPlanId(null); // Reset current plan ID as this is a newly generated plan
      setStep("plan");
    } catch (error) {
      console.error("Full error generating plan:", error);
      if (error instanceof Error) {
      Alert.alert("Error", `Failed to generate the plan. Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (type: PlanType) => {
    setPlanType(type);
    if (type === 'workout' && healthData && recoveryStatus) {
      setStep("plan");
      setGeneratedPlan("");
    } else {
      setStep("questionnaire");
    }
  };

  const resetPlan = useCallback(() => {
    setPlanType(null);
    setGoals("");
    setQuestions([]);
    setAnswers({});
    setGeneratedPlan("");
    setWorkoutAudioCues(null);
    setCurrentPlanId(null);
    setIsEditing(false);
    setStep("select");
  }, []);

  const handlePlanModification = (updatedPlan: string) => {
    // Make sure we're not setting the same plan again
    if (updatedPlan === generatedPlan) {
      return;
    }
    
    // First update the plan text
    setGeneratedPlan(updatedPlan);
    
    // If this is a workout plan, we need to update the audio cues
    if (planType === 'workout') {
      try {
        const updatedAudioCues = parseWorkoutPlan(updatedPlan);
        setWorkoutAudioCues(updatedAudioCues);
      } catch (error) {
        console.error('Error parsing modified workout plan:', error);
      }
    }
    
    // Set editing mode
    setIsEditing(true);
  };

  const handleSavePlan = async (name: string) => {  
    if (!user?.uid) {
      console.error('No user ID available');
      Alert.alert('Error', 'User not authenticated');
      return;
    }
  
    if (!planType) {
      console.error('No plan type specified');
      Alert.alert('Error', 'Plan type not specified');
      return;
    }
    try{
        // If we're editing an existing plan
        const planData = {
          name: name,
          plan: generatedPlan,
          audioCues: planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined,
          scannedFoods: planType === 'diet' ? scannedItems : undefined
        };
      if (currentPlanId) {
        await updatePlan(currentPlanId, {
          name: name,
          plan: generatedPlan,
          audioCues: planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined,
          scannedFoods: planType === 'diet' ? scannedItems : undefined
        });
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        // Creating a new plan
        const savedPlanId = await savePlan(
          user.uid,
          planType,
          name,
          generatedPlan,
          planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined,
          planType === 'diet' ? scannedItems : undefined
        );
        setCurrentPlanId(savedPlanId);
        Alert.alert('Success', 'Plan saved successfully');
      }
      
      // Reset editing state after saving
      setIsEditing(false);
    } catch (error) {
      console.error('Error in handleSavePlan:', error);
      if (error instanceof Error) {
        Alert.alert('Error', `Failed to save plan: ${error.message}`);
      }
    }
  };

  const addJsonBlocksIfNeeded = (plan: string): string => {
    // If plan already contains JSON blocks, return as is
    if (plan.includes('```json')) {
      return plan;
    }
    
    // Otherwise, add basic JSON blocks for exercises
    // Extract exercises from plan text using regex
    const exerciseRegex = /- ([^:]+): (\d+) reps/g;
    const exercises = [];
    let match;
    
    while ((match = exerciseRegex.exec(plan)) !== null) {
      exercises.push({
        name: match[1].trim(),
        sets: 3, // Default value
        reps: parseInt(match[2]),
        duration: 0,
        rest: 60 // Default rest time
      });
    }
    
    // If no exercises found, create a placeholder
    if (exercises.length === 0) {
      exercises.push({
        name: "Exercise",
        sets: 3,
        reps: 12,
        duration: 0,
        rest: 60
      });
    }
    
    // Create the JSON block
    const jsonBlock = `\`\`\`json
  {
    "exercises": ${JSON.stringify(exercises, null, 2)}
  }
  \`\`\``;
    
    // Append to plan
    return plan + '\n\n' + jsonBlock;
  };

  const handleWearableConnection = async () => {
    setIsLoading(true);
    
    try {
      // Call refreshData directly instead of healthData.refreshData
      if (typeof refreshData === 'function') {
        await refreshData();
        
        // Show success message with recovery score if available
        if (recoveryStatus) {
          Alert.alert(
            "Health Data Updated", 
            `Your health data has been synced. Your current recovery score is ${recoveryStatus.score}/100.`
          );
        } else {
          Alert.alert(
            "Health Data Updated",
            "Your health data has been synced successfully."
          );
        }
        
        // If we're in workout plan view, refresh the UI
        if (planType === 'workout' && step === 'plan') {
          setIsEditing(true); 
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing health data:', error);
      Alert.alert(
        "Sync Failed",
        "There was a problem updating your health data. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkWearableConnectionStatus = useCallback(async () => {
    
    if (!user?.uid) {
      return false;
    }
    
    try {
      const connections = await getUserWearableConnections(user.uid);
      const hasConnectedDevice = connections.some(c => c.isConnected);
      if (hasConnectedDevice && !didInitialRefresh.current) {
        didInitialRefresh.current = true;
        
        if (refreshData) {
          setIsLoading(true);
          await refreshData();
          setIsLoading(false);
        }
      }
      
      return hasConnectedDevice;
    } catch (error) {
      console.error('Error checking wearable connection status:', error);
      return false;
    }
  }, [user?.uid, refreshData]);

  const didRunInitialCheck = React.useRef(false);
  useEffect(() => {
    if (planType === 'workout' && !didRunInitialCheck.current) {
      checkWearableConnectionStatus();
      didRunInitialCheck.current = true;
    }
  }, [planType]);

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: currentColors.surface,
          borderBottomColor: currentColors.border,
        },
      ]}
    >
      {step !== "select" && (
        <TouchableOpacity
          onPress={() => {
            if (step === "plan") {
              setStep("questionnaire");
              setShowWearableSetup(false);
            } else if (step === "questionnaire") {
              setStep("select");
            }
          }}
          style={styles.backButton}
        >
          <AntDesign
            name="arrowleft"
            size={20}
            color={currentColors.textPrimary}
          />
        </TouchableOpacity>
      )}
        <Text style={[styles.headerTitle, { color: currentColors.textPrimary }]}>
          {step === "select" && "Choose a Plan"}
          {step === "questionnaire" &&
            `${planType === "workout" ? "Workout" : 
              planType === "diet" ? "Diet" : 
              planType === "meditation" ? "Meditation" : 
              "Habit Stacking"} Questions`}
          {step === "plan" && "Your Personalized Plan"}
        </Text>
      <View style={styles.headerActions}>

      {step === "plan" && planType === "workout" && recoveryStatus && !showWorkoutGenerator && (
        <TouchableOpacity
          onPress={() => setShowWorkoutGenerator(true)}
          style={styles.customizeButton}
        >
          <MaterialCommunityIcons name="dumbbell" size={20} color="#007AFF" />
          <Text style={styles.customizeButtonText}>Customize</Text>
        </TouchableOpacity>
      )}

      {step === "plan" && !showWearableSetup &&(
        <>
          {isEditing && (
            <TouchableOpacity
              onPress={() => {
                Alert.prompt(
                  'Save Plan',
                  'Enter a name for this plan:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Save',
                      onPress: (name) => {
                        if (name) {
                          handleSavePlan(name);
                        } else {
                          Alert.alert('Error', 'Please enter a name for the plan');
                        }
                      }
                    }
                  ],
                  'plain-text',
                  currentPlanId ? 'Modified Plan' : '',
                  'default'
                );
              }}
              style={styles.saveButton}
            >
              <AntDesign name="save" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                Alert.prompt(
                  'Save Plan',
                  'Enter a name for this plan:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Save',
                      onPress: (name) => {
                        if (name) {
                          handleSavePlan(name);
                        } else {
                          Alert.alert('Error', 'Please enter a name for the plan');
                        }
                      }
                    }
                  ],
                  'plain-text',
                  '',
                  'default'
                );
              }}
              style={styles.saveButton}
            >
              <AntDesign name="save" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}

          {(planType === 'workout' || planType === 'recovery') && (
          <TouchableOpacity
            onPress={() => setShowWearableSetup(true)}
            style={styles.wearableButton}
          >
            <MaterialCommunityIcons name="watch" size={20} color="#007AFF" />
          </TouchableOpacity>
          )}
        </>
      )}
      <TouchableOpacity
        onPress={() => setShowSavedPlans(true)}
        style={styles.savedPlansButton}
      >
        <AntDesign name="folder1" size={20} color="#007AFF" />
      </TouchableOpacity>
        {step !== "select" && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              gap: 2,
              paddingHorizontal: 8,
              paddingVertical: 3,
              backgroundColor: "#c2e0ff",
              borderRadius: 4,
              alignItems: "center",
            }}
            onPress={() => setIsResetModalVisible(true)}
          >
            <Text>Reset</Text>
            <AntDesign name="reload1" size={17} color="#007BFF" />
          </TouchableOpacity>
        )}
      </View>

    </View>
  );

  const renderResetModal = () => (
    <Modal
      visible={isResetModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsResetModalVisible(false)}
    >
      <View style={[styles.modalContainer]}>
        <View
          style={[
            styles.resetModalContent,
            { backgroundColor: currentColors.surface },
          ]}
        >
          <Text
            style={[
              styles.resetModalTitle,
              { color: currentColors.textPrimary },
            ]}
          >
            {t('dietPlan.questionnaire.resetButton')}
          </Text>
          <Text
            style={[
              styles.resetModalSubtitle,
              { color: currentColors.textSecondary },
            ]}
          >
            {t('dietPlan.questionnaire.resetQuestion')}
          </Text>
          <View style={styles.resetModalButtons}>
            <TouchableOpacity
              style={[
                styles.resetModalCancelButton,
                { backgroundColor: currentColors.secondary },
              ]}
              onPress={() => setIsResetModalVisible(false)}
            >
              <Text
                style={[
                  styles.resetModalCancelButtonText,
                  { color: currentColors.textPrimary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resetModalConfirmButton,
                { backgroundColor: currentColors.primary },
              ]}
              onPress={() => {
                resetPlan();
                setIsResetModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.resetModalConfirmButtonText,
                  { color: currentColors.background },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCustomizeModal = () => (
    <Modal
      visible={showCustomizeModal}
      animationType="slide"
      onRequestClose={() => setShowCustomizeModal(false)}
    >
      <SafeAreaView style={{flex: 1}}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef'
        }}>
          <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
            <AntDesign name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            Customize Workout
          </Text>
          <View style={{width: 24}} />
        </View>
        
        <WorkoutPlanGenerator
          onGeneratePlan={(plan) => {
            // When a plan is generated, add JSON blocks if needed
            // and update the main plan
            const enhancedPlan = addJsonBlocksIfNeeded(plan);
            setGeneratedPlan(enhancedPlan);
            
            // Try to parse workout audio cues
            try {
              const audioCues = parseWorkoutPlan(enhancedPlan);
              setWorkoutAudioCues(audioCues);
            } catch (error) {
              console.error('Error parsing workout plan:', error);
            }
            
            // Mark the plan as edited so the save button appears
            setIsEditing(true);
            
            // Close the modal
            setShowCustomizeModal(false);
          }}
          isGenerating={isLoading}
          refreshHealthData={refreshData}        />
      </SafeAreaView>
    </Modal>
  );

  const renderContent = () => {
    if (step === "select") {
      return (
      <ScrollView
        style={{ backgroundColor: currentColors.background, flex: 1 }}
        contentContainerStyle={styles.selectContainer}
        showsVerticalScrollIndicator={true}
      >
          <View style={[styles.card, { backgroundColor: currentColors.warn }]}>
            <View style={styles.highlight}>
              <Text>
              {t('dietPlan.questionnaire.disclaimer')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setPlanType("workout");
              setStep("questionnaire");
            }}
            style={[
              styles.card,
              {
                backgroundColor: currentColors.surface,
                borderWidth: 1,
                borderColor: currentColors.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={24}
                color={currentColors.textPrimary}
              />
            </View>
            <Text
              style={[styles.cardTitle, { color: currentColors.textPrimary }]}
            >
              Workout Plan
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              {t('dietPlan.questionnaire.routineEx')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPlanType("diet");
              setStep("questionnaire");
            }}
            style={[
              styles.card,
              {
                backgroundColor: currentColors.surface,
                borderWidth: 1,
                borderColor: currentColors.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5
                name="utensils"
                size={24}
                color={currentColors.textPrimary}
              />
            </View>
            <Text
              style={[styles.cardTitle, { color: currentColors.textPrimary }]}
            >
              Diet & Nutrition Plan
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              {t('dietPlan.questionnaire.mealPl')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPlanType("meditation");
              setStep("questionnaire");
            }}
            style={[
              styles.card,
              {
                backgroundColor: currentColors.surface,
                borderWidth: 1,
                borderColor: currentColors.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5
                name="om"
                size={24}
                color={currentColors.textPrimary}
              />
            </View>
            <Text
              style={[styles.cardTitle, { color: currentColors.textPrimary }]}
            >
              Meditation Plan
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              {t('dietPlan.questionnaire.medPl')}
            </Text>  
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPlanType("habit");
              setStep("questionnaire");
            }}
            style={[
              styles.card,
              {
                backgroundColor: currentColors.surface,
                borderWidth: 1,
                borderColor: currentColors.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5
                name="link"
                size={24}
                color={currentColors.textPrimary}
              />
            </View>
            <Text
              style={[styles.cardTitle, { color: currentColors.textPrimary }]}
            >
              Habit Stacking Plan
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                { color: currentColors.textSecondary },
              ]}
            >
              Build sustainable habits with linked routines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
              onPress={() => {
                setPlanType("recovery");
                setStep("questionnaire");
              }}
              style={[
                styles.card,
                {
                  backgroundColor: currentColors.surface,
                  borderWidth: 1,
                  borderColor: currentColors.border,
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={24}
                  color={currentColors.textPrimary}
                />
              </View>
              <Text
                style={[styles.cardTitle, { color: currentColors.textPrimary }]}
              >
                Recovery Optimization
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: currentColors.textSecondary },
                ]}
              >
                Optimize rest and recovery between workouts
              </Text>
            </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
      );
    };

    if (step === "questionnaire") {
      return (
        <SafeAreaView
          style={{ flex: 1, backgroundColor: currentColors.background }}
        >
          <ScrollView contentContainerStyle={[styles.scrollContainer]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              {questions.length === 0 ? (
                <View style={[styles.questionContainer]}>
                  <Text
                    style={[styles.label, { color: currentColors.textPrimary }]}
                  >
                    What are your{" "}
                    {planType === "workout" ? "Workout" : 
                    planType === "diet" ? "Diet" : 
                    planType === "meditation" ? "Meditation" : 
                    planType === "habit" ? "Habit Stacking":
                    "Recovery"} goals?
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: currentColors.textPrimary },
                    ]}
                    placeholderTextColor={currentColors.textSecondary}
                    placeholder={`Describe your ${planType} goals...`}
                    value={goals}
                    onChangeText={setGoals}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { backgroundColor: "#1E3A8A" },
                      goals.trim() ? {} : styles.disabled,
                      isLoading && styles.disabled,
                    ]}
                    onPress={handleGoalsSubmit}
                    disabled={!goals.trim() || isLoading}
                  >
                    {isLoading && (
                      <ActivityIndicator color={currentColors.textPrimary} />
                    )}
                    <Text style={styles.buttonText}>
                      {isLoading ? "Generating Questions..." : "Continue"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                questions.map((question, index) => (
                  <View key={index} style={styles.questionContainer}>
                    <Markdown
                      style={getMarkdownStyles(currentColors)}
                    >{`${question}`}</Markdown>
                    {question.includes("?") && (
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            color: currentColors.textPrimary,
                            borderColor: currentColors.border,
                          },
                        ]}
                        placeholder="Your answer..."
                        placeholderTextColor={currentColors.textSecondary}
                        value={answers[question] || ""}
                        onChangeText={(text) =>
                          setAnswers((prev) => ({ ...prev, [question]: text }))
                        }
                        multiline
                      />
                    )}
                  </View>
                ))
              )}
              {questions.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: "#1E3A8A" },
                    !questions.every((q) => answers[q]?.trim()) &&
                      styles.disabled,
                    isLoading && styles.disabled,
                  ]}
                  onPress={handleAnswersSubmit}
                  disabled={
                    !questions.every((q) => answers[q]?.trim()) || isLoading
                  }
                >
                  {isLoading && (
                    <ActivityIndicator color={currentColors.textPrimary} />
                  )}
                  <Text style={styles.buttonText}>
                    {isLoading ? "Generating ..." : "Generate Plan"}
                  </Text>
                </TouchableOpacity>
              )}
            </KeyboardAvoidingView>
          </ScrollView>
        </SafeAreaView>
      );
    }

    if (step === "plan") {
      if (showWearableSetup) {
        return (
          <WearableIntegrationScreen 
            onGoBack={() => setShowWearableSetup(false)}
            onDeviceConnected={async () => {
              setIsLoading(true);
              try {
                if (refreshData) {
                  await refreshData();
                }
                setShowWearableSetup(false);
              } catch (error) {
                console.error('Error refreshing data after connection:', error);
              } finally {
                setIsLoading(false);
              }
            }}
          />
        );
      }
      
      return (
        <View style={{flex: 1, position: 'relative'}}>
          {planType !== "diet" ? (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContainer,
                { backgroundColor: currentColors.background },
              ]}
              style={{ marginBottom: 70 }} // Add space for the toolbar
            >
              <Text style={[styles.planTitle, { color: currentColors.textPrimary }]}>
                Your {planType === "workout" ? "Workout" : 
                  planType === "meditation" ? "Meditation" : 
                  planType === "habit" ? "Habit Stacking":
                  "Recovery"} Plan
              </Text>
              
              {planType === 'workout' ? (
                <>
                  {/* Connection Status Check */}
                  {isHealthDataLoading ? (
                    <View style={{
                      backgroundColor: '#f5f5f5',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
                      alignItems: 'center'
                    }}>
                      <ActivityIndicator size="small" color="#1E3A8A" />
                      <Text style={{marginTop: 8}}>Loading health data...</Text>
                    </View>
                  ) : (!dataAvailability?.hasHeartRateData && !dataAvailability?.hasWorkouts) ? (
                    <View style={{
                      backgroundColor: '#fff8e1',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                      borderLeftWidth: 4,
                      borderLeftColor: '#ffc107',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        No Health Data Available
                      </Text>
                      <Text style={{ marginBottom: 12 }}>
                        {(user?.connectedWearables || []).length > 0
                          ? "Your wearable is connected, but no health data is available yet. This may take a moment to sync."
                          : "Connect a wearable device to get personalized workout recommendations based on your recovery status."}
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#1E3A8A',
                          padding: 10,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if ((user?.connectedWearables || []).length > 0 && refreshData) {
                            // Try refreshing data first
                            setIsLoading(true);
                            refreshData().finally(() => {
                              setIsLoading(false);
                              // If still no data, show setup screen
                              if (!dataAvailability?.hasHeartRateData) {
                                setShowWearableSetup(true);
                              }
                            });
                          } else {
                            setShowWearableSetup(true);
                          }
                        }}
                      >
                        <Text style={{ color: 'white' }}>
                          {(user?.connectedWearables || []).length > 0 ? "Refresh Health Data" : "Connect Wearable"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : healthDataError ? (
                    <View style={{
                      backgroundColor: '#ffebee',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                      borderLeftWidth: 4,
                      borderLeftColor: '#f44336',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        Health Data Error
                      </Text>
                      <Text style={{ marginBottom: 12 }}>
                        {healthDataError.message || 'There was a problem retrieving your health data.'}
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#1E3A8A',
                          padding: 10,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (refreshData) {
                            setIsLoading(true);
                            refreshData().finally(() => setIsLoading(false));
                          }
                        }}
                      >
                        <Text style={{ color: 'white' }}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {recoveryStatus ? (
                    <View style={{
                      backgroundColor: '#f0f5ff',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16
                    }}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>Recovery Status: {recoveryStatus.score}/100</Text>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: '#1E3A8A',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8
                          }}
                          onPress={() => {
                            setShowCustomizeModal(true);
                          }}
                        >
                          <Text style={{color: 'white'}}>Customize</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={{marginTop: 8, color: '#666'}}>
                        {recoveryStatus.recommendation}
                      </Text>
                      
                      <View style={{
                        marginTop: 12,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        padding: 12,
                        backgroundColor: 'white',
                        borderRadius: 8
                      }}>
                        <Text>Recommended Intensity:</Text>
                        <Text style={{fontWeight: 'bold'}}> 
                          {recoveryStatus.score > 80 ? 'High' : 
                          recoveryStatus.score > 60 ? 'Medium' : 'Low'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#f0f5ff',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#1890ff',
                    }}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>Workout Customization</Text>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: '#1E3A8A',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8
                          }}
                          onPress={() => setShowCustomizeModal(true)}
                        >
                          <Text style={{color: 'white'}}>Customize</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={{marginTop: 8, color: '#666'}}>
                        Create a custom workout plan tailored to your preferences.
                      </Text>
                      
                      <Text style={{marginTop: 12, color: '#666', fontStyle: 'italic'}}>
                        Note: For personalized recovery recommendations, connect a device that tracks heart rate data.
                      </Text>
                    </View>
                  )}

                  {dataAvailability && dataAvailability.hasStepData && !dataAvailability.hasHeartRateData && (
                    <View style={{
                      backgroundColor: '#e6f7ff',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: '#1890ff',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        Basic Health Data Connected
                      </Text>
                      <Text>
                        We're receiving step data from your device. For more personalized workout recommendations, 
                        including heart rate and sleep data, you would need a compatible smartwatch or fitness tracker.
                      </Text>
                      {recoveryStatus ? (
                        <Text style={{ marginTop: 8 }}>
                          Your recovery score is calculated based on available data.
                        </Text>
                      ) : (
                        <Text style={{ marginTop: 8 }}>
                          Recovery status calculation requires more health metrics than are currently available.
                        </Text>
                      )}
                    </View>
                  )}
    
                  {showWorkoutGenerator ? (
                    <WorkoutPlanGenerator
                      onGeneratePlan={(plan) => {
                        // When a plan is generated, add JSON blocks if needed
                        // and update the main plan
                        const enhancedPlan = addJsonBlocksIfNeeded(plan);
                        setGeneratedPlan(enhancedPlan);
                        try {
                          const audioCues = parseWorkoutPlan(enhancedPlan);
                          setWorkoutAudioCues(audioCues);
                        } catch (error) {
                        }
                        
                        // Mark the plan as edited so the save button appears
                        setIsEditing(true);
                        
                        // Close the generator view
                        setShowWorkoutGenerator(false);
                      }}
                      isGenerating={isLoading}
                      refreshHealthData={refreshData}
                    />
                  ) : (
                    <>
                      {workoutAudioCues && (
                        <VoiceGuidancePlayer
                          exerciseCues={workoutAudioCues}
                          onComplete={() => {}}
                        />
                      )}
    
                      <Markdown style={getMarkdownStyles(currentColors)}>
                        {formatWorkoutPlan(generatedPlan)}
                      </Markdown>
                    </>
                  )}
                </>
              ) : (
                // Other plan types stay the same
                <Markdown style={getMarkdownStyles(currentColors)}>
                  {generatedPlan}
                </Markdown>
              )}
    
              {planType === 'recovery' && (
                <RecoveryScoreCard 
                  score={getRecoveryScoreFromPlan(generatedPlan)} 
                  date={new Date()} 
                  colors={currentColors}
                />
              )}
                
              <TouchableOpacity style={styles.resetButton} onPress={resetPlan}>
                <AntDesign name="arrowleft" size={16} color="#000" />
                <Text style={styles.resetText}>{t('dietPlan.questionnaire.another')}</Text>
              </TouchableOpacity>
              
              <View style={{ height: 30 }} />
              {planType === 'recovery' && (
                <View style={{ height: 30 }} />
              )}
            </ScrollView>
          ) : (
            <View style={{flex: 1, position: 'relative'}}>
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    dietView === 'plan' && [styles.activeTab, { borderBottomColor: PRIMARY_COLOR }]
                  ]}
                  onPress={() => setDietView('plan')}
                >
                  <Text style={[
                    styles.tabText, 
                    dietView === 'plan' && { color: PRIMARY_COLOR, fontWeight: 'bold' }
                  ]}>
                    Diet Plan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    dietView === 'scanner' && [styles.activeTab, { borderBottomColor: PRIMARY_COLOR }]
                  ]}
                  onPress={() => setDietView('scanner')}
                >
                  <Text style={[
                    styles.tabText, 
                    dietView === 'scanner' && { color: PRIMARY_COLOR, fontWeight: 'bold' }
                  ]}>
                    Nutrition Scanner
                  </Text>
                </TouchableOpacity>
              </View>
              
              {dietView === 'plan' ? (
                // Show the regular diet plan view
                <ScrollView
                  contentContainerStyle={[
                    styles.scrollContainer,
                    { backgroundColor: currentColors.background },
                  ]}
                  style={{ marginBottom: 70 }}
                >
                  <Text style={[styles.planTitle, { color: currentColors.textPrimary }]}>
                    Your Diet Plan
                  </Text>
                  <Markdown style={getMarkdownStyles(currentColors)}>
                    {generatedPlan}
                  </Markdown>
                  
                  <TouchableOpacity style={styles.resetButton} onPress={resetPlan}>
                    <AntDesign name="arrowleft" size={16} color="#000" />
                    <Text style={styles.resetText}>{t('dietPlan.questionnaire.another')}</Text>
                  </TouchableOpacity>
                  
                  <View style={{ height: 30 }} />
                </ScrollView>
              ) : (
                <NutritionScannerScreen />
              )}
            </View>
          )}
          
          {/* Position the toolbar absolutely */}
          <View style={styles.toolbarContainer}>
            {planType && (
              <PlanModifierToolbar
                planType={planType}
                currentPlan={generatedPlan}
                onPlanChange={handlePlanModification}
              />
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  if (!user?.isDeluxe) {
    return (
      <View
        style={[
          styles.restrictedContainer,
          { backgroundColor: currentColors.background },
        ]}
      >
        <FontAwesome6 name="crown" size={64} color="gold" />
        <MotiText
          style={[styles.restrictedTitle, { color: currentColors.textPrimary }]}
        >
          {t('dietPlan.questionnaire.premium')}
        </MotiText>
        <Text
          style={[
            styles.restrictedSubtitle,
            { color: currentColors.textSecondary },
          ]}
        >
          {t('dietPlan.questionnaire.upgrade')}{" "}
          <Text
            style={{ fontWeight: "bold", color: currentColors.textPrimary }}
          >
            Deluxe
          </Text>{" "}
          {t('dietPlan.questionnaire.toAccess')}
        </Text>

        <View style={styles.infoBox}>
          <AntDesign
            name="infocirlceo"
            size={24}
            color={currentColors.textSecondary}
          />
          <Text
            style={[styles.infoText, { color: currentColors.textSecondary }]}
          >
            {t('dietPlan.questionnaire.unlimited')}        
          </Text>
        </View>

        <Link
          href="/(app)/(tabs)/Subscription"
          style={{
            backgroundColor: "#1E3A8A",
            borderRadius: 12,
            alignSelf: "stretch",
          }}
        >
          <View style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>{t('dietPlan.questionnaire.deluxeUp')}</Text>
            <AntDesign name="arrowright" size={20} color="white" />
          </View>
        </Link>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderContent()}
      {renderResetModal()}
      {renderCustomizeModal()}


      <SavedPlansModal
        isVisible={showSavedPlans}
        onClose={() => {
          setShowSavedPlans(false);
        }}
        onPlanSelect={(plan) => {
          setGeneratedPlan(plan.plan);
          setPlanType(plan.type);
          setCurrentPlanId(plan.id);
          setIsEditing(false);
          
          if (plan.type === 'workout' && plan.audioCues) {
            setWorkoutAudioCues(plan.audioCues);
          }
          if (plan.type === 'diet' && plan.scannedFoods) {
            setScannedItems(plan.scannedFoods);
            setDietView('scanner');
          }
          
          setStep('plan');
          setShowSavedPlans(false);
        }}
        userId={user!.uid}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  upgradeButton: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 18,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  recoveryPanel: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 10,
  },
  customizeButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  modifyButton: {
    backgroundColor: '#596cab2b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  modifyButtonText: {
    color: '#007BFF',
    fontWeight: '500',
  },
  saveButton: {
    marginRight: 10,
    padding: 5,
  },
  savedPlansButton: {
    marginRight: 10,
    padding: 5,
  },
  restrictedContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  restrictedTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
  },
  restrictedSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    borderRadius: 12,
    marginVertical: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Add safe area padding on iOS
  },
  backButton: { marginRight: 16 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  draftButton: {
    marginRight: 12,
  },
  selectContainer: {
    justifyContent: "flex-start", // Keep this
    alignItems: "center", // Keep this
    paddingVertical: 10, // Add padding for better spacing
  },
  card: {
    width: "90%",
    padding: 16,
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    alignItems: "center",
  },
  iconContainer: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardSubtitle: { color: "#666" },
  highlight: {
    backgroundColor: "#E6F7FF",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007BFF",
    color: "rgb(161 98 7)",
  },
  scrollContainer: { padding: 12, paddingBottom: 80, gap: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  questionContainer: { marginBottom: 10, gap: 6 },
  planTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  planContainer: {
    padding: 16,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    marginBottom: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#596cab2b",
    borderRadius: 8,
  },
  resetText: { marginLeft: 8, color: "#007BFF" },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0)",
  },
  resetModalContent: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resetModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  resetModalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  resetModalButtons: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  resetModalCancelButton: {
    padding: 12,
    height: "auto",
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
  },
  resetModalCancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  resetModalConfirmButton: {
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    alignItems: "center",
  },
  resetModalConfirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  wearableButton: {
    marginRight: 10,
    padding: 5,
  },
});

const getMarkdownStyles = (colors: ColorsType[Theme]) => ({
  body: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    gap: 20,
  },
  hr: { backgroundColor: colors.textSecondary },
  heading1: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  heading2: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  heading3: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heading4: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 6,
  },
  paragraph: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 12,
  },
  strong: {
    color: colors.textPrimary,
  },
  emphasis: {
    color: colors.textSecondary,
  },
  blockquote: {
    color: colors.textSecondary,
    fontStyle: "italic",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginVertical: 12,
  },
  code: {
    color: colors.secondary,
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 4,
    fontFamily: "monospace",
    fontSize: 14,
  },
  a: {
    color: colors.textPrimary,
  },
  listItem: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  listBullet: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  listNumber: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tableHeader: {
    color: colors.textPrimary,
    fontWeight: "bold",
    backgroundColor: colors.secondary,
    padding: 8,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
  },
  tableCell: {
    color: colors.textPrimary,
    padding: 8,
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
  voiceGuidanceContainer: {
    marginVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
  },
});

export default CarePlan;