import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { PlanType } from '@/types';
import { SectionEditor } from './SectionEditor';

interface PlanModifierToolbarProps {
  planType: PlanType;
  currentPlan: string;
  onPlanChange: (updatedPlan: string) => void;
}

export const PlanModifierToolbar: React.FC<PlanModifierToolbarProps> = ({
  planType,
  currentPlan,
  onPlanChange
}) => {
  const [isAddSectionModalVisible, setIsAddSectionModalVisible] = useState(false);
  const [isSectionEditorVisible, setIsSectionEditorVisible] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionContent, setSectionContent] = useState('');
  const [intensityLevel, setIntensityLevel] = useState('normal');
  const handleAddSection = () => {
    if (!sectionTitle.trim()) {
      Alert.alert('Error', 'Section title is required');
      return;
    }

    const newSection = `\n\n## ${sectionTitle}\n${sectionContent}`;
    onPlanChange(currentPlan + newSection);
    
    setIsAddSectionModalVisible(false);
    setSectionTitle('');
    setSectionContent('');
  };

  const adjustIntensity = (direction: 'increase' | 'decrease') => {
    // First check if we've already reached a limit
    if ((direction === 'increase' && intensityLevel === 'hard') || 
        (direction === 'decrease' && intensityLevel === 'easy')) {
      Alert.alert(
        'Intensity Limit', 
        `Cannot ${direction === 'increase' ? 'increase' : 'decrease'} intensity further. Already at ${intensityLevel} level.`
      );
      return;
    }
  
    try {
      // Extract the entire plan text
      let lines = currentPlan.split('\n');
      let updated = false;
      
      // Process line by line for more precise control
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle JSON blocks specially to avoid parse errors
        if (line.includes('```json')) {
            let jsonStart = i;
            let jsonEnd = -1;
            
            // Find the end of the JSON block
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].includes('```')) {
                jsonEnd = j;
                break;
              }
            }
            
            if (jsonEnd > jsonStart) {
              // Extract the full JSON block
              const jsonBlock = lines.slice(jsonStart, jsonEnd + 1).join('\n');
              
              // Extract just the JSON content
              let jsonContent = lines.slice(jsonStart + 1, jsonEnd).join('\n').trim();
              
              try {
                // Pre-process the JSON string to handle potential issues
                jsonContent = jsonContent
                  .replace(/"sets":\s*"-"/g, '"sets": 1')  // Replace "-" with default
                  .replace(/"reps":\s*"-"/g, '"reps": 10')
                  .replace(/"duration":\s*"-"/g, '"duration": 30')
                  .replace(/"rest":\s*"-"/g, '"rest": 30')
                  .replace(/"sets":\s*"(\d+)"/g, '"sets": $1')  // Convert string numbers to actual numbers
                  .replace(/"reps":\s*"(\d+)"/g, '"reps": $1')
                  .replace(/"duration":\s*"(\d+)"/g, '"duration": $1')
                  .replace(/"rest":\s*"(\d+)"/g, '"rest": $1')
                  .replace(/(\d+)-(\d+)/g, '$1');  // Take first number from ranges
                
                // Parse the sanitized JSON
                const jsonObj = JSON.parse(jsonContent);
                let jsonUpdated = false;
                
                // Update JSON properties
                if (jsonObj.sets !== undefined) {
                  jsonObj.sets = direction === 'increase' 
                    ? jsonObj.sets + 1 
                    : Math.max(1, jsonObj.sets - 1);
                  jsonUpdated = true;
                }
                
                if (jsonObj.reps !== undefined) {
                  jsonObj.reps = direction === 'increase' 
                    ? jsonObj.reps + 2 
                    : Math.max(1, jsonObj.reps - 2);
                  jsonUpdated = true;
                }
                
                if (jsonObj.duration !== undefined) {
                  jsonObj.duration = direction === 'increase' 
                    ? jsonObj.duration + 15 
                    : Math.max(15, jsonObj.duration - 15);
                  jsonUpdated = true;
                }
                
                if (jsonUpdated) {
                  // Generate new JSON block
                  const updatedJsonBlock = [
                    '```json',
                    JSON.stringify(jsonObj, null, 2),
                    '```'
                  ].join('\n');
                  
                  // Replace the entire JSON block
                  lines.splice(jsonStart, jsonEnd - jsonStart + 1, updatedJsonBlock);
                  
                  // Adjust loop index
                  i = jsonStart;
                  
                  updated = true;
                } else {
                  // Skip to after the JSON block
                  i = jsonEnd;
                }
              } catch (e) {
                console.error('JSON parsing error:', e, 'Content:', jsonContent);
                // Skip this JSON block
                i = jsonEnd;
              }
              
              continue;
            }
          }
        
        // Check for specific workout plan elements
        if (planType === 'workout') {
          // Process sets line
          if (line.includes('Sets:') || line.includes('sets:') || line.includes('🔄 Sets:')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 1 
                : Math.max(1, currentNum - 1);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
          
          // Process reps line
          else if (line.includes('Reps:') || line.includes('reps:') || line.includes('🔁 Reps:')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 2 
                : Math.max(1, currentNum - 2);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
          
          // Process duration line
          else if (line.includes('Duration:') || line.includes('duration:') || line.includes('⏱️ Duration:')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 15 
                : Math.max(15, currentNum - 15);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
        }
        
        // Handle diet plan
        else if (planType === 'diet') {
          if (line.includes('calories')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 100 
                : Math.max(1200, currentNum - 100);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
        }
        
        // Handle meditation plan
        else if (planType === 'meditation') {
          if (line.includes('minute')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 5 
                : Math.max(5, currentNum - 5);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
        }

        else if (planType === 'habit') {
          if (line.includes('minutes') || line.includes('minute')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 1 
                : Math.max(1, currentNum - 1);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          } else if (line.includes('seconds') || line.includes('second')) {
            const numMatch = line.match(/\d+/);
            if (numMatch) {
              const currentNum = parseInt(numMatch[0]);
              const newNum = direction === 'increase' 
                ? currentNum + 15 
                : Math.max(15, currentNum - 15);
              
              // Replace only the number
              lines[i] = line.replace(/\d+/, newNum.toString());
              updated = true;
            }
          }
        }
      }
      
      if (!updated) {
        Alert.alert('No Changes Made', 
          'The intensity could not be adjusted for this plan. The plan format may be different than expected.');
        return;
      }
      
      // Join lines back together
      const updatedPlan = lines.join('\n');
      
      // Update visual indicator of intensity level
      setIntensityLevel(
        direction === 'increase' 
          ? intensityLevel === 'easy' ? 'normal' : 'hard'
          : intensityLevel === 'hard' ? 'normal' : 'easy'
      );
      
      // Only call once when changes are made
      onPlanChange(updatedPlan);
      
    } catch (error) {
      console.error('Error adjusting intensity:', error);
      Alert.alert('Error', 'Failed to adjust intensity. Please try again.');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setIsAddSectionModalVisible(true)}
          >
            <Feather name="plus-square" size={22} color="#1E3A8A" />
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setIsSectionEditorVisible(true)}
          >
            <MaterialIcons name="drag-indicator" size={22} color="#1E3A8A" />
            <Text style={styles.buttonText}>Reorder</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.intensityControls}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => adjustIntensity('decrease')}
          >
            <Feather name="minus-circle" size={22} color="#1E3A8A" />
            <Text style={styles.buttonText}>Easier</Text>
          </TouchableOpacity>
          
          <View style={[
            styles.intensityIndicator,
            intensityLevel === 'easy' && styles.easyIndicator,
            intensityLevel === 'normal' && styles.normalIndicator,
            intensityLevel === 'hard' && styles.hardIndicator,
          ]}>
            <Text style={styles.intensityText}>
              {intensityLevel === 'easy' ? 'Easy' : 
               intensityLevel === 'normal' ? 'Normal' : 'Hard'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => adjustIntensity('increase')}
          >
            <Feather name="plus-circle" size={22} color="#1E3A8A" />
            <Text style={styles.buttonText}>Harder</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isAddSectionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddSectionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Section</Text>
              
              <Text style={styles.label}>Section Title</Text>
              <TextInput
                style={styles.input}
                value={sectionTitle}
                onChangeText={setSectionTitle}
                placeholder="Enter section title"
              />
              
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.textArea}
                value={sectionContent}
                onChangeText={setSectionContent}
                placeholder="Enter section content"
                multiline
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsAddSectionModalVisible(false);
                    setSectionTitle('');
                    setSectionContent('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleAddSection}
                >
                  <Text style={styles.addButtonText}>Add Section</Text>
                </TouchableOpacity>
              </View>
              
              {/* Done button to dismiss keyboard */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={dismissKeyboard}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <SectionEditor
        isVisible={isSectionEditorVisible}
        onClose={() => setIsSectionEditorVisible(false)}
        planText={currentPlan}
        onPlanChange={onPlanChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: '#e9ecef',
      padding: 10,
      width: '100%',
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toolbarButton: {
      alignItems: 'center',
      padding: 8,
    },
    buttonText: {
      fontSize: 12,
      marginTop: 4,
      color: '#1E3A8A',
    },
    intensityControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    intensityIndicator: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 15,
      marginHorizontal: 5,
    },
    easyIndicator: {
      backgroundColor: '#d1ecf1',
    },
    normalIndicator: {
      backgroundColor: '#fff3cd',
    },
    hardIndicator: {
      backgroundColor: '#f8d7da',
    },
    intensityText: {
      fontSize: 12,
      fontWeight: '600',
    },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 15,
    padding: 10,
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#007BFF',
    fontWeight: '600',
    fontSize: 16,
  },
});