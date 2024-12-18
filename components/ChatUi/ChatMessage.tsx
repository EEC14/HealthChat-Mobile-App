import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { View, Text, Image } from "react-native";

interface ChatMessageProps {
  message: {
    text: string;
    isBot: boolean;
    timestamp: Date;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
            backgroundColor: message.isBot ? "#dbeafe" : "#1e3a8a",
            padding: 8,
            borderRadius: 12,
            marginHorizontal: 5,
          }}
        >
          {message.isBot ? (
            <Image
              style={{ width: 16, height: 16 }}
              source={require("@/assets/images/icon.png")}
            />
          ) : (
            <AntDesign name="user" size={16} color="white" />
          )}
        </View>
        <View
          style={{
            backgroundColor: message.isBot ? "white" : "#1e3a8a",
            padding: 12,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: message.isBot ? "#1f2937" : "white",
              fontSize: 16,
            }}
          >
            {message.text}
          </Text>
          <Text
            style={{
              color: message.isBot ? "#9ca3af" : "#93c5fd",
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
