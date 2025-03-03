import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SavedPlan } from '../../types';
import { updatePlan } from '../../utils/planStorage';
import { parseWorkoutPlan } from '../../utils/OpenAi';
import { AntDesign } from '@expo/vector-icons';

interface PlanEditorModalProps {
  isVisible: boolean;
  onClose: () => void;
  plan: SavedPlan | null;
  onPlanUpdated: () => void;
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({
  isVisible,
  onClose,
  plan,
  onPlanUpdated
}) => {
  const [planName, setPlanName] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setPlanName(plan.name);
      setPlanContent(plan.plan);
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan || !planName.trim() || !planContent.trim()) {
      Alert.alert('Error', 'Plan name and content are required');
      return;
    }

    setIsLoading(true);
    try {
      const updates: { name: string; plan: string; audioCues?: any[] } = {
        name: planName,
        plan: planContent
      };

      // If it's a workout plan, update the audio cues
      if (plan.type === 'workout') {
        try {
          const audioCues = parseWorkoutPlan(planContent);
          updates.audioCues = audioCues;
        } catch (error) {
          console.error('Error parsing workout plan:', error);
          Alert.alert(
            'Warning',
            'Could not parse workout audio cues. Voice guidance may not work correctly.'
          );
        }
      }

      await updatePlan(plan.id, updates);
      onPlanUpdated();
      onClose();
      Alert.alert('Success', 'Plan updated successfully');
    } catch (error) {
      console.error('Error updating plan:', error);
      Alert.alert('Error', 'Failed to update plan');
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Plan Name</Text>
          <TextInput
            style={styles.nameInput}
            value={planName}
            onChangeText={setPlanName}
            placeholder="Enter plan name"
          />

          <Text style={styles.label}>Plan Content</Text>
          <View style={styles.editorContainer}>
            <ScrollView style={styles.scrollView}>
              <TextInput
                style={styles.contentInput}
                value={planContent}
                onChangeText={setPlanContent}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  editorContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentInput: {
    padding: 12,
    fontSize: 16,
    minHeight: 300,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});