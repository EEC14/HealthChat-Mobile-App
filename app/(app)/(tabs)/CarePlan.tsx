import React, { useState, useCallback } from "react";

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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { generatePlan, generatePlanQuestions } from "@/utils/OpenAi";

import Markdown from "react-native-markdown-display";
import { PlanType, StepType } from "@/types";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";

import { useAuthContext } from "@/context/AuthContext";

import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

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

  const handleAnswersSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const plan = await generatePlan(planType!, goals, answers);
      setGeneratedPlan(plan);
      setStep("plan");
    } catch (error) {
      Alert.alert("Error", "Failed to generate the plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPlan = useCallback(() => {
    setPlanType(null);
    setGoals("");
    setQuestions([]);
    setAnswers({});
    setGeneratedPlan("");
    setStep("select");
  }, []);

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
          `${planType === "workout" ? "Fitness" : "Diet"} Questions`}
        {step === "plan" && "Your Personalized Plan"}
      </Text>
      <View style={styles.headerActions}>
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
            Reset Generator
          </Text>
          <Text
            style={[
              styles.resetModalSubtitle,
              { color: currentColors.textSecondary },
            ]}
          >
            Are you sure you want to reset? All progress will be lost.
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
                ⚠️ This plan is for informational purposes only. Consult with
                healthcare professionals before starting any new workout or diet
                program.
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
              Customized exercise routine
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
              Personalized meal plan
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === "questionnaire") {
      return (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { backgroundColor: currentColors.background, flex: 1 },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 80}
            style={{ flex: 1 }}
          >
            {questions.length === 0 ? (
              <View style={[styles.questionContainer]}>
                <Text
                  style={[styles.label, { color: currentColors.textPrimary }]}
                >
                  What are your {planType === "workout" ? "fitness" : "dietary"}{" "}
                  goals?
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
                  {/* <Markdown style={markdownStyles}>{`${question}`}</Markdown> */}
                  <Text style={{ color: currentColors.textPrimary }}>
                    {question}
                  </Text>
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
                </View>
              ))
            )}
            {questions.length > 0 && (
              <TouchableOpacity
                style={
                  questions.every((q) => answers[q]?.trim())
                    ? [styles.button, { backgroundColor: "#1E3A8A" }]
                    : [styles.button, styles.disabled]
                }
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
          <Text
            style={[styles.planTitle, { color: currentColors.textPrimary }]}
          >
            Your {planType === "workout" ? "Workout" : "Diet"} Plan
          </Text>
          <View
            style={[
              styles.planContainer,
              { backgroundColor: currentColors.surface },
            ]}
          >
            <Markdown style={markdownStyles}>{generatedPlan}</Markdown>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={resetPlan}>
            <AntDesign name="arrowleft" size={16} color="#000" />
            <Text style={styles.resetText}>Generate Another Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderContent()}
      {renderResetModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // Additional modal and reset styles
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

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 18,
    gap: 20,
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#007BFF",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    color: "#0056b3",
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },

  listItemText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    color: "#333",
  },
  listItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007BFF",
    marginRight: 8,
  },
  list: {
    marginLeft: 16,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: "#f9f9f9",
    borderLeftWidth: 4,
    borderLeftColor: "#007BFF",
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 12,
  },
  code: {
    backgroundColor: "#f4f4f4",
    borderRadius: 4,
    padding: 8,
    fontFamily: "monospace",
    fontSize: 14,
    color: "#D32F2F",
  },
};

export default CarePlan;