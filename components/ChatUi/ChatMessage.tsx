import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from "react-native";
import * as Speech from 'expo-speech';
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
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

const profilePictures: Record<string, any> = {
  "Dr. Dave": require("../../assets/images/dr_dave.png"),
  "Ortho Oscar": require("../../assets/images/ortho_oscar.png"),
  "Physio Pete": require("../../assets/images/physio_pete.png"),
  "Psychology Paula": require("../../assets/images/psychology_paula.png"),
  "Cardiology Carl": require("../../assets/images/cardiology_carl.png"),
  "Dermatology Debrah": require("../../assets/images/dermatology_debrah.png"),
  "user": require("../../assets/images/user_default.png"),
  "Health Assistant": require("../../assets/images/icon.png"),
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuthContext();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const isBot = message.role === 'assistant';
  const getProfilePicture = () => {
    if (isBot) {
      return profilePictures[message.character || "Dr. Dave"];
    }
    return profilePictures["user"];
  };
  
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
      Speech.speak(message.content, {
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
    <View style={[
      styles.messageContainer,
      isBot ? styles.botMessage : styles.userMessage
    ]}>
      <Image 
        source={getProfilePicture()} 
        style={styles.profilePicture} 
      />
      <View style={[
        styles.textContainer,
        isBot ? styles.botContainer : styles.userContainer
      ]}>
        {/* Character name for bot messages */}
        {isBot && (
          <Text style={styles.characterName}>
            {message.character || "Health Assistant"}
          </Text>
        )}
        
        {/* Message text */}
        <Text style={styles.text}>
          {message.content}
        </Text>

        {/* Bottom row with timestamp and speaker */}
        <View style={styles.bottomRow}>
          <Text style={styles.timestamp}>
            {message.timestamp?.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          
          {isBot && (
            <TouchableOpacity 
              onPress={handleSpeak}
              style={styles.speakerButton}
            >
              <AntDesign 
                name={isSpeaking ? "pausecircle" : "sound"} 
                size={16} 
                color={isBot ? currentColors.textPrimary : "white"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 5,
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  textContainer: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
  },
  text: {
    fontSize: 16,
  },
  botText: {
    color: "#000000",
  },
  userText: {
    color: "#000000",
  },
  videoContainer: {
    backgroundColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 5,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
  botContainer: {
    backgroundColor: '#2C2C2E',
  },
  userContainer: {
    backgroundColor: '#007AFF',
  },
  characterName: {
    color: '#868686',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  speakerButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});


export default ChatMessage;