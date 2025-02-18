import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { createChallenge } from '../../../utils/challengeService';

interface CreateChallengeScreenProps {
  onBack: () => void;
}

const CreateChallengeScreen: React.FC<CreateChallengeScreenProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateChallenge = async () => {
    if (!prompt) {
      Alert.alert('Error', 'Please enter a prompt to generate a challenge.');
      return;
    }
    setLoading(true);
    try {
      const challengeId = await createChallenge(prompt);
      Alert.alert('Success', `Challenge created with ID: ${challengeId}`);
      setPrompt('');
      onBack(); // Navigate back after successful creation.
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Challenge</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a prompt for challenge creation..."
        value={prompt}
        onChangeText={setPrompt}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#76c7c0" />
      ) : (
        <>
          <Button title="Create Challenge" onPress={handleCreateChallenge} />
          <Button title="Cancel" onPress={onBack} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});

export default CreateChallengeScreen;
