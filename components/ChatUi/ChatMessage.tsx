import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from "react-native";
import * as Speech from 'expo-speech';
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Message, SpecializationType } from "@/types";
import { characters } from "@/utils/OpenAi";
interface ChatMessageProps {
  message: Message;
}

const SPECIALIST_VOICES = {
  [SpecializationType.DEFAULT]: {
    ios: [
      'com.apple.ttsbundle.siri_Martha_en-GB_compact',    // British female Siri voice
      'com.apple.voice.compact.en-US.Samantha'            // Fallback
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.GENERAL]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    // British male Siri voice
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      // US male Siri voice
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.ORTHOPEDIC]: {
    ios: [
      'com.apple.ttsbundle.siri_Gordon_en-AU_compact',    // Australian male Siri voice
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      // Fallback
    ],
    android: ['en-US-Wavenet-B']
  },
  [SpecializationType.PHYSIOTHERAPY]: {
    ios: [
      'com.apple.ttsbundle.siri_Aaron_en-US_compact',     // US male Siri voice
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact'     // Fallback
    ],
    android: ['en-US-Wavenet-C']
  },
  [SpecializationType.PSYCHOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Catherine_en-AU_compact', // Australian female Siri voice
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'     // Fallback
    ],
    android: ['en-us-x-sfg-local']
  },
  [SpecializationType.CARDIOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    // British male Siri voice
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      // Fallback
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.DERMATOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',     // US female Siri voice
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'     // Fallback
    ],
    android: ['en-us-x-sfg-network']
  }
};

const getBestVoiceForSpecialist = async (specialistType: SpecializationType) => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('Looking for voice for specialist:', specialistType);

    // Get English Siri voices first, then any English voices
    const englishVoices = voices.filter(voice => 
      voice.language.startsWith('en') && voice.identifier
    );
    
    const siriVoices = englishVoices.filter(voice => 
      voice.identifier.includes('siri')
    );

    // Get preferred voices for this specialist
    const preferredVoices = Platform.OS === 'ios' 
      ? SPECIALIST_VOICES[specialistType]?.ios 
      : SPECIALIST_VOICES[specialistType]?.android;

    // Try to find preferred Siri voice
    const bestVoice = siriVoices.find(voice => 
      preferredVoices?.some(preferred => voice.identifier === preferred)
    );

    if (bestVoice) {
      console.log('Found preferred Siri voice:', bestVoice.name);
      return bestVoice.identifier;
    }

    // Fallback to any Siri voice based on gender
    const isFemaleSpecialist = [
      SpecializationType.DEFAULT,
      SpecializationType.PSYCHOLOGY,
      SpecializationType.DERMATOLOGY
    ].includes(specialistType);

    const genderMatchedSiriVoice = siriVoices.find(voice => {
      const isFemaleVoice = voice.name.includes('Martha') || 
                           voice.name.includes('Catherine') || 
                           voice.name.includes('Nicky');
      return isFemaleSpecialist ? isFemaleVoice : !isFemaleVoice;
    });

    if (genderMatchedSiriVoice) {
      console.log('Using gender-matched Siri voice:', genderMatchedSiriVoice.name);
      return genderMatchedSiriVoice.identifier;
    }

    // Final fallback to any English voice
    const fallbackVoice = englishVoices[0];
    console.log('Using fallback voice:', fallbackVoice?.name);
    return fallbackVoice?.identifier;

  } catch (error) {
    console.error('Error getting voices:', error);
    return null;
  }
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

  const getCharacterName = () => {
    if (!isBot || !message.character) return "";
    const character = characters[message.character];
    return character ? character.name : "Health Assistant";
  };

  const getProfilePicture = () => {
    if (!isBot) return profilePictures["user"];
    
    const characterName = getCharacterName();
    return profilePictures[characterName] || profilePictures["Health Assistant"];
  };
  
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);
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
      return;
    }

    if (!message.character) {
      return;
    }
    try {
      const voiceIdentifier = await getBestVoiceForSpecialist(message.character);
      
      Speech.speak(message.content, {
        language: 'en-US',
        pitch: 1.0,           // Normal pitch
        rate: 0.85,          // Slightly slower for better clarity
        voice: voiceIdentifier,
        quality: 'Enhanced',  // Try to use enhanced quality when available
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error in handleSpeak:', error);
      setIsSpeaking(false);
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
            {getCharacterName()}
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