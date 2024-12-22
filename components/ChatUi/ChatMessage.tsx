import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { View, Text, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
interface ChatMessageProps {
  message: {
    text: string;
    isBot: boolean;
    timestamp: Date;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: message.isBot ? "flex-start" : "flex-end",
        marginBottom: 8,
      }}
    >
      <View
        style={{
          flexDirection: message.isBot ? "row" : "row-reverse",
          alignItems: "flex-start",
          maxWidth: "85%",
        }}
      >
        <View
          style={{
            backgroundColor: message.isBot ? "#1e3a8a" : "#1e3a8a",
            padding: 8,
            borderRadius: 12,
            marginHorizontal: 5,
          }}
        >
          {message.isBot ? (
            <Image
              style={{ width: 16, height: 16 }}
              source={require("@/assets/images/icon-app.png")}
            />
          ) : (
            <AntDesign name="user" size={16} color="white" />
          )}
        </View>
        <View
          style={{
            backgroundColor: message.isBot ? currentColors.surface : "#1e3a8a",
            padding: 12,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: message.isBot ? currentColors.textPrimary : "white",
              fontSize: 16,
            }}
          >
            {message.text}
          </Text>
          <Text
            style={{
              color: message.isBot ? currentColors.textSecondary : "#93c5fd",
              fontSize: 12,
              marginTop: 5,
            }}
          >
            {message.timestamp.toLocaleDateString()}
            {" / "}
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );
};
