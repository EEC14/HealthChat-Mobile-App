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
  return (
    <View
      style={{
        flexDirection: "row",
        flex: 1,
        gap: 4,
        alignItems: "stretch",
        backgroundColor: "white",
      }}
    >
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type your health question..."
        placeholderTextColor="#9ca3af"
        style={{
          flex: 1,
          backgroundColor: "#f3f4f7",
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 10,
          paddingHorizontal: 15,
          paddingVertical: 10,
          fontSize: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!input.trim() || isLoading}
        style={{
          backgroundColor: "#1e3a8a",
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 10,
          opacity: !input.trim() || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Feather name="send" size={22} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}
