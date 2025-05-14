import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useAuthContext } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from "expo-router";

// Component imports
import { RecoveryScoreCard } from '@/components/Recovery/RecoveryScoreCard';
import { SavedPlansModal } from '@/components/DietPlan/SavedPlansModal';
import { PlanEditorModal } from '@/components/DietPlan/PlanEditorModal';
import { PlanModifierToolbar } from '@/components/DietPlan/PlanModifierToolbar';
import WearableIntegrationScreen from '@/components/wearable/WearableIntegrationScreen';
import WorkoutPlanGenerator from '@/components/plans/WorkoutPlanGenerator';
import { VoiceGuidancePlayer } from '@/components/VoiceGuidancePlayer';

// Utility imports
import { AudioCue } from '@/types/voiceTypes';
import useHealthData from '@/utils/useHealthData';
import { generatePlan, generatePlanQuestions, parseWorkoutPlan } from '@/utils/OpenAi';
import { getUserWearableConnections } from '@/utils/wearableService';
import { savePlan, updatePlan, getUserPlans } from '@/utils/planStorage';
import { PlanType, SavedPlan } from '@/types';

const WellnessHub = () => {
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';
  const router = useRouter();
  
  // View states
  const [currentView, setCurrentView] = useState('home');
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanTypeModal, setShowPlanTypeModal] = useState(false);
  const [showSavedPlansModal, setShowSavedPlansModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showWearableSetup, setShowWearableSetup] = useState(false);
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  
  // Plan data
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [workoutAudioCues, setWorkoutAudioCues] = useState<AudioCue[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SavedPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Health data
  const { 
    isLoading: isHealthDataLoading, 
    healthData, 
    recoveryStatus, 
    dataAvailability, 
    error: healthDataError, 
    refreshData 
  } = useHealthData();
  
  // Load saved plans when component mounts
  useEffect(() => {
    if (user?.uid) {
      loadSavedPlans();
    }
  }, [user?.uid]);
  
  const loadSavedPlans = async () => {
    if (!user?.uid) return;
    
    try {
      const plans = await getUserPlans(user.uid);
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading saved plans:', error);
    }
  };
  
  // Create new plan flow
  const handleCreatePlan = () => {
    setShowPlanTypeModal(true);
  };
  
  const handleSelectPlanType = (type: PlanType) => {
    setPlanType(type);
    setShowPlanTypeModal(false);
    setCurrentView('questionnaire');
  };
  
  const handleGoalsSubmit = async () => {
    if (!goals.trim()) {
      Alert.alert('Please enter your goals');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const generatedQuestions = await generatePlanQuestions(planType!, goals);
      setQuestions(generatedQuestions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleAnswersSubmit = async () => {
    if (isLoading || !planType) return;
    
    setIsLoading(true);
    
    try {
      // Enhance answers with health data if available
      const enhancedAnswers = { ...answers };
      
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
      
      const plan = await generatePlan(planType, goals, enhancedAnswers);
      
      if (planType === 'workout') {
        try {
          const audioCues = parseWorkoutPlan(plan);
          setWorkoutAudioCues(audioCues);
        } catch (parseError) {
          console.error('Error parsing workout plan:', parseError);
        }
      }
      
      setGeneratedPlan(plan);
      setCurrentPlanId(null);
      setCurrentView('planView');
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Error', 'Failed to generate the plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Plan management functions
  const handlePlanModification = (updatedPlan: string) => {
    if (updatedPlan === generatedPlan) return;
    
    setGeneratedPlan(updatedPlan);
    
    if (planType === 'workout') {
      try {
        const updatedAudioCues = parseWorkoutPlan(updatedPlan);
        setWorkoutAudioCues(updatedAudioCues);
      } catch (error) {
        console.error('Error parsing modified workout plan:', error);
      }
    }
    
    setIsEditing(true);
  };
  
  const handleSavePlan = async (name: string) => {
    if (!user?.uid || !planType) {
      Alert.alert('Error', 'Unable to save plan. Please try again.');
      return;
    }
    
    try {
      if (currentPlanId) {
        await updatePlan(currentPlanId, {
          name: name,
          plan: generatedPlan,
          audioCues: planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined
        });
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        const savedPlanId = await savePlan(
          user.uid,
          planType,
          name,
          generatedPlan,
          planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined
        );
        setCurrentPlanId(savedPlanId);
        Alert.alert('Success', 'Plan saved successfully');
      }
      
      setIsEditing(false);
      loadSavedPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save plan');
    }
  };
  
  const handleOpenSavedPlan = (plan: SavedPlan) => {
    setPlanType(plan.type);
    setGeneratedPlan(plan.plan);
    setCurrentPlanId(plan.id);
    setIsEditing(false);
    
    if (plan.type === 'workout' && plan.audioCues) {
      setWorkoutAudioCues(plan.audioCues);
    }
    
    setCurrentView('planView');
    setShowSavedPlansModal(false);
  };
  
  const handleEditPlan = (plan: SavedPlan) => {
    setEditingPlan(plan);
    setShowEditorModal(true);
  };
  
  const handlePlanUpdated = () => {
    loadSavedPlans();
  };
  
  const resetPlan = () => {
    setPlanType(null);
    setGoals('');
    setQuestions([]);
    setAnswers({});
    setGeneratedPlan('');
    setWorkoutAudioCues(null);
    setCurrentPlanId(null);
    setIsEditing(false);
    setCurrentView('home');
  };
  
  // Wearable integration
  const handleConnectWearable = () => {
    setShowWearableSetup(true);
  };
  
  const handleWearableConnected = async () => {
    setIsLoading(true);
    
    try {
      if (refreshData) {
        await refreshData();
      }
      setShowWearableSetup(false);
      
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
  
  // Function to parse markdown sections for React rendering
  const renderMarkdown = (markdown: string): JSX.Element[] | null => {
    if (!markdown) return null;
    
    const lines: string[] = markdown.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line: string, index: number) => {
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={`h1-${index}`} style={styles.markdownH1}>
            {line.substring(2)}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={`h2-${index}`} style={styles.markdownH2}>
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={`h3-${index}`} style={styles.markdownH3}>
            {line.substring(4)}
          </Text>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <View key={`li-${index}`} style={styles.markdownListItem}>
            <Text style={styles.markdownBullet}>•</Text>
            <Text style={styles.markdownListText}>{line.substring(2)}</Text>
          </View>
        );
      } else if (line.match(/^\d+\. /)) {
        const numberMatch = line.match(/^\d+/);
        const number = numberMatch ? numberMatch[0] : '';
        elements.push(
          <View key={`ol-${index}`} style={styles.markdownListItem}>
            <Text style={styles.markdownBullet}>{number}.</Text>
            <Text style={styles.markdownListText}>{line.substring(number.length + 2)}</Text>
          </View>
        );
      } else if (line.trim() !== '') {
        elements.push(
          <Text key={`p-${index}`} style={styles.markdownParagraph}>
            {line}
          </Text>
        );
      }
    });
    
    return elements;
  };
  
  const getTypeColor = (type: PlanType) => {
    switch (type) {
      case 'workout':
        return { bg: '#E6F7FF', text: '#1890FF', icon: '#1890FF' };
      case 'diet':
        return { bg: '#F6FFED', text: '#52C41A', icon: '#52C41A' };
      case 'meditation':
        return { bg: '#FFF7E6', text: '#FA8C16', icon: '#FA8C16' };
      case 'habit':
        return { bg: '#F9F0FF', text: '#722ED1', icon: '#722ED1' };
      case 'recovery':
        return { bg: '#FFF1F0', text: '#F5222D', icon: '#F5222D' };
      default:
        return { bg: '#F5F5F5', text: '#666666', icon: '#666666' };
    }
  };
  
  const getPlanTypeEmoji = (type: PlanType) => {
    switch (type) {
      case 'workout': return '💪';
      case 'diet': return '🍽️';
      case 'meditation': return '🧘';
      case 'habit': return '🔄';
      case 'recovery': return '❤️';
      default: return '📝';
    }
  };
  
  const renderHome = () => (
    <>
      <ScrollView style={styles.scrollContainer}>
        {/* Recovery Status Card */}
        {recoveryStatus ? (
          <RecoveryScoreCard 
            score={recoveryStatus.score} 
            date={new Date()} 
            colors={currentColors}
          />
        ) : (
          <View style={styles.connectWearableCard}>
            <Text style={styles.cardTitle}>Connect Your Wearable</Text>
            <Text style={styles.cardDescription}>
              Get personalized recovery scores and recommendations by connecting your fitness tracker.
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleConnectWearable}
            >
              <Text style={styles.primaryButtonText}>Connect Device</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Create Plan Options */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Create New Plan</Text>
            <TouchableOpacity 
              onPress={() => setShowSavedPlansModal(true)}
              style={styles.textButton} 
            >
              <Text style={styles.textButtonLabel}>Saved Plans</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.planGrid}>
            <TouchableOpacity 
              style={styles.planCard}
              onPress={() => handleSelectPlanType('workout')}
            >
              <View style={[styles.planIconContainer, { backgroundColor: '#E6F7FF' }]}>
                <Text style={styles.planEmoji}>💪</Text>
              </View>
              <Text style={styles.planLabel}>Workout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.planCard}
              onPress={() => handleSelectPlanType('diet')}
            >
              <View style={[styles.planIconContainer, { backgroundColor: '#F6FFED' }]}>
                <Text style={styles.planEmoji}>🍽️</Text>
              </View>
              <Text style={styles.planLabel}>Diet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.planCard}
              onPress={() => handleSelectPlanType('meditation')}
            >
              <View style={[styles.planIconContainer, { backgroundColor: '#FFF7E6' }]}>
                <Text style={styles.planEmoji}>🧘</Text>
              </View>
              <Text style={styles.planLabel}>Meditation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.planCard}
              onPress={() => handleSelectPlanType('habit')}
            >
              <View style={[styles.planIconContainer, { backgroundColor: '#F9F0FF' }]}>
                <Text style={styles.planEmoji}>🔄</Text>
              </View>
              <Text style={styles.planLabel}>Habit Stack</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.planCard}
              onPress={() => handleSelectPlanType('recovery')}
            >
              <View style={[styles.planIconContainer, { backgroundColor: '#FFF1F0' }]}>
                <Text style={styles.planEmoji}>❤️</Text>
              </View>
              <Text style={styles.planLabel}>Recovery</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Plans Section */}
        {savedPlans.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Plans</Text>
              <TouchableOpacity 
                onPress={() => setShowSavedPlansModal(true)}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {savedPlans.slice(0, 3).map(plan => (
              <TouchableOpacity 
                key={plan.id}
                style={styles.savedPlanCard}
                onPress={() => handleOpenSavedPlan(plan)}
              >
                <View style={styles.savedPlanHeader}>
                  <View style={[
                    styles.planTypeTag, 
                    { backgroundColor: getTypeColor(plan.type).bg }
                  ]}>
                    <Text style={styles.planTypeEmoji}>{getPlanTypeEmoji(plan.type)}</Text>
                    <Text style={[
                      styles.planTypeText, 
                      { color: getTypeColor(plan.type).text }
                    ]}>
                      {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEditPlan(plan)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.savedPlanTitle}>
                  {plan.name}
                </Text>
                
                <Text style={styles.savedPlanDescription} numberOfLines={2}>
                  {plan.plan || "No description provided"}
                </Text>
                
                <View style={styles.savedPlanFooter}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Plan</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePlan}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </>
  );
  
  const renderQuestionnaire = () => (
    <ScrollView style={styles.scrollContainer}>
      {questions.length === 0 ? (
        // Initial goal entry screen
        <View>
          <View style={styles.questionnaireHeader}>
            <Text style={styles.questionnaireTitleText}>
              {planType === 'workout' ? 'Create Workout Plan' :
               planType === 'diet' ? 'Create Nutrition Plan' :
               planType === 'meditation' ? 'Create Meditation Plan' :
               planType === 'habit' ? 'Create Habit Stack' : 'Create Recovery Plan'}
            </Text>
            <Text style={styles.questionnaireSubtitleText}>
              Tell us about your goals and preferences
            </Text>
          </View>
          
          <Text style={styles.inputLabel}>
            What are your goals?
          </Text>
          
          <TextInput
            style={styles.textAreaInput}
            multiline
            placeholder={
              planType === 'workout' ? "Example: I want to build muscle while improving my overall fitness..." :
              planType === 'diet' ? "Example: I want to eat healthier while maintaining energy for workouts..." :
              planType === 'meditation' ? "Example: I want to reduce stress and improve focus..." :
              planType === 'habit' ? "Example: I want to build a consistent morning routine..." :
              "Example: I want to improve recovery between intense training sessions..."
            }
            placeholderTextColor="#9CA3AF"
            value={goals}
            onChangeText={setGoals}
          />
          
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.submitButton,
              (!goals.trim() || isLoading) && styles.disabledButton
            ]}
            onPress={handleGoalsSubmit}
            disabled={!goals.trim() || isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonWithLoader}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.primaryButtonText}>
                  Generating Questions...
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        // Answer questions screen
        <View>
          <View style={styles.questionnaireHeader}>
            <Text style={styles.questionnaireTitleText}>
              {planType === 'workout' ? 'Workout Plan Questionnaire' :
               planType === 'diet' ? 'Nutrition Plan Questionnaire' :
               planType === 'meditation' ? 'Meditation Plan Questionnaire' :
               planType === 'habit' ? 'Habit Stack Questionnaire' : 'Recovery Plan Questionnaire'}
            </Text>
            <Text style={styles.questionnaireSubtitleText}>
              Help us personalize your plan by answering these questions
            </Text>
          </View>
          
          {questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.inputLabel}>
                {question}
              </Text>
              
              <TextInput
                style={styles.textAreaInput}
                multiline
                placeholder="Your answer..."
                placeholderTextColor="#9CA3AF"
                value={answers[question] || ''}
                onChangeText={(text) => setAnswers({ ...answers, [question]: text })}
              />
            </View>
          ))}
          
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.submitButton,
              (!questions.every(q => answers[q]?.trim()) || isLoading) && styles.disabledButton
            ]}
            onPress={handleAnswersSubmit}
            disabled={!questions.every(q => answers[q]?.trim()) || isLoading}
          >
            {isLoading ? (
              <View style={styles.buttonWithLoader}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.primaryButtonText}>
                  Generating Plan...
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Generate Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
  
  const renderPlanView = () => {
    if (showWearableSetup) {
      return (
        <WearableIntegrationScreen 
          onGoBack={() => setShowWearableSetup(false)}
          onDeviceConnected={handleWearableConnected}
        />
      );
    }
    
    if (showWorkoutGenerator) {
      return (
        <WorkoutPlanGenerator
          onGeneratePlan={(plan) => {
            setGeneratedPlan(plan);
            try {
              const audioCues = parseWorkoutPlan(plan);
              setWorkoutAudioCues(audioCues);
            } catch (error) {
              console.error('Error parsing workout plan:', error);
            }
            setIsEditing(true);
            setShowWorkoutGenerator(false);
          }}
          isGenerating={isLoading}
          refreshHealthData={refreshData}
        />
      );
    }
    
    return (
      <View style={styles.planViewContainer}>
        <ScrollView style={styles.scrollContainer}>
          {/* Plan Header */}
          <View style={styles.planViewHeader}>
            <View style={[
              styles.planViewIconContainer, 
              { backgroundColor: getTypeColor(planType!).bg }
            ]}>
              <Text style={styles.planViewEmoji}>{getPlanTypeEmoji(planType!)}</Text>
            </View>
            
            <View style={styles.planViewInfo}>
              <Text style={styles.planViewTitle}>
                {planType === 'workout' ? 'Workout Plan' :
                 planType === 'diet' ? 'Nutrition Plan' :
                 planType === 'meditation' ? 'Meditation Plan' :
                 planType === 'habit' ? 'Habit Stack Plan' : 'Recovery Plan'}
              </Text>
              <Text style={styles.planViewSubtitle}>
                Personalized to your goals
              </Text>
            </View>
            
            <View style={styles.planViewActions}>
              {planType === 'workout' && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowWorkoutGenerator(true)}
                >
                  <Text style={styles.iconButtonText}>✏️</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Alert.prompt(
                    'Save Plan',
                    'Enter a name for this plan:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Save',
                        onPress: name => {
                          if (name && name.trim()) {
                            handleSavePlan(name);
                          } else {
                            Alert.alert('Error', 'Please enter a valid name for the plan');
                          }
                        }
                      }
                    ],
                    'plain-text',
                    currentPlanId ? 'Current Plan' : '',
                    'default'
                  );
                }}
              >
                <Text style={styles.iconButtonText}>💾</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Workout Audio Player for workout plans */}
          {planType === 'workout' && workoutAudioCues && (
            <View style={styles.audioPlayerContainer}>
              <VoiceGuidancePlayer
                exerciseCues={workoutAudioCues}
                onComplete={() => {}}
              />
            </View>
          )}
          
          {/* Recovery Score for recovery plans */}
          {planType === 'recovery' && recoveryStatus && (
            <View style={styles.recoveryScoreContainer}>
              <RecoveryScoreCard 
                score={recoveryStatus.score} 
                date={new Date()} 
                colors={currentColors}
              />
            </View>
          )}
          
          {/* Plan Content */}
          <View style={styles.planContentCard}>
            {renderMarkdown(generatedPlan)}
          </View>
        </ScrollView>
        
        {/* Plan Modifier Toolbar */}
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
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      {currentView !== 'home' && (
        <TouchableOpacity 
          onPress={() => {
            if (currentView === 'planView') {
              // Ask about saving changes if editing
              if (isEditing) {
                Alert.alert(
                  'Unsaved Changes',
                  'Do you want to save your changes before going back?',
                  [
                    { 
                      text: 'Discard', 
                      style: 'destructive',
                      onPress: () => {
                        setCurrentView('home');
                        setIsEditing(false);
                      } 
                    },
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Save',
                      onPress: () => {
                        Alert.prompt(
                          'Save Plan',
                          'Enter a name for this plan:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Save',
                              onPress: name => {
                                if (name && name.trim()) {
                                  handleSavePlan(name);
                                  setCurrentView('home');
                                } else {
                                  Alert.alert('Error', 'Please enter a valid name for the plan');
                                }
                              }
                            }
                          ],
                          'plain-text',
                          currentPlanId ? 'Current Plan' : '',
                          'default'
                        );
                      }
                    }
                  ]
                );
              } else {
                setCurrentView('home');
              }
            } else {
              setCurrentView('home');
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.headerTitle}>
        {currentView === 'home' ? 'Wellness Hub' :
         currentView === 'questionnaire' ? 'Create Plan' : 'Your Plan'}
      </Text>
      
      <View style={styles.headerActions}>
        {currentView === 'home' && (
          <>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleConnectWearable}
            >
              <Text style={styles.headerButtonEmoji}>🔄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowSavedPlansModal(true)}
            >
              <Text style={styles.headerButtonEmoji}>📁</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
  
  const renderPlanTypeModal = () => (
    <Modal
      visible={showPlanTypeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPlanTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Plan Type</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPlanTypeModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.planTypeOption, { backgroundColor: '#E6F7FF' }]}
            onPress={() => handleSelectPlanType('workout')}
          >
            <Text style={styles.planTypeOptionEmoji}>💪</Text>
            <View style={styles.planTypeOptionInfo}>
              <Text style={[styles.planTypeOptionTitle, { color: '#1890FF' }]}>
                Workout Plan
              </Text>
              <Text style={[styles.planTypeOptionDescription, { color: '#1890FF' }]}>
                Strength, cardio, flexibility routines
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeOption, { backgroundColor: '#F6FFED' }]}
            onPress={() => handleSelectPlanType('diet')}
          >
            <Text style={styles.planTypeOptionEmoji}>🍽️</Text>
            <View style={styles.planTypeOptionInfo}>
              <Text style={[styles.planTypeOptionTitle, { color: '#52C41A' }]}>
                Nutrition Plan
              </Text>
              <Text style={[styles.planTypeOptionDescription, { color: '#52C41A' }]}>
                Meal plans, macros, nutrition guidelines
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeOption, { backgroundColor: '#FFF7E6' }]}
            onPress={() => handleSelectPlanType('meditation')}
          >
            <Text style={styles.planTypeOptionEmoji}>🧘</Text>
            <View style={styles.planTypeOptionInfo}>
              <Text style={[styles.planTypeOptionTitle, { color: '#FA8C16' }]}>
                Meditation Plan
              </Text>
              <Text style={[styles.planTypeOptionDescription, { color: '#FA8C16' }]}>
                Mindfulness, stress reduction techniques
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeOption, { backgroundColor: '#F9F0FF' }]}
            onPress={() => handleSelectPlanType('habit')}
          >
            <Text style={styles.planTypeOptionEmoji}>🔄</Text>
            <View style={styles.planTypeOptionInfo}>
              <Text style={[styles.planTypeOptionTitle, { color: '#722ED1' }]}>
                Habit Stack
              </Text>
              <Text style={[styles.planTypeOptionDescription, { color: '#722ED1' }]}>
                Build consistent daily routines
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeOption, { backgroundColor: '#FFF1F0' }]}
            onPress={() => handleSelectPlanType('recovery')}
          >
            <Text style={styles.planTypeOptionEmoji}>❤️</Text>
            <View style={styles.planTypeOptionInfo}>
              <Text style={[styles.planTypeOptionTitle, { color: '#F5222D' }]}>
                Recovery Plan
              </Text>
              <Text style={[styles.planTypeOptionDescription, { color: '#F5222D' }]}>
                Optimize rest and recovery between workouts
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // If premium features check (from original code)
  if (!user?.isDeluxe) {
    return (
      <View style={styles.premiumContainer}>
        <Text style={styles.premiumEmoji}>👑</Text>
        <Text style={styles.premiumTitle}>
          Premium Feature
        </Text>
        <Text style={styles.premiumDescription}>
          Upgrade to Deluxe to access personalized wellness plans.
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => {
            router.push('/(app)/(tabs)/Subscription');
          }}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          <Text style={styles.upgradeButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {currentView === 'home' && renderHome()}
      {currentView === 'questionnaire' && renderQuestionnaire()}
      {currentView === 'planView' && renderPlanView()}
      
      {renderPlanTypeModal()}
      
      <SavedPlansModal
        isVisible={showSavedPlansModal}
        onClose={() => setShowSavedPlansModal(false)}
        onPlanSelect={handleOpenSavedPlan}
        userId={user!.uid}
      />
      
      <PlanEditorModal
        isVisible={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        plan={editingPlan}
        onPlanUpdated={handlePlanUpdated}
      />
    </View>
  );
};


const styles = StyleSheet.create({
    // Markdown styles
    markdownH1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    },
    markdownH2: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 8,
      color: '#1E3A8A',
    },
    markdownH3: {
      fontSize: 18,
      fontWeight: '500',
      marginTop: 10,
      marginBottom: 6,
    },
    markdownParagraph: {
      fontSize: 16,
      marginBottom: 8,
      color: '#4B5563',
    },
    markdownListItem: {
      flexDirection: 'row',
      marginTop: 4,
      marginBottom: 4,
    },
    markdownBullet: {
      marginRight: 8,
      color: '#374151',
    },
    markdownListText: {
      flex: 1,
      color: '#374151',
    },
  
    // General layout
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    scrollContainer: {
      flex: 1,
      padding: 16,
    },
  
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 24,
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    headerButtonEmoji: {
      fontSize: 20,
    },
  
    // Cards & Buttons
    connectWearableCard: {
      backgroundColor: '#f0f5ff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    cardDescription: {
      color: '#6B7280',
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: '#1E3A8A',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    buttonWithLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    // Sections
    sectionContainer: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    textButton: {
      padding: 4,
    },
    textButtonLabel: {
      color: '#1E3A8A',
      fontWeight: '500',
    },
  
    // Plan Grid
    planGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    planCard: {
      width: '47%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    planIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    planEmoji: {
      fontSize: 28,
    },
    planLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
  
    // Saved Plans
    savedPlanCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    savedPlanHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    planTypeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    planTypeEmoji: {
      fontSize: 14,
      marginRight: 4,
    },
    planTypeText: {
      fontSize: 12,
      fontWeight: '500',
    },
    editText: {
      color: '#1E3A8A',
      fontSize: 14,
    },
    savedPlanTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
    },
    savedPlanDescription: {
      color: '#6B7280',
      marginBottom: 8,
    },
    savedPlanFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    savedPlanDate: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    viewButton: {
      backgroundColor: '#F3F4F6',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    viewButtonText: {
      color: '#1E3A8A',
      fontWeight: '500',
    },
  
    // Floating Action Button
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#1E3A8A',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    fabText: {
      fontSize: 24,
      color: 'white',
      fontWeight: 'bold',
    },
  
    // Questionnaire
    questionnaireHeader: {
      marginBottom: 24,
    },
    questionnaireTitleText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    questionnaireSubtitleText: {
      color: '#6B7280',
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    textAreaInput: {
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 12,
      padding: 16,
      minHeight: 120,
      fontSize: 16,
      textAlignVertical: 'top',
    },
    submitButton: {
      marginTop: 24,
      marginBottom: 40,
    },
    disabledButton: {
      opacity: 0.7,
    },
    questionContainer: {
      marginBottom: 20,
    },
  
    // Plan View
    planViewContainer: {
      flex: 1,
    },
    planViewHeader: {
      flexDirection: 'row',
      marginBottom: 16,
      alignItems: 'center',
    },
    planViewIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    planViewEmoji: {
      fontSize: 20,
    },
    planViewInfo: {
      flex: 1,
    },
    planViewTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    planViewSubtitle: {
      color: '#6B7280',
    },
    planViewActions: {
      flexDirection: 'row',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center'
    },
    iconButtonText: {
      fontSize: 18,
    },
    audioPlayerContainer: {
      marginVertical: 16,
    },
    recoveryScoreContainer: {
      marginVertical: 16,
    },
    planContentCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toolbarContainer: {
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      padding: 8,
    },
  
    // Modals
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 18,
    },
    planTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    planTypeOptionEmoji: {
      fontSize: 28,
      marginRight: 12,
    },
    planTypeOptionInfo: {
      flex: 1,
    },
    planTypeOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    planTypeOptionDescription: {
      fontSize: 14,
      marginTop: 4,
    },
    premiumContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF4E5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      },
      premiumEmoji: {
        fontSize: 24,
        marginRight: 12,
      },
      premiumTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
      },
      premiumDescription: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
      },
      upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFD700',
        borderRadius: 8,
      },
      upgradeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
        color: '#1E1E1E',
      },
      upgradeButtonArrow: {
        fontSize: 16,
        color: '#1E1E1E',
      },
  });
  
export default WellnessHub;
  