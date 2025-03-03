import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface SectionEditorProps {
  isVisible: boolean;
  onClose: () => void;
  planText: string;
  onPlanChange: (updatedPlan: string) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  isVisible,
  onClose,
  planText,
  onPlanChange
}) => {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (isVisible) {
      const parsedSections = parsePlanToSections(planText);
      setSections(parsedSections);
    }
  }, [isVisible, planText]);

  // Convert markdown plan to sections
  const parsePlanToSections = (plan: string): Section[] => {
    if (!plan) return [];

    // Split by level 2 headings (## Heading)
    const headingRegex = /^## (.+)$/gm;
    const matches = [...plan.matchAll(headingRegex)];
    
    if (matches.length === 0) {
      // If no headings, try level 1 headings (# Heading)
      const h1Regex = /^# (.+)$/gm;
      const h1Matches = [...plan.matchAll(h1Regex)];
      
      if (h1Matches.length > 0) {
        return parseByMatches(plan, h1Matches);
      }
      
      // If still no headings, try to split by blank lines
      return [{ id: '1', title: 'Full Plan', content: plan }];
    }
    
    return parseByMatches(plan, matches);
  };
  
  const parseByMatches = (plan: string, matches: RegExpMatchArray[]): Section[] => {
    const result: Section[] = [];
    
    // Handle text before first heading as an intro section
    if (matches.length > 0 && matches[0].index && matches[0].index > 0) {
      const intro = plan.substring(0, matches[0].index).trim();
      if (intro) {
        result.push({
          id: '0',
          title: 'Introduction',
          content: intro
        });
      }
    }
    
    // Process each heading and its content
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[1];
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : plan.length;
      const content = plan.substring(startIndex, endIndex).trim();
      
      result.push({
        id: String(i + 1),
        title,
        content: `## ${title}\n${content}`
      });
    }
    
    return result;
  };

  // Save the reordered sections back to markdown
  const handleSaveSections = () => {
    // If no sections to save, exit
    if (sections.length === 0) {
      onClose();
      return;
    }
    
    // Reconstruct plan from sections
    let newPlan = '';
    
    // Add intro if it exists
    const introSection = sections.find(s => s.title === 'Introduction');
    if (introSection) {
      newPlan = introSection.content;
      newPlan += '\n\n';
    }
    
    // Add all other sections in order
    const otherSections = sections.filter(s => s.title !== 'Introduction');
    for (const section of otherSections) {
      newPlan += section.content;
      newPlan += '\n\n';
    }
    
    // Notify parent of change
    onPlanChange(newPlan.trim());
    onClose();
    
    // Provide feedback
    Alert.alert('Success', 'Plan sections have been reordered.');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Reorder Sections</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sections found</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <Text style={styles.instruction}>
                Drag and drop to reorder sections
              </Text>
              
              <DraggableFlatList
                data={sections}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setSections(data)}
                renderItem={({ item, drag, isActive }) => (
                  <ScaleDecorator>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onLongPress={drag}
                      style={[
                        styles.sectionItem,
                        isActive && styles.sectionItemActive
                      ]}
                    >
                      <View style={styles.sectionHandle}>
                        <AntDesign name="menufold" size={20} color="#666" />
                      </View>
                      <View style={styles.sectionContent}>
                        <Text style={styles.sectionTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.sectionSummary} numberOfLines={2}>
                          {item.content.split('\n')[1] || 'No content'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </ScaleDecorator>
                )}
              />
            </View>
          )}
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSections}
            >
              <Text style={styles.saveButtonText}>Save Order</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionItemActive: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHandle: {
    paddingRight: 15,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSummary: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginRight: 8,
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
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});