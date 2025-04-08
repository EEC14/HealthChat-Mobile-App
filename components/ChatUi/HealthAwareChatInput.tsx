import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import useHealthData from '../../utils/useHealthData';

// Define a fallback color or access the correct structure
const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

interface HealthAwareChatInputProps {
  onSendMessage: (message: string, includeHealthData?: boolean) => void;
  isSending: boolean;
}

const HealthAwareChatInput: React.FC<HealthAwareChatInputProps> = ({
  onSendMessage,
  isSending,
}) => {
  const [message, setMessage] = useState('');
  const [includeHealthData, setIncludeHealthData] = useState(false);
  const { isLoading, healthData, recoveryStatus, recentSleepSummary } = useHealthData();

  const hasHealthData = !!healthData || !!recoveryStatus || !!recentSleepSummary;

  const handleSend = () => {
    if (message.trim() === '' || isSending) return;

    onSendMessage(message, includeHealthData);
    setMessage('');
    setIncludeHealthData(false);
  };

  const getHealthDataPreview = () => {
    const dataSummary = [];

    if (recoveryStatus) {
      dataSummary.push(`Recovery: ${recoveryStatus.score}/100`);
    }

    if (recentSleepSummary) {
      dataSummary.push(`Sleep: ${Math.round(recentSleepSummary.totalSleepTime / 60)}hrs`);
    }

    // Add null checks for healthData and steps
    if (healthData && healthData.steps && healthData.steps.length > 0) {
      const recentSteps = healthData.steps[healthData.steps.length - 1];
      dataSummary.push(`Steps: ${recentSteps.value}`);
    }

    return dataSummary.join(' | ');
  };

  return (
    <View style={styles.container}>
      {includeHealthData && hasHealthData && (
        <View style={styles.healthDataPreview}>
          <Text style={styles.healthDataText}>
            Including health data: {getHealthDataPreview()}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setIncludeHealthData(false)}
          >
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        {hasHealthData && (
          <TouchableOpacity
            style={[
              styles.healthDataButton,
              includeHealthData && [styles.healthDataButtonActive, { backgroundColor: `${PRIMARY_COLOR}10` }],
            ]}
            onPress={() => setIncludeHealthData(!includeHealthData)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#999" />
            ) : (
              <Ionicons
                name="fitness-outline"
                size={22}
                color={includeHealthData ? PRIMARY_COLOR : '#999'}
              />
            )}
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton, 
            { backgroundColor: PRIMARY_COLOR },
            (!message.trim() || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  healthDataPreview: {
    flexDirection: 'row',
    backgroundColor: '#f0f5ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  healthDataText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  removeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDataButton: {
    padding: 10,
    borderRadius: 20,
  },
  healthDataButtonActive: {
    // Background color will be set dynamically
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    // Background color will be set dynamically
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default HealthAwareChatInput;