import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Loader2 } from "lucide-react-native";
import { generatePlan, generatePlanQuestions, parseWorkoutPlan } from "@/utils/OpenAi";
import { AudioCue } from "@/types/voiceTypes";
export type PlanType = "workout" | "diet" | "meditation";

interface PlanQuestionnaireProps {
  type: PlanType;
  onPlanGenerated: (plan: string, audioCues?: AudioCue[]) => void;
}

export const PlanQuestionnaire: React.FC<PlanQuestionnaireProps> = ({
  type,
  onPlanGenerated,
}) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState("");

  const handleGoalsSubmit = async () => {
    if (!goals.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const generatedQuestions = await generatePlanQuestions(type, goals);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswersSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const plan = await generatePlan(type, goals, answers);
      
      // If it's a workout plan, create audio cues
      if (type === 'workout') {
        const audioCues = parseWorkoutPlan(plan);
        onPlanGenerated(plan, audioCues);
      } else {
        onPlanGenerated(plan);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Goals input stage
  if (questions.length === 0) {
    return (
      <View className="p-4 space-y-4">
        <Text className="text-base font-semibold text-gray-700">
          What are your {type === "workout" ? "fitness" : "dietary"} goals?
        </Text>
        <TextInput
          multiline
          placeholderTextColor="#6B7280"
          value={goals}
          onChangeText={setGoals}
          placeholder={`Please describe your ${
            type === "workout" ? "fitness" : "dietary"
          } goals and preferences...`}
          className="w-full h-32 px-4 py-3 text-gray-900 border border-gray-300 rounded-xl"
          textAlignVertical="top"
        />
        <TouchableOpacity
          onPress={handleGoalsSubmit}
          disabled={isLoading || !goals.trim()}
          className={`w-full py-3 px-6 rounded-xl 
            flex-row items-center justify-center 
            ${
              isLoading || !goals.trim()
                ? "bg-blue-500 opacity-50"
                : "bg-blue-900"
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={24} />
              <Text className="text-white">Generating questions...</Text>
            </>
          ) : (
            <Text className="text-center text-white">Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Questions and answers stage
  return (
    <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
      {questions.map((question, index) => (
        <View key={index} className="mb-4">
          <Text className="mb-2 text-base font-semibold text-gray-700">
            {question}
          </Text>
          <TextInput
            multiline
            placeholderTextColor="#6B7280"
            value={answers[question] || ""}
            onChangeText={(text) =>
              setAnswers((prev) => ({
                ...prev,
                [question]: text,
              }))
            }
            placeholder="Your answer..."
            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-gray-300 text-gray-900"
            textAlignVertical="top"
          />
        </View>
      ))}
      <TouchableOpacity
        onPress={handleAnswersSubmit}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-xl 
          flex-row items-center justify-center 
          ${isLoading ? "bg-blue-500 opacity-50" : "bg-blue-900"}`}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} />
            <Text className="text-white">Generating {type} plan...</Text>
          </>
        ) : (
          <Text className="text-center text-white">
            Generate {type === "workout" ? "Workout" : "Diet"} Plan
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};