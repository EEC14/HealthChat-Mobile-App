import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import React, {useState, useRef, useEffect} from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard,
  StyleSheet
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: () => void;
  isLoading: boolean;
  style?: any;
}

export default function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  style,
}: ChatInputProps) {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40);

  useEffect(() => {
    if (input.trim().length > 0 && !isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [input, isLoading]);

  // Animation for focus/blur state
  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isFocused ? 1.02 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      pulseAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, []);

  // Focus the input when clicking on the area around it
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContentSizeChange = (event: { nativeEvent: { contentSize: { height: number } } }) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(40, height), 100);
    setInputHeight(newHeight);
  };

  // Handle submit with validation
  const onSubmit = () => {
    if (input.trim() && !isLoading) {
      Keyboard.dismiss();
      handleSubmit();
    }
  };

  const getButtonBackgroundColor = () => {
    if (!input.trim() || isLoading) {
      return theme === 'dark' ? 'rgba(80, 80, 100, 0.4)' : 'rgba(150, 150, 170, 0.4)';
    }
    return theme === 'dark' ? '#0A84FF' : '#007AFF';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={focusInput}
        style={styles.inputTouchable}
      >
        <Animated.View 
          style={[
            styles.inputWrapper,
            theme === 'dark' ? styles.inputWrapperDark : styles.inputWrapperLight,
            isFocused && (theme === 'dark' ? styles.inputWrapperFocusDark : styles.inputWrapperFocusLight),
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* The input itself */}
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your health..."
            placeholderTextColor={theme === 'dark' ? "#9ca3af" : "#7A7A8C"}
            style={[
              styles.input,
              { 
                color: currentColors.textPrimary,
                height: inputHeight
              }
            ]}
            multiline
            onContentSizeChange={handleContentSizeChange}
            maxLength={1000}
            onFocus={handleFocus}
            onBlur={handleBlur}
            blurOnSubmit={false}
            returnKeyType="default"
          />
          
          {/* Submit button with animations */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={!input.trim() || isLoading}
            style={[
              styles.submitButton,
              { backgroundColor: getButtonBackgroundColor() }
            ]}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size={20} />
            ) : (
              <Animated.View style={{
                transform: [{ 
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15]
                  }) 
                }],
                opacity: input.trim() ? 1 : 0.5
              }}>
                <Feather name="send" size={18} color="white" />
              </Animated.View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>

      {/* Clear button appears when there's text and input is focused */}
      {input.trim().length > 0 && isFocused && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => setInput('')}
        >
          <MaterialIcons 
            name="cancel" 
            size={16} 
            color={theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  inputTouchable: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 50,
  },
  inputWrapperDark: {
    backgroundColor: 'rgba(55, 55, 70, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(80, 80, 120, 0.3)',
  },
  inputWrapperLight: {
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: 'rgba(220, 220, 230, 0.8)',
  },
  inputWrapperFocusDark: {
    borderColor: 'rgba(100, 100, 255, 0.4)',
    backgroundColor: 'rgba(60, 60, 75, 0.95)',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  inputWrapperFocusLight: {
    borderColor: 'rgba(0, 122, 255, 0.4)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
    maxHeight: 100,
    minHeight: 24,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 60,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 100, 100, 0.15)',
    zIndex: 2,
  },
});
