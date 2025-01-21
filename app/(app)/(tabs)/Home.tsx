import React, { useState, useCallback, useRef, useEffect } from "react";
import * as Location from 'expo-location';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import {
  getRemainingMessages,
  incrementMessageCount,
  hasReachedLimit,
} from "@/utils/ChatLimit";
import { getAIResponse } from "@/utils/OpenAi";
import ChatInput from "@/components/ChatUi/ChatInput";
import ChatMessage from "@/components/ChatUi/ChatMessage";
import { ChatLimit } from "@/components/ChatUi/ChatLimit";
import ShareButton from "@/components/ChatUi/ShareButton";
import { useAuthContext } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { SpecializationType } from "@/types";
import { characters_ex } from "@/utils/OpenAi";
import { Picker } from '@react-native-picker/picker';
interface Message {
  id: string | number;
  text: string;
  isBot: boolean;
  botCharacter?: string;
  videoUrl?: string;
  timestamp?: Date;
}

function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello, I'm Dr. Dave, your AI medical specialist. How can I help you today?",
      isBot: true,
      botCharacter: "Dr. Dave",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecializationType | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    })();
    return () => {
      Speech.stop();
    };
  }, []);

  if (!user) {
    router.replace("/(app)/(auth)/Signin");
    return;
  }

  const loadRemainingMessages = useCallback(async () => {
    const remaining = await getRemainingMessages(user.isPro, user.isDeluxe);
    setRemainingMessages(remaining);
  }, [user.isPro]);

  useEffect(() => {
    async function setRemainingMessages() {
      await loadRemainingMessages();
    }
    setRemainingMessages();
  }, []);

  const handleVideoGenerated = (videoUrl: string, messageId: string | number) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, videoUrl } 
          : msg
      )
    );
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) {
      return;
    }

    const limitReached = await hasReachedLimit(user.isPro, user.isDeluxe);
    if (limitReached) {
      const limitMessage: Message = {
        id: messages.length + 1,
        text: "You've reached your daily message limit. Please upgrade to Pro or Deluxe for unlimited access.",
        isBot: true,
        botCharacter: "Dr. Dave",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, limitMessage]);
      return;
    }

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await incrementMessageCount(user.isPro, user.isDeluxe);
      await loadRemainingMessages();

      const aiResponse = await getAIResponse(input, user, location, 10, selectedSpecialist);

      const botMessage: Message = {
        id: messages.length + 2,
        text: aiResponse.responseText,
        isBot: true,
        botCharacter: aiResponse.characterName,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text:
          error.message ||
          "I apologize, but I encountered a technical issue. Please try again later.",
        isBot: true,
        botCharacter: "Dr. Dave",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSpecialistPicker = () => {
    if (!user.isDeluxe) return null;

    return (
      <View style={{ marginVertical: 10 }}>
        <Text>Choose a Specialist:</Text>
        <Picker
          selectedValue={selectedSpecialist}
          onValueChange={(itemValue) => setSelectedSpecialist(itemValue)}
        >
          <Picker.Item label="Select Specialist" value={null} />
          {Object.entries(characters_ex).map(([key, character]) => (
            <Picker.Item key={key} label={character.name} value={character.specialization} />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: currentColors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 36 : 26}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, paddingBottom: Platform.OS === "ios" ? 46 : 60 }}
        >
          {renderSpecialistPicker()}

          {!user.isPro && !user.isDeluxe && remainingMessages <= 20 && (
            <ChatLimit remainingMessages={remainingMessages} />
          )}

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ChatMessage 
                message={item} 
                onVideoGenerated={handleVideoGenerated}
              />
            )}
            contentContainerStyle={{ padding: 10 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
          <View
            style={{
              backgroundColor: currentColors.background,
              padding: 10,
              gap: 4,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderTopWidth: 1,
              borderTopColor: currentColors.border,
            }}
          >
            <ShareButton messages={messages} />
            <ChatInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
});

export default Home;
