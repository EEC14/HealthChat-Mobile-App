import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FoodItem } from '../../types/NutritionTypes';
import { Colors } from '../../constants/Colors';

// Define a fallback color or access the correct structure
const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

interface FoodItemCardProps {
  food: FoodItem;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({
  food,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const totalCalories = food.calories * food.quantity;
  const totalProtein = food.protein * food.quantity;
  const totalCarbs = food.carbs * food.quantity;
  const totalFat = food.fat * food.quantity;

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.leftContent}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.servingInfo}>
            {food.quantity} × {food.servingSize}
          </Text>
        </View>

        <View style={styles.nutritionContent}>
          <Text style={[styles.calories, { color: PRIMARY_COLOR }]}>{Math.round(totalCalories)}</Text>
          <Text style={styles.caloriesLabel}>cal</Text>
        </View>
      </View>

      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{totalProtein.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{totalCarbs.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{totalFat.toFixed(1)}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} 
              onPress={onEdit}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
  },
  nutritionContent: {
    alignItems: 'center',
  },
  calories: {
    fontSize: 20,
    fontWeight: 'bold',
    // color will be set dynamically
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
});

export default FoodItemCard;