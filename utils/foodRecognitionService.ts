import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { Platform } from 'react-native';
import { FoodRecognitionResult, FoodItem } from '../types/NutritionTypes';

// Food database (simplified mock version instead of ML model)
const FOOD_DATABASE: Record<string, Partial<FoodItem>> = {
  'apple': {
    name: 'Apple',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4,
    sugar: 19,
    servingSize: '1 medium (182g)'
  },
  'banana': {
    name: 'Banana',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    fiber: 3.1,
    sugar: 14,
    servingSize: '1 medium (118g)'
  },
  'orange': {
    name: 'Orange',
    calories: 65,
    protein: 1.3,
    carbs: 16.3,
    fat: 0.3,
    fiber: 3.4,
    sugar: 12,
    servingSize: '1 medium (131g)'
  },
  'broccoli': {
    name: 'Broccoli',
    calories: 55,
    protein: 3.7,
    carbs: 11.2,
    fat: 0.6,
    fiber: 5.1,
    sugar: 2.5,
    servingSize: '1 cup (91g)'
  },
  'chicken breast': {
    name: 'Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    servingSize: '100g cooked'
  },
  'salmon': {
    name: 'Salmon',
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    fiber: 0,
    sugar: 0,
    servingSize: '100g cooked'
  },
  'rice': {
    name: 'White Rice',
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    fiber: 0.6,
    sugar: 0.1,
    servingSize: '1 cup cooked (158g)'
  },
  'bread': {
    name: 'Bread (White)',
    calories: 75,
    protein: 2.8,
    carbs: 14.1,
    fat: 1,
    fiber: 0.8,
    sugar: 1.4,
    servingSize: '1 slice (30g)'
  },
  'egg': {
    name: 'Egg',
    calories: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 5,
    fiber: 0,
    sugar: 0.2,
    servingSize: '1 large (50g)'
  },
  'milk': {
    name: 'Milk',
    calories: 122,
    protein: 8.1,
    carbs: 11.7,
    fat: 4.8,
    fiber: 0,
    sugar: 12.3,
    servingSize: '1 cup (244g)'
  },
  'yogurt': {
    name: 'Greek Yogurt',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.4,
    fiber: 0,
    sugar: 6,
    servingSize: '170g container'
  },
  'pasta': {
    name: 'Pasta',
    calories: 221,
    protein: 8.1,
    carbs: 43.2,
    fat: 1.3,
    fiber: 2.5,
    sugar: 0.8,
    servingSize: '1 cup cooked (140g)'
  },
  'potato': {
    name: 'Potato',
    calories: 161,
    protein: 4.3,
    carbs: 37,
    fat: 0.2,
    fiber: 3.8,
    sugar: 2,
    servingSize: '1 medium (173g)'
  },
  'carrot': {
    name: 'Carrot',
    calories: 50,
    protein: 1.2,
    carbs: 12,
    fat: 0.3,
    fiber: 3.6,
    sugar: 6,
    servingSize: '1 medium (61g)'
  },
  'avocado': {
    name: 'Avocado',
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7,
    sugar: 0.7,
    servingSize: '1/2 medium (100g)'
  },
  'salad': {
    name: 'Mixed Salad',
    calories: 15,
    protein: 1.2,
    carbs: 2.9,
    fat: 0.2,
    fiber: 1.8,
    sugar: 0.8,
    servingSize: '1 cup (50g)'
  }
};

// Colors that might help identify foods
const COLOR_MAPPINGS: Record<string, string[]> = {
  'red': ['apple', 'tomato', 'strawberry'],
  'yellow': ['banana', 'lemon', 'corn'],
  'orange': ['orange', 'carrot', 'sweet potato'],
  'green': ['broccoli', 'lettuce', 'avocado', 'salad'],
  'brown': ['bread', 'potato', 'rice', 'pasta'],
  'white': ['egg', 'milk', 'yogurt', 'rice'],
  'pink': ['salmon', 'ham'],
};

// Mock food recognition
export const recognizeFood = async (
  imageUri: string,
): Promise<FoodRecognitionResult[]> => {
  try {
    // Resize the image to reduce processing time
    const resizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 300 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
    );

    // For a real app, we would send this to an API for recognition
    // For now, let's implement a basic color-based recognition
    const dominantColor = await analyzeImageColor(resizedImage.uri);
    
    // Get potential foods based on color
    const potentialFoods = COLOR_MAPPINGS[dominantColor] || Object.keys(FOOD_DATABASE).slice(0, 3);
    
    // Convert to recognition results
    return potentialFoods.map((food, index) => ({
      className: food,
      probability: 1 - (index * 0.2) // Decreasing confidence for each suggestion
    }));
  } catch (error) {
    console.error('Error recognizing food:', error);
    // Return some default items if recognition fails
    return [
      { className: 'apple', probability: 0.7 },
      { className: 'banana', probability: 0.5 },
      { className: 'salad', probability: 0.3 }
    ];
  }
};

// Simple color analyzer (this is a mock - in a real app would use image processing)
const analyzeImageColor = async (imageUri: string): Promise<string> => {
  // For simplicity, we're just returning a random color
  // In a real app, you'd use image analysis to determine dominant colors
  const colors = ['red', 'yellow', 'orange', 'green', 'brown', 'white', 'pink'];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

// Scan barcode on food packaging
export const scanBarcode = async (barcode: string): Promise<FoodItem | null> => {
  try {
    // In a real app, you would use a food database API like Open Food Facts
    // For this example, we'll just return a mock result
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock barcode responses
    const barcodeMockData: Record<string, Partial<FoodItem>> = {
      '0123456789': {
        name: 'Organic Milk',
        calories: 130,
        protein: 8,
        carbs: 12,
        fat: 5,
        sugar: 12,
        servingSize: '1 cup (240ml)'
      },
      '1234567890': {
        name: 'Whole Grain Bread',
        calories: 80,
        protein: 4,
        carbs: 15,
        fat: 1,
        fiber: 3,
        sugar: 1,
        servingSize: '1 slice (45g)'
      },
      // Add more mock barcode data as needed
    };
    
    // Check if we have a match for this barcode
    if (barcodeMockData[barcode]) {
      return {
        id: `barcode-${barcode}`,
        name: barcodeMockData[barcode].name!,
        calories: barcodeMockData[barcode].calories!,
        protein: barcodeMockData[barcode].protein!,
        carbs: barcodeMockData[barcode].carbs!,
        fat: barcodeMockData[barcode].fat!,
        fiber: barcodeMockData[barcode].fiber || 0,
        sugar: barcodeMockData[barcode].sugar || 0,
        servingSize: barcodeMockData[barcode].servingSize!,
        quantity: 1
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error scanning barcode:', error);
    return null;
  }
};

// Get nutrition info for a recognized food
export const getNutritionInfo = (foodName: string): FoodItem => {
  // Find the food in our database
  const food = Object.keys(FOOD_DATABASE).find(key => 
    foodName.toLowerCase().includes(key) || key.includes(foodName.toLowerCase())
  );
  
  // Return the food data if found
  if (food && FOOD_DATABASE[food]) {
    const foodData = FOOD_DATABASE[food];
    return {
      id: `food-${Math.random().toString(36).substring(7)}`,
      name: foodData.name!,
      calories: foodData.calories!,
      protein: foodData.protein!,
      carbs: foodData.carbs!,
      fat: foodData.fat!,
      fiber: foodData.fiber || 0,
      sugar: foodData.sugar || 0,
      servingSize: foodData.servingSize!,
      quantity: 1
    };
  }
  
  // Return generic info if not found
  return {
    id: `food-${Math.random().toString(36).substring(7)}`,
    name: foodName,
    calories: 100,
    protein: 2,
    carbs: 15,
    fat: 5,
    fiber: 0,
    sugar: 0,
    servingSize: '1 serving',
    quantity: 1
  };
};