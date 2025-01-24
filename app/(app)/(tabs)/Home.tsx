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


interface Message {
  id: string | number;
  text: string;
  isBot: boolean;
  botCharacter?: string;
  videoUrl?: string;
  timestamp?: Date;
}

const characters = {
  general: { name: "Dr. Dave", specialization: "general practitioner" },
  orthopedic: { name: "Ortho Oscar", specialization: "orthopedic specialist" },
  physiotherapy: { name: "Physio Pete", specialization: "physiotherapist" },
  psychology: { name: "Psychology Paula", specialization: "psychologist" },
  cardiology: { name: "Cardiology Carl", specialization: "cardiologist" },
  dermatology: { name: "Dermatology Debrah", specialization: "dermatologist" },
};

function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecializationType>(SpecializationType.GENERAL);
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
    if (selectedSpecialist) {
      const specialist = characters[selectedSpecialist];
      setMessages([
        {
          id: 1,
          text: `Hello, I'm ${specialist.name}, your AI ${specialist.specialization}. How can I help you today?`,
          isBot: true,
          botCharacter: specialist.name,
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedSpecialist]);

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

      const aiResponse = await getAIResponse(
        input,
        user,
        selectedSpecialist
      );
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

          <View>
            {user.isDeluxe && (
            <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.changeButtonText}>Change Specialist</Text>
          </TouchableOpacity>
            )}
          </View>

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