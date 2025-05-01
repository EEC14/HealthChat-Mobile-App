import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform, Animated } from "react-native";
import * as Speech from 'expo-speech';
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Message, SpecializationType } from "@/types";
import { characters } from "@/utils/OpenAi";
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from "@expo/vector-icons";
interface ChatMessageProps {
  message: Message;
  onReply: (message: Message) => void;
  motivationalMode?: boolean;
}
const SPECIALIST_VOICES = {
  [SpecializationType.DEFAULT]: {
    ios: [
      'com.apple.ttsbundle.siri_Martha_en-GB_compact',   
      'com.apple.voice.compact.en-US.Samantha'            
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.GENERAL]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'    
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.ORTHOPEDIC]: {
    ios: [
      'com.apple.ttsbundle.siri_Gordon_en-AU_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'    
    ],
    android: ['en-US-Wavenet-B']
  },
  [SpecializationType.PHYSIOTHERAPY]: {
    ios: [
      'com.apple.ttsbundle.siri_Aaron_en-US_compact',     
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact'     
    ],
    android: ['en-US-Wavenet-C']
  },
  [SpecializationType.PSYCHOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Catherine_en-AU_compact',
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'    
    ],
    android: ['en-us-x-sfg-local']
  },
  [SpecializationType.CARDIOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.DERMATOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',     
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'    
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.DENTISTRY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',   
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'   
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.PEDIATRICS]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.OTOLARYNGOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.GASTROENTEROLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.UROLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Arthur_en-GB_compact',    
      'com.apple.ttsbundle.siri_Aaron_en-US_compact'      
    ],
    android: ['en-us-x-tpd-network']
  },
  [SpecializationType.GYNECOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',   
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'   
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.OPHTHALMOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',   
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'   
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.NEUROLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',   
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'   
    ],
    android: ['en-us-x-sfg-network']
  },
  [SpecializationType.ENDOCRINOLOGY]: {
    ios: [
      'com.apple.ttsbundle.siri_Nicky_en-US_compact',   
      'com.apple.ttsbundle.siri_Martha_en-GB_compact'   
    ],
    android: ['en-us-x-sfg-network']
  },
};

const specialistIcons = {
  [SpecializationType.DEFAULT]: "robot",
  [SpecializationType.GENERAL]: "user-md",
  [SpecializationType.ORTHOPEDIC]: "bone",
  [SpecializationType.PHYSIOTHERAPY]: "running",
  [SpecializationType.PSYCHOLOGY]: "brain",
  [SpecializationType.CARDIOLOGY]: "heartbeat",
  [SpecializationType.DERMATOLOGY]: "allergies",
  [SpecializationType.DENTISTRY]: "tooth",
  [SpecializationType.GYNECOLOGY]: "venus",
  [SpecializationType.PEDIATRICS]: "baby",
  [SpecializationType.OPHTHALMOLOGY]: "eye",
  [SpecializationType.OTOLARYNGOLOGY]: "ear",
  [SpecializationType.NEUROLOGY]: "brain",
  [SpecializationType.GASTROENTEROLOGY]: "stomach",
  [SpecializationType.ENDOCRINOLOGY]: "vial",
  [SpecializationType.UROLOGY]: "kidneys",
};

const getBestVoiceForSpecialist = async (specialistType: SpecializationType) => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const englishVoices = voices.filter(voice => 
      voice.language.startsWith('en') && voice.identifier
    );
    
    const siriVoices = englishVoices.filter(voice => 
      voice.identifier.includes('siri')
    );
    const preferredVoices = Platform.OS === 'ios' 
      ? SPECIALIST_VOICES[specialistType]?.ios 
      : SPECIALIST_VOICES[specialistType]?.android;

    const bestVoice = siriVoices.find(voice => 
      preferredVoices?.some(preferred => voice.identifier === preferred)
    );

    if (bestVoice) {
      return bestVoice.identifier;
    }

    const isFemaleSpecialist = [
      SpecializationType.DEFAULT,
      SpecializationType.PSYCHOLOGY,
      SpecializationType.DERMATOLOGY,
      SpecializationType.DENTISTRY
    ].includes(specialistType);

    const genderMatchedSiriVoice = siriVoices.find(voice => {
      const isFemaleVoice = voice.name.includes('Martha') || 
                           voice.name.includes('Catherine') || 
                           voice.name.includes('Nicky');
      return isFemaleSpecialist ? isFemaleVoice : !isFemaleVoice;
    });

    if (genderMatchedSiriVoice) {
      return genderMatchedSiriVoice.identifier;
    }
    const fallbackVoice = englishVoices[0];
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
  "Health Assistant": require("../../assets/images/nurse_naomi.png"),
  "Dentist Dana": require("../../assets/images/dentist_dana.png"),
  "Gynecology Gwen": require("../../assets/images/gynecology_gwen.png"),
  "Pediatrics Peter": require("../../assets/images/pediatrics_peter.png"),
  "Ophthalmology Olivia": require("../../assets/images/ophtalmology_olivia.png"),
  "Otoloaringology Owen": require("../../assets/images/otolaryngology_owen.png"),
  "Neurology Nora": require("../../assets/images/neurology_nora.png"),
  "Gastroenterology Greg": require("../../assets/images/gastroenterology_greg.png"),
  "Endocrinology Emma": require("../../assets/images/endorcinology_emma.png"),
  "Urology Ugo": require("../../assets/images/urology_ugo.png")
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onReply, motivationalMode = false }) => {
  const { user } = useAuthContext();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const isBot = message.role === 'assistant';
  const [actionVisible, setActionVisible] = useState(false);
  const actionOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (actionVisible) {
      Animated.timing(actionOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(actionOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [actionVisible]);

  const getCharacterName = (characterType?: SpecializationType) => {
    if (!characterType && !message.character) return "";
    const specType = characterType || message.character;
    const character = characters[specType];
    return character ? character.name : "Health Assistant";
  };

  const getProfilePicture = () => {
    if (!isBot) return profilePictures["user"];
    const characterName = getCharacterName();    
    return profilePictures[characterName] || profilePictures["Health Assistant"];
  };

  const getSpecialistIcon = () => {
    if (!message.character) return "robot";
    return specialistIcons[message.character] || "user-md";
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
        pitch: 1.0, 
        rate: 0.85, 
        voice: voiceIdentifier || undefined,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error in handleSpeak:', error);
      setIsSpeaking(false);
    }
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    const replyMessage = message.replyTo as Message;
    
    return (
      <View style={styles.replyPreviewContainer}>
        <View style={styles.replyPreviewLine} />
        <Text style={styles.replyPreviewText} numberOfLines={1}>
          {replyMessage.role === 'user' ? 'You' : getCharacterName(replyMessage.character)}
          : {replyMessage.content.substring(0, 60)}
          {replyMessage.content.length > 60 ? '...' : ''}
        </Text>
      </View>
    );
  };

  const toggleAction = () => {
    setActionVisible(!actionVisible);
  };

return (
  <TouchableOpacity 
    activeOpacity={0.8}
    onLongPress={toggleAction}
    delayLongPress={200}
    onPress={() => actionVisible && setActionVisible(false)}
  >
    <View style={[
      styles.messageContainer,
      isBot ? styles.botMessageContainer : styles.userMessageContainer,
      message.isPartial && styles.partialMessage,
    ]}>
      {!motivationalMode && isBot && (
        <View style={styles.avatarContainer}>
          {theme === 'dark' ? (
            <LinearGradient
              colors={['#2C2C7E', '#1C1C5E']}
              style={styles.avatarGradient}
            >
              <FontAwesome5 name={getSpecialistIcon()} size={16} color="#FFF" />
            </LinearGradient>
          ) : (
            <Image 
              source={getProfilePicture()} 
              style={styles.profilePicture} 
            />
          )}
        </View>
      )}
      
      {!motivationalMode && !isBot && (
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={theme === 'dark' ? ['#4A4A7C', '#35355E'] : ['#E0E0FF', '#C0C0FF']}
            style={styles.avatarGradient}
          >
            <FontAwesome5 name="user" size={16} color={theme === 'dark' ? "#FFF" : "#5050A0"} />
          </LinearGradient>
        </View>
      )}

      <View style={[
        styles.contentContainer,
        isBot ? 
          theme === 'dark' ? styles.botContentDark : styles.botContentLight
          : 
          theme === 'dark' ? styles.userContentDark : styles.userContentLight,
        motivationalMode && styles.motivationalContent
      ]}>
        {/* Character name for bot messages */}
        {isBot && (
          <Text style={styles.characterName}>
            {getCharacterName()}
          </Text>
        )}
        
        {/* Reply preview if applicable */}
        {renderReplyPreview()}
        
        {/* Message content */}
        <Markdown style={{
          body: {
            color: isBot ? 
              theme === 'dark' ? '#FFFFFF' : '#333333' 
              : 
              '#FFFFFF',
            fontSize: 16,
            lineHeight: 22,
          },
          paragraph: {
            marginVertical: 8,
          },
          link: { 
            color: isBot ? '#4DA3FF' : '#B3DAFF',
            textDecorationLine: 'none',
          },
          strong: { 
            fontWeight: 'bold',
          },
          heading1: {
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 16,
            marginBottom: 8,
          },
          heading2: {
            fontSize: 20,
            fontWeight: 'bold',
            marginTop: 14,
            marginBottom: 7,
          },
          heading3: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: 12,
            marginBottom: 6,
          },
          heading4: {
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 10,
            marginBottom: 5,
          },
          heading5: {
            fontSize: 14,
            fontWeight: 'bold',
            marginTop: 8,
            marginBottom: 4,
          },
          heading6: {
            fontSize: 12,
            fontWeight: 'bold',
            marginTop: 6,
            marginBottom: 3,
          },
          list_item: {
            marginVertical: 4,
            flexDirection: 'row',
          },
          bullet_list: {
            marginVertical: 8,
          },
          ordered_list: {
            marginVertical: 8,
          },
        }}>
          {message.content}
        </Markdown>

        {/* Message footer with timestamp and actions */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            { color: isBot ? 
              theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
              : 
              'rgba(255,255,255,0.7)'
            }
          ]}>
            {message.timestamp?.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          
          {isBot && (
            <TouchableOpacity 
              onPress={handleSpeak}
              style={styles.actionButton}
            >
              <AntDesign 
                name={isSpeaking ? "pausecircleo" : "sound"} 
                size={18} 
                color={isBot ? 
                  theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                  : 
                  'rgba(255,255,255,0.8)'
                } 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>

    {/* Hidden action buttons that appear on long press */}
    <Animated.View style={[
      styles.actionPanel,
      { 
        opacity: actionOpacity,
        transform: [{ 
          translateY: actionOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0]
          })
        }]
      },
      isBot ? styles.botActionPanel : styles.userActionPanel
    ]}>
      <TouchableOpacity 
        style={styles.actionPanelButton}
        onPress={() => {
          onReply(message);
          setActionVisible(false);
        }}
      >
        <AntDesign name="retweet" size={16} color="#FFF" />
        <Text style={styles.actionPanelText}>Reply</Text>
      </TouchableOpacity>
      
      {isBot && (
        <TouchableOpacity 
          style={styles.actionPanelButton}
          onPress={() => {
            handleSpeak();
            setActionVisible(false);
          }}
        >
          <AntDesign name={isSpeaking ? "pausecircleo" : "sound"} size={16} color="#FFF" />
          <Text style={styles.actionPanelText}>{isSpeaking ? "Pause" : "Speak"}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  </TouchableOpacity>
);
};

const styles = StyleSheet.create({
messageContainer: {
  flexDirection: 'row',
  marginVertical: 8,
  paddingHorizontal: 6,
},
botMessageContainer: {
  alignSelf: 'flex-start',
  maxWidth: '90%',
},
userMessageContainer: {
  alignSelf: 'flex-end',
  maxWidth: '90%',
  flexDirection: 'row-reverse',
},
avatarContainer: {
  width: 36,
  height: 36,
  marginHorizontal: 8,
  alignSelf: 'flex-start',
  borderRadius: 18,
  overflow: 'hidden',
},
avatarGradient: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
profilePicture: {
  width: '100%',
  height: '100%',
  borderRadius: 18,
},
contentContainer: {
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 12,
  maxWidth: '85%',
},
botContentDark: {
  backgroundColor: 'rgba(50, 50, 60, 0.9)',
},
botContentLight: {
  backgroundColor: '#F0F2F5',
},
userContentDark: {
  backgroundColor: '#0A84FF',
},
userContentLight: {
  backgroundColor: '#0A84FF',
},
motivationalContent: {
  maxWidth: '90%',
  borderRadius: 20,
},
characterName: {
  color: '#7D7D9C',
  fontSize: 13,
  fontWeight: '600',
  marginBottom: 4,
},
replyPreviewContainer: {
  backgroundColor: 'rgba(150, 150, 180, 0.15)',
  borderRadius: 12,
  padding: 8,
  marginBottom: 8,
  borderLeftWidth: 2,
  borderLeftColor: '#0A84FF',
},
replyPreviewLine: {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 2,
  backgroundColor: '#0A84FF',
},
replyPreviewText: {
  fontSize: 13,
  opacity: 0.8,
  marginLeft: 6,
},
messageFooter: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginTop: 6,
},
timestamp: {
  fontSize: 11,
  marginRight: 6,
},
actionButton: {
  padding: 4,
  borderRadius: 12,
},
partialMessage: {
  opacity: 0.7,
},
actionPanel: {
  position: 'absolute',
  bottom: -34,
  flexDirection: 'row',
  borderRadius: 12,
  paddingVertical: 6,
  paddingHorizontal: 10,
  backgroundColor: 'rgba(50, 50, 60, 0.9)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 3,
  zIndex: 100,
},
botActionPanel: {
  left: 50,
},
userActionPanel: {
  right: 10,
},
actionPanelButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
},
actionPanelText: {
  color: '#FFF',
  fontSize: 12,
  fontWeight: '500',
  marginLeft: 4,
},
});

export default ChatMessage;