import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import FoodScanner from './FoodScanner';
import FoodItemCard from './FoodItemCard';
import { Colors } from '../../constants/Colors';
import { 
  FoodItem, 
  NutritionLog, 
  DietPlan 
} from '../../types/NutritionTypes';
import { 
  logMeal, 
  getUserDietPlans
} from '../../utils/nutritionService';
import { 
  searchFoodByName,
  createCustomFoodItem
} from '../../utils/foodRecognitionService';
import { useAuthContext } from '../../context/AuthContext';

// Define a fallback color or access the correct structure
const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

const NutritionScannerScreen: React.FC = () => {
  const { user } = useAuthContext();
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [scannedItems, setScannedItems] = useState<FoodItem[]>([]);
  const [activeDietPlan, setActiveDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isManualAddModalVisible, setIsManualAddModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: ''
  });
  
  // Calculate nutrition totals
  const nutritionTotals = scannedItems.reduce((acc, item) => {
    acc.calories += item.calories * item.quantity;
    acc.protein += item.protein * item.quantity;
    acc.carbs += item.carbs * item.quantity;
    acc.fat += item.fat * item.quantity;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Check if current nutritional values match the diet plan
  const getDietPlanCompatibility = () => {
    if (!activeDietPlan) return { isCompatible: true, message: 'No active diet plan' };
    
    const isCaloriesOK = Math.abs(nutritionTotals.calories - activeDietPlan.dailyCalorieTarget / 4) < 100;
    const isProteinOK = Math.abs(nutritionTotals.protein - activeDietPlan.macroTargets.protein / 4) < 10;
    const isCarbsOK = Math.abs(nutritionTotals.carbs - activeDietPlan.macroTargets.carbs / 4) < 15;
    const isFatOK = Math.abs(nutritionTotals.fat - activeDietPlan.macroTargets.fat / 4) < 5;
    
    const isCompatible = isCaloriesOK && isProteinOK && isCarbsOK && isFatOK;
    
    let message = isCompatible 
      ? 'This meal aligns with your diet plan!' 
      : 'This meal may need adjustments for your diet plan.';
      
    return { isCompatible, message };
  };
  
  const compatibility = getDietPlanCompatibility();

  useEffect(() => {
    // Load user's active diet plan
    const loadDietPlan = async () => {
      if (!user) return;
      
      try {
        const plans = await getUserDietPlans(user.uid);
        if (plans.length > 0) {
          // For simplicity, just use the first plan
          setActiveDietPlan(plans[0]);
        }
      } catch (error) {
        console.error('Error loading diet plan:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDietPlan();
  }, [user]);

  // Search for foods
  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.length > 2) {
        try {
          const results = await searchFoodByName(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching foods:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    searchFoods();
  }, [searchQuery]);

  const handleFoodDetected = (food: FoodItem) => {
    setScannedItems(prev => [...prev, food]);
    setScannerVisible(false);
  };
  
  const handleDeleteFood = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSaveMeal = async () => {
    if (!user || scannedItems.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // Create nutrition log
      const nutritionLog: Omit<NutritionLog, 'id' | 'timestamp'> = {
        userId: user.uid,
        items: scannedItems,
        mealType: selectedMealType,
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat,
      };
      
      await logMeal(nutritionLog);
      
      Alert.alert(
        'Success',
        'Your meal has been logged successfully!',
        [{ text: 'OK', onPress: () => {
          // Reset the form
          setScannedItems([]);
        }}]
      );
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save your meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle manual food addition
  const handleManualFoodAdd = () => {
    try {
      const newFood = createCustomFoodItem({
        name: customFood.name,
        calories: parseFloat(customFood.calories) || 0,
        protein: parseFloat(customFood.protein) || 0,
        carbs: parseFloat(customFood.carbs) || 0,
        fat: parseFloat(customFood.fat) || 0,
        servingSize: customFood.servingSize || '1 serving'
      });
      
      setScannedItems(prev => [...prev, newFood]);
      setIsManualAddModalVisible(false);
      // Reset custom food form
      setCustomFood({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        servingSize: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Invalid food item details');
    }
  };

  const renderMealTypeSelector = () => {
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    return (
      <View style={styles.mealTypeContainer}>
        {mealTypes.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.mealTypeButton,
              selectedMealType === type && [styles.selectedMealType, { backgroundColor: PRIMARY_COLOR }]
            ]}
            onPress={() => setSelectedMealType(type)}
          >
            <Text 
              style={[
                styles.mealTypeText,
                selectedMealType === type && styles.selectedMealTypeText
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Nutrition Scanner</Text>
          {activeDietPlan && (
            <View style={styles.planContainer}>
              <Text style={styles.planLabel}>Active Plan:</Text>
              <Text style={[styles.planName, { color: PRIMARY_COLOR }]}>{activeDietPlan.name}</Text>
            </View>
          )}
        </View>
        
        {renderMealTypeSelector()}
        
        <View style={styles.foodListContainer}>
          <View style={styles.foodListHeader}>
            <Text style={styles.foodListTitle}>Food Items</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: PRIMARY_COLOR, marginRight: 8 }]}
                onPress={() => setScannerVisible(true)}
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={() => setIsManualAddModalVisible(true)}
              >
                <Ionicons name="add-outline" size={20} color="#fff" />
                <Text style={styles.scanButtonText}>Manual</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {scannedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No food items added yet. Scan or add a food item to begin.
              </Text>
            </View>
          ) : (
            <>
              {scannedItems.map((item, index) => (
                <FoodItemCard
                  key={`${item.id}-${index}`}
                  food={item}
                  onDelete={() => handleDeleteFood(index)}
                />
              ))}
              
              <View style={styles.nutritionSummary}>
                <Text style={styles.summaryTitle}>Nutrition Summary</Text>
                <View style={styles.macrosRow}>
                  <View style={styles.macroSummaryItem}>
                    <Text style={styles.macroValue}>{Math.round(nutritionTotals.calories)}</Text>
                    <Text style={styles.macroLabel}>Calories</Text>
                  </View>
                  <View style={styles.macroSummaryItem}>
                    <Text style={styles.macroValue}>{nutritionTotals.protein.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroSummaryItem}>
                    <Text style={styles.macroValue}>{nutritionTotals.carbs.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroSummaryItem}>
                    <Text style={styles.macroValue}>{nutritionTotals.fat.toFixed(1)}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </View>
              
              {activeDietPlan && (
                <View style={[
                  styles.compatibilityContainer,
                  compatibility.isCompatible ? styles.compatibleMeal : styles.incompatibleMeal
                ]}>
                  <Ionicons 
                    name={compatibility.isCompatible ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color={compatibility.isCompatible ? "#4caf50" : "#ff9800"} 
                  />
                  <Text style={styles.compatibilityText}>{compatibility.message}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      {scannedItems.length > 0 && (
        <SafeAreaView style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }, isSaving && styles.savingButton]}
            onPress={handleSaveMeal}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Meal</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      )}
      
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <FoodScanner 
          onFoodDetected={handleFoodDetected}
          onClose={() => setScannerVisible(false)}
        />
      </Modal>

      {/* Manual Food Add Modal */}
      <Modal
        visible={isManualAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsManualAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.manualAddModal}>
            <Text style={styles.manualAddTitle}>Add Custom Food</Text>
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Food Name"
              value={customFood.name}
              onChangeText={(text) => setCustomFood(prev => ({...prev, name: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Calories"
              keyboardType="numeric"
              value={customFood.calories}
              onChangeText={(text) => setCustomFood(prev => ({...prev, calories: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={customFood.protein}
              onChangeText={(text) => setCustomFood(prev => ({...prev, protein: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Carbs (g)"
              keyboardType="numeric"
              value={customFood.carbs}
              onChangeText={(text) => setCustomFood(prev => ({...prev, carbs: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Fat (g)"
              keyboardType="numeric"
              value={customFood.fat}
              onChangeText={(text) => setCustomFood(prev => ({...prev, fat: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Serving Size (optional)"
              value={customFood.servingSize}
              onChangeText={(text) => setCustomFood(prev => ({...prev, servingSize: text}))}
            />
            
            <View style={styles.manualAddButtons}>
              <TouchableOpacity 
                style={styles.manualAddCancelButton}
                onPress={() => setIsManualAddModalVisible(false)}
              >
                <Text style={styles.manualAddCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.manualAddConfirmButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={handleManualFoodAdd}
                disabled={!customFood.name || !customFood.calories}
              >
                <Text style={styles.manualAddConfirmButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 16,
    color: '#666',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    // color will be set dynamically
  },
  mealTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedMealType: {
    // backgroundColor will be set dynamically
  },
  mealTypeText: {
    fontWeight: '500',
    color: '#555',
  },
  selectedMealTypeText: {
    color: '#fff',
  },
  foodListContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  foodListTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    // backgroundColor will be set dynamically
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  nutritionSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroSummaryItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  compatibleMeal: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  incompatibleMeal: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  compatibilityText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    // backgroundColor will be set dynamically
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  manualAddModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  manualAddTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  manualAddInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  manualAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  manualAddCancelButton: {
    flex: 1,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
  manualAddCancelButtonText: {
    color: '#333',
  },
  manualAddConfirmButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  manualAddConfirmButtonText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NutritionScannerScreen;