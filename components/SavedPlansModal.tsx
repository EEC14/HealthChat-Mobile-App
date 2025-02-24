import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { getUserPlans, deletePlan } from '../utils/planStorage';
import { SavedPlan } from '../types';
import { formatDate } from '../utils/dateFormatter';
import { AntDesign } from '@expo/vector-icons';

interface SavedPlansModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPlanSelect: (plan: SavedPlan) => void;
  userId: string;
}

export const SavedPlansModal: React.FC<SavedPlansModalProps> = ({
  isVisible,
  onClose,
  onPlanSelect,
  userId
}) => {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      loadPlans();
    }
  }, [isVisible]);

  const loadPlans = async () => {
    try {
      const userPlans = await getUserPlans(userId);
      setPlans(userPlans.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      Alert.alert('Error', 'Failed to load saved plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(planId);
              setPlans(plans.filter(p => p.id !== planId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Saved Plans</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : plans.length === 0 ? (
            <Text style={styles.emptyText}>No saved plans</Text>
          ) : (
            <FlatList
              data={plans}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.planItem}>
                  <TouchableOpacity
                    style={styles.planContent}
                    onPress={() => onPlanSelect(item)}
                  >
                    <Text style={styles.planName}>{item.name}</Text>
                    <Text style={styles.planType}>{item.type}</Text>
                    <Text style={styles.planDate}>
                      {formatDate(new Date(item.createdAt))}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                  >
                    <AntDesign name="delete" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
  },
  planType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  planDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});