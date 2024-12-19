import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  return (
    <View
      style={{
        flexDirection: "row",
        flex: 1,
        gap: 4,
        alignItems: "stretch",
      }}
    >
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type your health question..."
        placeholderTextColor="#9ca3af"
        style={{
          flex: 1,
          backgroundColor: currentColors.inputBackground,
          borderWidth: 1,
          borderColor: currentColors.border,
          borderRadius: 10,
          color: currentColors.textPrimary,
          paddingHorizontal: 15,
          paddingVertical: 10,
          fontSize: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!input.trim() || isLoading}
        style={{
          backgroundColor: "#1E3A8A",
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 10,
          opacity: !input.trim() || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size={22} />
        ) : (
          <Feather name="send" size={22} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}
