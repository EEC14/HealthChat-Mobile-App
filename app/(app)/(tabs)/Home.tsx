import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Button,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
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
import { SpecializationType } from "@/types";
import { Message } from "@/types";

const characters = {
  general: { name: "Dr. Dave", specialization: "general practitioner" },
  orthopedic: { name: "Ortho Oscar", specialization: "orthopedic specialist" },
  physiotherapy: { name: "Physio Pete", specialization: "physiotherapist" },
  psychology: { name: "Psychology Paula", specialization: "psychologist" },
  cardiology: { name: "Cardiology Carl", specialization: "cardiologist" },
  dermatology: { name: "Dermatology Debrah", specialization: "dermatologist" },
  default: { name: "Health Assistant", specialization: "default" },
};

function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecializationType>(
    user?.isDeluxe ? SpecializationType.DEFAULT : SpecializationType.GENERAL
  );
  const [isModalVisible, setModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isModelModalVisible, setModelModalVisible] = useState(false);
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    const specialist = characters[selectedSpecialist];
    const initialMessage = user?.isDeluxe
      ? "Hello, I'm your AI Health Assistant. I'll help route your questions to the appropriate specialist. How can I help you today?"
      : `Hello, I'm ${specialist.name}, your AI ${specialist.specialization}. How can I help you today?`;

    setMessages([
      {
        id: 1,
        content: initialMessage,
        role: 'assistant',
        character: specialist.name,
        timestamp: new Date(),
      },
    ]);
  }, [selectedSpecialist, user?.isDeluxe]);

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

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) return;

    const limitReached = await hasReachedLimit(user.isPro, user.isDeluxe);
    if (limitReached) {
      const limitMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: "You've reached your daily message limit...",
        character: characters[SpecializationType.DEFAULT].name,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    setIsLoading(true);
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    try {
      await incrementMessageCount(user.isPro, user.isDeluxe);
      
      const aiResponse = await getAIResponse(
        input,
        user,
        conversationHistory, // Pass full history
        user.isDeluxe ? selectedSpecialist : undefined,
        messages[messages.length - 1]?.character
      );

      const botMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: aiResponse.responseText,
        character: aiResponse.characterName,
        timestamp: new Date(),
      };

      // Update both displayed messages and conversation history
      setMessages(prev => [...prev, tempUserMessage, botMessage]);
      setConversationHistory(aiResponse.updatedHistory);
      
      setInput("");
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: error.message || "Technical issue...",
        character: characters[SpecializationType.DEFAULT].name,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const specialist = characters[selectedSpecialist];
    const initialMessage = user?.isDeluxe
      ? "Hello, I'm your AI Health Assistant..."
      : `Hello, I'm ${specialist.name}, your AI ${specialist.specialization}...`;

    const initialBotMessage: Message = {
      id: 1,
      role: 'assistant',
      content: initialMessage,
      character: specialist.name,
      timestamp: new Date(),
    };
    
    setMessages([initialBotMessage]);
    setConversationHistory([initialBotMessage]);
  }, [selectedSpecialist, user?.isDeluxe]);

  const renderSpecialistPicker = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose a Specialist:</Text>
          <Picker
            selectedValue={selectedSpecialist}
            onValueChange={(itemValue) => setSelectedSpecialist(itemValue)}
            style={{ width: "100%", color: "black" }} 
          >
              {Object.entries(characters).map(([key, character]) => (
                <Picker.Item
                  key={key}
                  label={character.name}
                  value={key}
                  color="black"
                />
              ))}
          </Picker>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {user?.isDeluxe && (
            <>
              {renderSpecialistPicker()}
              <TouchableOpacity
                style={[styles.changeButton, { zIndex: 1 }]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.changeButtonText}>Change Specialist</Text>
              </TouchableOpacity>
            </>
          )}

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ChatMessage 
                message={{
                  ...item,
                  isBot: item.role === 'assistant',
                  text: item.content,
                  botCharacter: item.character
                }} 
              />
            )}
            contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: currentColors.background,
              paddingHorizontal: 10,
              paddingBottom: Platform.OS === "ios" ? 65 : 15,
              paddingTop: 10,
              flexDirection: "row",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: currentColors.border,
              zIndex: 2
            }}
          >
            <View style={{ position: 'relative', width: 40 }}>
              <ShareButton messages={messages} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff", // Solid white for better visibility
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  changeButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Home;