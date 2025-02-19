import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { createChallenge } from '../../utils/challengeService';
import { Theme, useTheme } from '@/context/ThemeContext';
import { Colors } from "@/constants/Colors";
import { useTranslation } from 'react-i18next';
interface CreateChallengeScreenProps {
  onBack: () => void;
}

const CreateChallengeScreen: React.FC<CreateChallengeScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];  
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();
  const handleCreateChallenge = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt for challenge creation.');
      return;
    }
    setLoading(true);
    try {
      const challengeId = await createChallenge(prompt);
      Alert.alert('Success', `Challenge created with ID: ${challengeId}`);
      setPrompt('');
      onBack(); // Navigate back after successful creation.
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.highlight}>
          <Text>
            {t('dietPlan.questionnaire.disclaimer')}
          </Text>
        </View>
      <Text style={[styles.header, { color: colors.textPrimary }]}>Create a New Challenge</Text>
      <Text style={[styles.instructions, { color: colors.textSecondary }]}>
        Provide a detailed prompt to guide the AI in generating a structured challenge.
      </Text>
      <TextInput
        style={[styles.input, { borderColor: colors.primary, color: '#000000' }]}
        placeholder="Enter your prompt here..."
        placeholderTextColor={'#000000'}
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.createButton, { backgroundColor: "#007AFF" }]} onPress={handleCreateChallenge}>
            <Text style={styles.createButtonText}>Create Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: "#007AFF"  }]} onPress={onBack}>
            <Text style={[styles.cancelButtonText, { color: '#ffffff' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    height: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateChallengeScreen;
