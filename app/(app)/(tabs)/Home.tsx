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
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  useWindowDimensions,
  TextInput
} from "react-native";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
import { 
  AntDesign, 
  FontAwesome5, 
  Ionicons, 
  MaterialCommunityIcons, 
  Feather 
} from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const characters = {
  general: { name: "Dr. Dave", specialization: "general practitioner" },
  orthopedic: { name: "Ortho Oscar", specialization: "orthopedic specialist" },
  physiotherapy: { name: "Physio Pete", specialization: "physiotherapist" },
  psychology: { name: "Psychology Paula", specialization: "psychologist" },
  cardiology: { name: "Cardiology Carl", specialization: "cardiologist" },
  dermatology: { name: "Dermatology Debrah", specialization: "dermatologist" },
  default: { name: "Health Assistant", specialization: "default" },
  dentistry: { name: "Dentist Dana", specialization: "dentistry"},
  gynecology: { name: "Gynecology Gwen", specialization: "gynecology"},
  pediatrics: { name: "Pediatrics Peter", specialization: "pediatrics"},
  ophthalmology: { name: "Ophthalmology Olivia", specialization: "ophthalmology"},
  otolaryngology: { name: "Otolaryngology Owen", specialization: "otolaryngology"},
  neurology: { name: "Neurology Nora", specialization: "neurology"},
  gastroenterology: { name: "Gastroenterology Greg", specialization: "gastroenterology"},
  endocrinology: { name: "Endocrinology Emma", specialization: "endocrinology"},
  urology: { name: "Urology Ugo", specialization: "urology"},
};

const promptCategories = [
  { id: 'assessment', name: 'Health Assessment', icon: 'clipboard-check' },
  { id: 'symptoms', name: 'Symptom Analysis', icon: 'stethoscope' },
  { id: 'diet', name: 'Diet Planning', icon: 'utensils' },
  { id: 'workout', name: 'Workout Design', icon: 'dumbbell' },
  { id: 'mental', name: 'Mental Health', icon: 'brain' },
  { id: 'sleep', name: 'Sleep Improvement', icon: 'bed' },
  { id: 'recovery', name: 'Recovery Strategies', icon: 'heartbeat' },
  { id: 'habits', name: 'Habit Formation', icon: 'calendar-check' },
];

// Sample prompts for demo
const samplePrompts = {
  assessment: [
    "How would you evaluate my current exercise routine for weight loss?",
    "What health markers should I track for optimal cardiovascular health?",
    "Can you help me assess my current nutrition plan for muscle building?",
  ],
  symptoms: [
    "I've been experiencing headaches after workouts. What might be causing this?",
    "My knees hurt when I climb stairs. What could be the issue?",
    "I feel unusually tired despite getting 8 hours of sleep. What might be wrong?",
  ],
  diet: [
    "Can you suggest a meal plan that helps with reducing inflammation?",
    "What foods should I eat to support muscle recovery after intense workouts?",
    "Design a vegetarian meal plan that meets my protein requirements",
  ],
  workout: [
    "Design a 30-minute HIIT workout I can do at home with no equipment",
    "What's a good strength training routine for someone with lower back issues?",
    "Create a weekly workout plan focusing on upper body strength",
  ],
  mental: [
    "What are some evidence-based techniques to reduce anxiety?",
    "How can I improve my focus during long work sessions?",
    "What meditation practices are best for stress management?",
  ],
  sleep: [
    "How can I improve my sleep quality if I work night shifts?",
    "What's the ideal bedroom setup for optimal sleep?",
    "I wake up multiple times during the night - what could help?",
  ],
  recovery: [
    "What's the best way to recover after a marathon?",
    "How should I modify my routine after a minor muscle strain?",
    "What foods speed up recovery after intense training?",
  ],
  habits: [
    "Help me create a morning routine that includes exercise",
    "How can I build a sustainable meditation habit?",
    "What's the most effective way to track my water intake daily?",
  ],
};

const glossaryTerms = [
  { term: "BMI", definition: "Body Mass Index - a measure calculated from weight and height. Formula: weight(kg)/height²(m). A screening tool, not diagnostic." },
  { term: "HIIT", definition: "High-Intensity Interval Training - Workout strategy alternating short periods of intense exercise with less intense recovery periods." },
  { term: "Macronutrients", definition: "The three main nutrients required in large amounts: proteins, carbohydrates, and fats." },
  { term: "VO2 Max", definition: "Maximum oxygen consumption during exercise, indicating aerobic fitness level." },
  { term: "Mind-Body Connection", definition: "The link between psychological factors and physical health outcomes." },
  { term: "Resting Heart Rate", definition: "The number of times your heart beats per minute when you're at complete rest. A lower resting heart rate often indicates better cardiovascular fitness." },
  { term: "Progressive Overload", definition: "Gradually increasing the weight, frequency, or number of repetitions in strength training to continuously challenge muscles." },
  { term: "Micronutrients", definition: "Vitamins and minerals required in small amounts that are essential for healthy development, disease prevention, and wellbeing." },
  { term: "Proprioception", definition: "The awareness of the position and movement of the body, sometimes called the 'sixth sense'." },
  { term: "Insulin Sensitivity", definition: "How responsive your cells are to insulin. Higher sensitivity allows cells to better use blood glucose, reducing insulin needs." },
  { term: "Myofascial Release", definition: "A manual therapy technique used to release tension in the fascia, the connective tissue surrounding muscles." },
  { term: "Ketosis", definition: "A metabolic state in which the body burns fat for fuel instead of carbohydrates, producing molecules called ketones." },
];

const models = [
  { id: "perplexity-online", name: "Perplexity", icon: "wifi" },
  { id: "gpt-4o", name: "GPT-4o", icon: "robot" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", icon: "robot" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", icon: "atom" },
  { id: "llama-3", name: "Llama 3", icon: "brain" },
];

function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState(
    user?.isDeluxe ? SpecializationType.DEFAULT : SpecializationType.GENERAL
  );
  const [activeModal, setActiveModal] = useState<'specialist' | 'model' | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [selectedModel, setSelectedModel] = useState<"perplexity-online"|"gpt-4o-mini"|"gpt-4o"|"claude-3-5-sonnet"|"llama-3">("perplexity-online");
  const [motivationalMode, setMotivationalMode] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const { t } = useTranslation();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('assessment');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const headerHeight = useRef(new Animated.Value(0)).current;
  const [searchText, setSearchText] = useState('');
  const [filteredGlossaryTerms, setFilteredGlossaryTerms] = useState(glossaryTerms);
  
  // Filter glossary terms based on search
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredGlossaryTerms(glossaryTerms);
      return;
    }
    
    const lowercaseSearch = searchText.toLowerCase();
    const filtered = glossaryTerms.filter(item => 
      item.term.toLowerCase().includes(lowercaseSearch) || 
      item.definition.toLowerCase().includes(lowercaseSearch)
    );
    setFilteredGlossaryTerms(filtered);
  }, [searchText]);

  // Initialize the chat with a welcome message
  useEffect(() => {
    if (!user) return;
    
    const specialist = characters[selectedSpecialist];
    if (!specialist) return;

    if (messages.length === 0) {
      const initialMessage: Message = {
        id: 1,
        role: 'assistant' as 'assistant',
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

  // Cleanup speech when component unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Control panel animations
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showLibrary || showGlossary ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (isFirstLoad && (showLibrary || showGlossary)) {
      setIsFirstLoad(false);
    }
  }, [showLibrary, showGlossary]);

  // Redirect if not logged in
  if (!user) {
    router.replace("/(app)/(auth)/Signin");
    return null;
  }

  // Handle reply to a message
  const handleReply = (message: Message) => {
    setReplyingTo(message);
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Load remaining message count
  const loadRemainingMessages = useCallback(async () => {
    if (!user) return;
    const remaining = await getRemainingMessages(user.isPro, user.isDeluxe);
    setRemainingMessages(remaining);
  }, [user?.isPro, user?.isDeluxe]);
  
  useEffect(() => {
    loadRemainingMessages();
  }, [loadRemainingMessages, messages.length]);

  // Start a new chat session
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
    setShowLibrary(false);
    setShowGlossary(false);
    setReplyingTo(null);
  };

  // Handle model selection
  const handleModelSelection = (model: "perplexity-online"|"gpt-4o-mini"|"gpt-4o"|"claude-3-5-sonnet"|"llama-3") => {
    setSelectedModel(model);
    selectAIModel(user, model);
    setActiveModal(null);
  };
  

  // Handle specialist change
  const handleSpecialistChange = (newSpecialist: SpecializationType) => {
    setSelectedSpecialist(newSpecialist);
    setMessages([]);
    setConversationHistory([]);
    setIsNewChat(true);
    setActiveModal(null);
  };

  // Handle prompt selection
  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    setShowLibrary(false);
    
    // Focus the input (assuming you have a ref to it)
    setTimeout(() => {
      // You might need to implement a way to focus the input
    }, 100);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) return;

    const limitReached = await hasReachedLimit(user.isPro, user.isDeluxe);
    if (limitReached) {
      const limitMessage = {
        id: Date.now(),
        role: 'assistant' as 'assistant',
        content: "You've reached your daily message limit. Consider upgrading to continue chatting!",
        character: SpecializationType.DEFAULT,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, limitMessage]);
      await loadRemainingMessages();
      return;
    }

    setIsLoading(true);
    const tempUserMessage = {
      id: Date.now(),
      role: 'user' as 'user',
      content: input,
      character: selectedSpecialist,
      timestamp: new Date(),
      replyTo: replyingTo
    };

    const streamingMessage = {
      id: Date.now() + 1,
      role: 'assistant' as 'assistant',
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
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.isPartial) {
              lastMessage.content = lastMessage.content + chunk;
            }
            return newMessages;
          });
        },
        motivationalMode
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
  
      setConversationHistory(response.updatedHistory.map(chatMessage => ({
        id: Date.now(),
        role: chatMessage.role,
        content: chatMessage.content,
        character: selectedSpecialist,
        timestamp: new Date()
      })));
      
      setIsNewChat(false);
      await loadRemainingMessages();
      
      // Scroll to the bottom after a short delay to ensure rendering is complete
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error: unknown) {
      const errorMessage = {
        id: Date.now(),
        role: 'assistant' as 'assistant',
        content: error instanceof Error ? error.message : "Technical issue occurred. Please try again.",
        character: SpecializationType.DEFAULT,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const renderModal = () => {
    if (!activeModal) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!activeModal}
        onRequestClose={() => setActiveModal(null)}
      >
        <BlurView intensity={30} style={[
          styles.modalBackdrop,
          { justifyContent: 'flex-end', paddingBottom: 200 }
        ]} tint={theme === 'dark' ? 'dark' : 'light'}>
          <Pressable 
            style={styles.backdropPress} 
            onPress={() => setActiveModal(null)}
          />
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                { color: currentColors.textPrimary }
              ]}>
                {activeModal === 'specialist' ? 'Choose Specialist' : 
                 activeModal === 'model' ? 'Choose AI Model' : ''}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={24} color={currentColors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {activeModal === 'specialist' && (
              <FlatList
                data={Object.entries(characters)}
                keyExtractor={([key]) => key}
                renderItem={({item: [key, char]}) => (
                  <TouchableOpacity 
                    style={[
                      styles.modalOption, 
                      selectedSpecialist === key && styles.selectedOption
                    ]} 
                    onPress={() => handleSpecialistChange(key as SpecializationType)}
                  >
                    <View style={styles.optionIconContainer}>
                    <FontAwesome5 
                      name={(char as any).icon || "user-md"} 
                      size={22} 
                      color={selectedSpecialist === key ? '#fff' : '#007AFF'} 
                    />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionText, 
                        selectedSpecialist === key && styles.selectedOptionText,
                        { color: selectedSpecialist === key ? '#fff' : currentColors.textPrimary }
                      ]}>
                        {char.name}
                      </Text>
                      <Text style={[
                        styles.optionSubtext,
                        { color: selectedSpecialist === key ? 'rgba(255,255,255,0.8)' : currentColors.textSecondary }
                      ]}>
                        {char.specialization}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={[styles.optionsList, { paddingBottom: 40 }]}/>
            )}
            
            {activeModal === 'model' && (
              <FlatList
                data={models}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[
                      styles.modalOption, 
                      selectedModel === item.id && styles.selectedOption
                    ]} 
                    onPress={() => handleModelSelection(item.id as "perplexity-online"|"gpt-4o-mini"|"gpt-4o"|"claude-3-5-sonnet"|"llama-3")}
                  >
                    <View style={styles.optionIconContainer}>
                      <FontAwesome5 
                        name={item.icon} 
                        size={22} 
                        color={selectedModel === item.id ? '#fff' : '#007AFF'} 
                      />
                    </View>
                    <Text style={[
                      styles.optionText, 
                      selectedModel === item.id && styles.selectedOptionText,
                      { color: selectedModel === item.id ? '#fff' : currentColors.textPrimary }
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={[styles.optionsList, { paddingBottom: 40 }]}
              />
            )}
          </Animated.View>
        </BlurView>
      </Modal>
    );
  };

  // Render the prompt library panel
  const renderPromptLibrary = () => {
    if (!showLibrary) return null;

    return (
      <Animated.View
        style={[
          styles.slidePanel,
          { 
            backgroundColor: theme === 'dark' ? 'rgba(25, 25, 35, 0.98)' : 'rgba(245, 245, 250, 0.98)',
            transform: [{ 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: currentColors.textPrimary }]}>
            Prompt Library
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowLibrary(false)}
          >
            <Ionicons name="close" size={24} color={currentColors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={promptCategories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={[
                styles.categoryItem,
                selectedPromptCategory === item.id && styles.selectedCategoryItem
              ]}
              onPress={() => setSelectedPromptCategory(item.id)}
            >
              <View style={[
                styles.categoryIcon,
                selectedPromptCategory === item.id && styles.selectedCategoryIcon
              ]}>
                <FontAwesome5 
                  name={item.icon} 
                  size={18} 
                  color={selectedPromptCategory === item.id ? '#fff' : '#007AFF'} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                { color: currentColors.textPrimary },
                selectedPromptCategory === item.id && styles.selectedCategoryText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
        
        <FlatList
          data={samplePrompts[selectedPromptCategory as keyof typeof samplePrompts] || []}
          keyExtractor={(item) => item}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={[
                styles.promptItem,
                { 
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(60, 60, 80, 0.4)' 
                    : 'rgba(220, 220, 235, 0.4)' 
                }
              ]}
              onPress={() => handlePromptSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.promptText,
                { color: currentColors.textPrimary }
              ]}>
                {item}
              </Text>
              <View style={styles.promptIconContainer}>
                <Feather name="chevron-right" size={18} color={currentColors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.promptsList}
        />
      </Animated.View>
    );
  };

  // Render the health glossary panel
  const renderGlossary = () => {
    if (!showGlossary) return null;

    return (
      <Animated.View
        style={[
          styles.slidePanel,
          { 
            backgroundColor: theme === 'dark' ? 'rgba(25, 25, 35, 0.98)' : 'rgba(245, 245, 250, 0.98)',
            transform: [{ 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: currentColors.textPrimary }]}>
            Health Glossary
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowGlossary(false)}
          >
            <Ionicons name="close" size={24} color={currentColors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={18} 
            color={currentColors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: currentColors.textPrimary }
            ]}
            placeholder="Search terms..."
            placeholderTextColor={currentColors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearch}
              onPress={() => setSearchText('')}
            >
              <Ionicons name="close-circle" size={18} color={currentColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={filteredGlossaryTerms}
          keyExtractor={(item) => item.term}
          renderItem={({item}) => (
            <View style={[
              styles.glossaryItem,
              { 
                backgroundColor: theme === 'dark' 
                  ? 'rgba(60, 60, 80, 0.4)' 
                  : 'rgba(220, 220, 235, 0.4)' 
              }
            ]}>
              <Text style={[
                styles.glossaryTerm,
                { color: currentColors.textPrimary }
              ]}>
                {item.term}
              </Text>
              <Text style={[
                styles.glossaryDefinition,
                { color: currentColors.textSecondary }
              ]}>
                {item.definition}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.glossaryList}
          ListEmptyComponent={
            <View style={styles.emptyResultContainer}>
              <Ionicons name="search-outline" size={48} color={currentColors.textSecondary} />
              <Text style={[styles.emptyResultText, { color: currentColors.textSecondary }]}>
                No matching terms found
              </Text>
            </View>
          }
        />
      </Animated.View>
    );
  };

  // Render the reply preview
  const renderReplyingTo = () => {
    if (!replyingTo) return null;
  
    return (
      <View style={[
        styles.replyContainer,
        { 
          backgroundColor: theme === 'dark' 
            ? 'rgba(40, 40, 50, 0.6)' 
            : 'rgba(240, 240, 250, 0.6)' 
        }
      ]}>
        <View style={styles.replyContent}>
          <Text style={[
            styles.replyLabel,
            { color: currentColors.textSecondary }
          ]}>
            Replying to:
          </Text>
          <Text style={[
            styles.replyText,
            { color: currentColors.textPrimary }
          ]} numberOfLines={1}>
            {replyingTo.content.substring(0, 60)}
            {replyingTo.content.length > 60 ? '...' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.replyCloseButton}
          onPress={() => setReplyingTo(null)}
        >
          <AntDesign name="close" size={18} color={currentColors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { backgroundColor: currentColors.background }
    ]}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme === 'dark' ? '#18181B' : '#F9FAFB'}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        style={styles.container}
      >
        {/* Header Section */}
        <LinearGradient
          colors={
            theme === 'dark' 
              ? ['#22223B', '#16161F'] 
              : ['#F5F7FA', '#E6F0FF']
          }
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={[
                styles.headerButton,
                { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }
              ]} 
              onPress={handleNewChat}
            >
              <Ionicons 
                name="add" 
                size={22} 
                color={theme === 'dark' ? '#A0A0FF' : '#007AFF'} 
              />
              <Text style={[
                styles.headerButtonText,
                { color: theme === 'dark' ? '#FFFFFF' : '#000000' }
              ]}>
                New
              </Text>
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              {user?.isDeluxe && (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.headerButton,
                      { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }
                    ]}
                    onPress={() => setActiveModal('specialist')}
                  >
                    <FontAwesome5 
                      name={(characters[selectedSpecialist] as any).icon || "user-md"} 
                      size={18} 
                      color={theme === 'dark' ? '#A0A0FF' : '#007AFF'} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.headerButton,
                      { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' }
                    ]}
                    onPress={() => setActiveModal('model')}
                  >
                    <Ionicons 
                      name="hardware-chip-outline" 
                      size={20} 
                      color={theme === 'dark' ? '#A0A0FF' : '#007AFF'} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.headerButton, 
                      motivationalMode && styles.activeButton,
                      { backgroundColor: motivationalMode 
                        ? '#00AA7F' 
                        : theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' 
                      }
                    ]}
                    onPress={() => setMotivationalMode(prev => !prev)}
                  >
                    <FontAwesome5 
                      name={motivationalMode ? "dumbbell" : "stethoscope"} 
                      size={18} 
                      color={motivationalMode ? "#FFFFFF" : theme === 'dark' ? '#A0A0FF' : '#007AFF'} 
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.headerInfo}>
            {!user?.isPro && !user?.isDeluxe && (
              <ChatLimit remainingMessages={remainingMessages} />
            )}
            
            <Text style={[
              styles.disclaimerText,
              { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
              {t('chat.disclaimer')}
            </Text>
            
            <View style={styles.quickTools}>
              <TouchableOpacity 
                style={[
                  styles.toolButton,
                  showLibrary && styles.activeToolButton,
                  { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}
                onPress={() => {
                  setShowGlossary(false);
                  setShowLibrary(prev => !prev);
                }}
              >
                <Ionicons 
                  name="list" 
                  size={16} 
                  color={theme === 'dark' ? '#FFFFFF' : '#000000'} 
                />
                <Text style={[
                  styles.toolText,
                  { color: theme === 'dark' ? '#FFFFFF' : '#000000' }
                ]}>
                  Prompts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.toolButton,
                  showGlossary && styles.activeToolButton,
                  { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}
                onPress={() => {
                  setShowLibrary(false);
                  setShowGlossary(prev => !prev);
                }}
              >
                <Ionicons 
                  name="book-outline" 
                  size={16} 
                  color={theme === 'dark' ? '#FFFFFF' : '#000000'} 
                />
                <Text style={[
                  styles.toolText,
                  { color: theme === 'dark' ? '#FFFFFF' : '#000000' }
                ]}>
                  Glossary
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        
        {/* Chat Section */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChatMessage 
              message={item}
              onReply={handleReply}
              motivationalMode={motivationalMode}
            />
          )}
          contentContainerStyle={[
            styles.chatContainer,
            { paddingBottom: 100 + (replyingTo ? 50 : 0) }
          ]}
          onEndReached={() => {
            // You could add "load more history" logic here if needed
          }}
          onEndReachedThreshold={0.1}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        {/* Input Section */}
        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: theme === 'dark' 
              ? 'rgba(30, 30, 40, 0.8)' 
              : 'rgba(245, 245, 250, 0.9)' 
          }
        ]}>
          {renderReplyingTo()}
          <KeyboardAvoidingView style={styles.inputRow}>
            <ShareButton 
              messages={messages}
            />
            <View style={styles.inputWrapper}>
              <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                style={styles.chatInput}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
        
        {/* Modals & Panels */}
        {renderModal()}
        {renderPromptLibrary()}
        {renderGlossary()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  headerButtonText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  activeButton: {
    backgroundColor: '#00AA7F',
  },
  headerInfo: {
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 6,
  },
  quickTools: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeToolButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  toolText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  chatContainer: {
    padding: 16,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 200, 230, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 55 : 12,
  },
  replyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200, 200, 230, 0.1)',
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
  },
  replyCloseButton: {
    padding: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  chatInput: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'rgba(40, 40, 45, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 70,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  optionsList: {
    paddingBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  slidePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryList: {
    paddingBottom: 16,
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  selectedCategoryItem: {
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryText: {
    fontWeight: '700',
  },
  promptsList: {
    paddingBottom: 100,
  },
  promptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  promptIconContainer: {
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 170, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  clearSearch: {
    padding: 4,
  },
  glossaryList: {
    paddingBottom: 100,
  },
  glossaryItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  glossaryTerm: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  glossaryDefinition: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyResultContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyResultText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Home;