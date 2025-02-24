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
import { ColorsType, PlanType, StepType } from "@/types";
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
import { SavedPlansModal } from "@/components/SavedPlansModal";
import { savePlan } from "@/utils/planStorage";
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
  const { t } = useTranslation();
  const handleGoalsSubmit = async () => {
    if (!goals.trim()) return;
    setIsLoading(true);
    try {
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
    // Remove JSON blocks
    const cleanPlan = plan.replace(/```json[\s\S]*?```/g, '');
    
    // Add custom styling
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
      console.log('Submitting with:', {
        planType,
        goals,
        answers
      });
  
      const plan = await generatePlan(planType!, goals, answers);
      console.log('Generated plan:', plan);
  
      // If it's a workout plan, create audio cues
      if (planType === 'workout') {
        try {
          const audioCues = parseWorkoutPlan(plan);
          console.log('Generated audio cues:', audioCues);
          setWorkoutAudioCues(audioCues);
        } catch (parseError) {
          console.error('Error parsing workout plan:', parseError);
          // Continue even if audio cues fail
        }
      }
      
      setGeneratedPlan(plan);
      setStep("plan");
    } catch (error) {
      console.error("Full error generating plan:", error);
      Alert.alert("Error", `Failed to generate the plan. Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (type: PlanType) => {
    setPlanType(type);
    setStep("questionnaire"); // Go to profile step first
  };

  const resetPlan = useCallback(() => {
    setPlanType(null);
    setGoals("");
    setQuestions([]);
    setAnswers({});
    setGeneratedPlan("");
    setStep("select");
  }, []);

  const handleSavePlan = async (name: string) => {
    console.log('Starting plan save process...', {
      userId: user?.uid,
      planType,
      hasAudioCues: planType === 'workout' ? !!workoutAudioCues : false,
      planLength: generatedPlan.length
    });
  
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
  
    try {
      console.log('Calling savePlan function...');
      const savedPlanId = await savePlan(
        user.uid,
        planType,
        name,
        generatedPlan,
        // Only include audioCues if they exist and it's a workout plan
        planType === 'workout' && workoutAudioCues ? workoutAudioCues : undefined
      );
      console.log('Plan saved successfully with ID:', savedPlanId);
      Alert.alert('Success', 'Plan saved successfully');
    } catch (error) {
      console.error('Error in handleSavePlan:', error);
      Alert.alert('Error', `Failed to save plan: ${error.message}`);
    }
  };

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
            `${planType === "workout" ? "Workout" : planType === "diet" ? "Diet" : "Meditation"} Questions`}
          {step === "plan" && "Your Personalized Plan"}
      </Text>
      <View style={styles.headerActions}>

      {step === "plan" && (
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

  const renderContent = () => {
    if (step === "select") {
      return (
        <View
          style={[
            styles.selectContainer,
            { backgroundColor: currentColors.background },
          ]}
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
              Diet Plan
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
        </View>
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
              // keyboardVerticalOffset={Platform.OS === "ios" ? 36 : -50}
              style={{ flex: 1 }}
            >
              {questions.length === 0 ? (
                <View style={[styles.questionContainer]}>
                  <Text
                    style={[styles.label, { color: currentColors.textPrimary }]}
                  >
                    What are your{" "}
                    {planType === "workout" ? "Workout" : planType === "diet" ? "Diet" : "Meditation"} goals?
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
      return (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { backgroundColor: currentColors.background },
          ]}
        >
          <Text style={[styles.planTitle, { color: currentColors.textPrimary }]}>
            Your {planType === "workout" ? "Workout" : planType === "diet" ? "Diet" : "Meditation"} Plan
          </Text>
          
          {/* Add Voice Guidance Player for workout plans */}
          {planType === 'workout' && workoutAudioCues && (
            <VoiceGuidancePlayer
              exerciseCues={workoutAudioCues}
              onComplete={() => {
                // Handle workout completion
                console.log('Workout completed');
              }}
            />
          )}
    
          {planType === 'workout' ? (
            <Markdown style={getMarkdownStyles(currentColors)}>
              {formatWorkoutPlan(generatedPlan)}
            </Markdown>
          ) : (
            <Markdown style={getMarkdownStyles(currentColors)}>
              {generatedPlan}
            </Markdown>
          )}
            
          <TouchableOpacity style={styles.resetButton} onPress={resetPlan}>
            <AntDesign name="arrowleft" size={16} color="#000" />
            <Text style={styles.resetText}>{t('dietPlan.questionnaire.another')}</Text>
          </TouchableOpacity>
        </ScrollView>
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
      
      <SavedPlansModal
        isVisible={showSavedPlans}
        onClose={() => {
          console.log('Closing saved plans modal'); // Add this log
          setShowSavedPlans(false);
        }}
        onPlanSelect={(plan) => {
          setGeneratedPlan(plan.plan);
          setPlanType(plan.type);
          
          // Only set audioCues for workout plans
          if (plan.type === 'workout' && plan.audioCues) {
            setWorkoutAudioCues(plan.audioCues);
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
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
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
    // fontWeight: "bold",
  },
  emphasis: {
    color: colors.textSecondary,
    // fontStyle: "italic",
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
    // textDecorationLine: "underline",
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

export default CarePlan ;