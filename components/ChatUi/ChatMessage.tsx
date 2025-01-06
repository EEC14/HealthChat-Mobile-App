import * as Speech from 'expo-speech';
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    const isSpeechInProgress = await Speech.isSpeakingAsync();
    
    if (isSpeechInProgress) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      
      try {
        await Speech.speak(message.text, {
          language: 'en',
          rate: 0.9,
          pitch: 1.0,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      } catch (error) {
        console.error('Speech error:', error);
        setIsSpeaking(false);
      }
    }
  };

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text
              style={{
                color: message.isBot ? currentColors.textPrimary : "white",
                fontSize: 16,
                flex: 1,
                marginRight: message.isBot ? 8 : 0,
              }}
            >
              {message.text}
            </Text>
            {message.isBot && (
              <TouchableOpacity onPress={handleSpeak} style={{ padding: 4 }}>
                <Feather
                  name={isSpeaking ? "pause" : "volume-2"}
                  size={20}
                  color={currentColors.textPrimary}
                />
              </TouchableOpacity>
            )}
          </View>
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
