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
import { getAIResponse, selectAIModel, AI_MODELS } from "@/utils/OpenAi";
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
import { useTranslation } from 'react-i18next';
import { AntDesign } from '@expo/vector-icons';
const characters = {
  general: { name: "Dr. Dave", specialization: "general practitioner" },
  orthopedic: { name: "Ortho Oscar", specialization: "orthopedic specialist" },
  physiotherapy: { name: "Physio Pete", specialization: "physiotherapist" },
  psychology: { name: "Psychology Paula", specialization: "psychologist" },
  cardiology: { name: "Cardiology Carl", specialization: "cardiologist" },
  dermatology: { name: "Dermatology Debrah", specialization: "dermatologist" },
  default: { name: "Health Assistant", specialization: "default" },
  dentistry: { name: "Dentist Dana", specialization: "dentistry"}
};

function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number>(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecializationType>(
    user?.isDeluxe ? SpecializationType.DEFAULT : SpecializationType.GENERAL
  );
  const [isModalVisible, setModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [isModelModalVisible, setModelModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpt-4o-mini" | "gpt-4o" | "claude-3-5-sonnet" | "llama-3">("gpt-4o-mini");

  const [isNewChat, setIsNewChat] = useState(true);
  const { t } = useTranslation();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  useEffect(() => {
    if (!user) return;
    
    const specialist = characters[selectedSpecialist];
    if (!specialist) return;

    if (messages.length === 0) {
      const initialMessage: Message = {
        id: 1,
        role: 'assistant',
        content: specialist.name === "Health Assistant" 
          ? "Hello, I'm your AI Health Assistant. I'll help route your questions to the appropriate specialist. How can I help you today?"
          : `${specialist.name} here! How can I assist you today?`,
        character: selectedSpecialist,
        timestamp: new Date(),
      };

      setMessages([initialMessage]);
      setConversationHistory([]);
    }
  }, [selectedSpecialist, user?.isDeluxe, messages.length]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);


  if (!user) {
    router.replace("/(app)/(auth)/Signin");
    return;
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const loadRemainingMessages = useCallback(async () => {
    if (!user) return;
    const remaining = await getRemainingMessages(user.isPro, user.isDeluxe);
    setRemainingMessages(remaining);
  }, [user?.isPro, user?.isDeluxe]);
  useEffect(() => {
    loadRemainingMessages();
  }, [loadRemainingMessages, messages.length]);

  const handleNewChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setIsNewChat(true);
    if (user?.isDeluxe) {
      setSelectedSpecialist(SpecializationType.DEFAULT);
    } else {
      setSelectedSpecialist(SpecializationType.GENERAL);
    }
    
    setInput('');
  };


  const handleModelSelection = (model: "gpt-4o-mini" | "gpt-4o" | "claude-3-5-sonnet" | "llama-3") => {
    setSelectedModel(model);
    selectAIModel(user, model);
    setModelModalVisible(false);
  };

  const handleSpecialistChange = (newSpecialist: SpecializationType) => {
    setSelectedSpecialist(newSpecialist);
    setMessages([]);
    setConversationHistory([]);
    setIsNewChat(true);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) return;

    const limitReached = await hasReachedLimit(user.isPro, user.isDeluxe);
    if (limitReached) {
      const limitMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: "You've reached your daily message limit. Consider upgrading to continue chatting!",
        character: SpecializationType.DEFAULT,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, limitMessage]);
      await loadRemainingMessages();
      return;
    }

    setIsLoading(true);
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      character: selectedSpecialist,
      timestamp: new Date(),
      replyTo: replyingTo
    };

    const streamingMessage: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      character: selectedSpecialist,
      timestamp: new Date(),
      isPartial: true
    };
  
    setMessages(prev => [...prev, tempUserMessage, streamingMessage]);
    setInput("");
    setReplyingTo(null);
  
    try {
      await incrementMessageCount(user.isPro, user.isDeluxe);
      
      const response = await getAIResponse(
        input,
        user,
        conversationHistory,
        user.isDeluxe ? selectedSpecialist : undefined,
        selectedSpecialist,
        isNewChat,
        selectedModel,
        (chunk: string) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.isPartial) {
              lastMessage.content = lastMessage.content + chunk;
            }
            return newMessages;
          });
        }
      );
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isPartial) {
          lastMessage.content = response.responseText;
          lastMessage.isPartial = false;
          lastMessage.character = response.newSpecialist || selectedSpecialist;
        }
        return newMessages;
      });
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isPartial) {
          lastMessage.content = response.responseText;
          lastMessage.isPartial = false;
          lastMessage.character = response.newSpecialist || selectedSpecialist;
        }
        return newMessages;
      });
  
      setConversationHistory(response.updatedHistory.map(chatMessage => ({
        id: Date.now(),
        role: chatMessage.role,
        content: chatMessage.content,
        character: selectedSpecialist,
        timestamp: new Date()
      })));
      setIsNewChat(false);
      await loadRemainingMessages();
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: error.message || "Technical issue...",
        character: SpecializationType.DEFAULT,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRemainingMessages();
    }
  }, [user, messages.length]);

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
            onValueChange={(itemValue: SpecializationType) => setSelectedSpecialist(itemValue)}
            style={{ width: "100%", color: "black" }}
          >
            {Object.entries(characters).map(([key, char]) => (
              <Picker.Item
                key={key}
                label={char.name}
                value={key as SpecializationType}
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

  const renderModelPicker = () => (
    <Modal animationType="slide" transparent={true} visible={isModelModalVisible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose AI Model:</Text>
          <Picker
            selectedValue={selectedModel}
            onValueChange={(itemValue) => setSelectedModel(itemValue)}
            style={{ width: "100%", color: "black" }}
          >
          <Picker.Item label="GPT-4o" value="gpt-4o" color='black' />
          <Picker.Item label="GPT-4o Mini" value="gpt-4-turbo" color='black' />
          <Picker.Item label="Claude 3-5 Sonnet" value="claude-3-5-sonnet" color='black' />
          <Picker.Item label="Llama 3" value="llama-3" color='black' />
          </Picker>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleModelSelection(selectedModel)}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderReplyingTo = () => {
    if (!replyingTo) return null;
  
    return (
      <View style={{
        backgroundColor: currentColors.inputBackground,
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: currentColors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: currentColors.textPrimary }}>
            Replying to: {replyingTo.content.substring(0, 30)}
            {replyingTo.content.length > 30 ? '...' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyingTo(null)}>
          <AntDesign name="close" size={20} color={currentColors.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        style={{ flex: 1 }}
      >
          <View style={styles.highlight}>
            <Text style={{ fontSize: 12 }}>
                  {t('chat.disclaimer')}
            </Text>
          </View>
          {!user?.isPro && !user?.isDeluxe && (
          <ChatLimit remainingMessages={remainingMessages} />
        )}
        <View style={{ flex: 1 }}>
          {renderSpecialistPicker()}
          {renderModelPicker()}
        {user?.isDeluxe ? (
            <View style={styles.customizationContainer}>
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.customButtonText}>Specialist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customButton}
                onPress={() => setModelModalVisible(true)}
              >
                <Text style={styles.customButtonText}>AI Model</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customButton}
                onPress={handleNewChat}
              >
                <Text style={styles.customButtonText}>New Chat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
            >
              <Text style={styles.customButtonText}>New Chat</Text>
            </TouchableOpacity>
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ChatMessage 
                message={item}
                onReply={handleReply}
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
              zIndex: 2
            }}
          >
            {renderReplyingTo()}  {/* Add this line */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingBottom: Platform.OS === "ios" ? 65 : 15,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: currentColors.border,
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
    backgroundColor: "#fff",
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
  highlight: {
    width: "100%",
    backgroundColor: "#E6F7FF",
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007BFF",
    color: "rgb(161 98 7)",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
    marginVertical: 10,
  },
  changeButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "48%",
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    margin: 10,
  },
  newChatButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  specialistInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
    borderRadius: 8,
  },
  customizationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  customButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Home;