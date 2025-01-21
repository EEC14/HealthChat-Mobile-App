import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Platform } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import * as Speech from 'expo-speech';
import { useAuthContext } from "@/context/AuthContext";

interface ChatMessageProps {
  message: {
    text: string;
    isBot: boolean;
    timestamp: Date;
  };
}

const VOICE_IDENTIFIERS = {
  ios: [
    'com.apple.ttsbundle.Samantha-compact',
    'com.apple.ttsbundle.siri_male_en-US_premium',
    'com.apple.voice.premium.en-US.Samantha',
    'com.apple.voice.enhanced.en-US.Samantha'
  ],
  android: [
    'en-US-Wavenet-D',
    'en-us-x-iol-network',
    'en-us-x-sfg-network',
    'en-us-x-tpf-local'
  ]
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

  const getBestVoice = async () => {
    const voices = await Speech.getAvailableVoicesAsync();
    const preferredVoices = Platform.OS === 'ios' ? VOICE_IDENTIFIERS.ios : VOICE_IDENTIFIERS.android;
    const bestVoice = voices.find(voice => 
      preferredVoices.some(preferredId => voice.identifier.includes(preferredId))
    );
    return bestVoice?.identifier;
  };

  const handleSpeak = async () => {
    if (!user?.isDeluxe) {
      Alert.alert(
        "Deluxe Feature",
        "Text-to-speech is only available for Deluxe users. Upgrade to access this feature!"
      );
      return;
    }

    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      const voiceIdentifier = await getBestVoice();
      Speech.speak(message.text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        voice: voiceIdentifier,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: message.isBot ? "flex-start" : "flex-end",
      marginBottom: 8,
      paddingHorizontal: 8,
    }}>
      <View style={{
        flexDirection: message.isBot ? "row" : "row-reverse",
        alignItems: "flex-start",
        maxWidth: "80%",
      }}>
        {/* Avatar container */}
        <View style={{
          backgroundColor: message.isBot ? "#1e3a8a" : "#1e3a8a",
          padding: 8,
          borderRadius: 12,
          marginHorizontal: 5,
        }}>
          {message.isBot ? (
            <Image
              style={{ width: 16, height: 16 }}
              source={require("@/assets/images/icon-app.png")}
            />
          ) : (
            <AntDesign name="user" size={16} color="white" />
          )}
        </View>

        {/* Message bubble */}
        <View style={{
          backgroundColor: message.isBot ? currentColors.surface : "#1e3a8a",
          padding: 12,
          borderRadius: 16,
          flexShrink: 1,
        }}>
          {/* Message content container */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            {/* Text content */}
            <Text style={{
              color: message.isBot ? currentColors.textPrimary : "white",
              fontSize: 16,
              flexShrink: 1,
              marginRight: 8,
            }}>
              {message.text}
            </Text>

            {/* Speaker button */}
            <TouchableOpacity 
              onPress={handleSpeak}
              style={{ 
                padding: 2,
                opacity: user?.isDeluxe ? 1 : 0.5,
              }}
            >
              <AntDesign 
                name={isSpeaking ? "pausecircle" : "sound"} 
                size={16} 
                color={message.isBot ? currentColors.textPrimary : "white"} 
              />
            </TouchableOpacity>
          </View>

          {/* Timestamp */}
          <Text style={{
            color: message.isBot ? currentColors.textSecondary : "#93c5fd",
            fontSize: 12,
            marginTop: 5,
          }}>
            {message.timestamp.toLocaleDateString()}
            {" / "}
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );
};