import * as Speech from 'expo-speech';
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Platform, Alert } from "react-native";
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

  useEffect(() => {
    const checkSpeech = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        console.log('Available voices:', voices);
      } catch (error) {
        console.error('Error checking voices:', error);
      }
    };
  
    checkSpeech();
  }, []);

  const handleSpeak = async () => {
    try {
      const isSpeechInProgress = await Speech.isSpeakingAsync();
      
      if (isSpeechInProgress) {
        await Speech.stop();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(true);
        
        await Speech.speak(message.text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 1.0,
          onStart: () => console.log('Started speaking'),
          onDone: () => {
            setIsSpeaking(false);
            console.log('Done speaking');
          },
          onError: (error) => {
            setIsSpeaking(false);
            Alert.alert(
              "Speech Error",
              "If you can't hear anything, please check if your device is on silent mode. Text-to-speech requires sound to be enabled."
            );
            console.error('Speech error:', error);
          }
        });
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      Alert.alert(
        "Speech Error",
        "If you can't hear anything, please check if your device is on silent mode. Text-to-speech requires sound to be enabled."
      );
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
