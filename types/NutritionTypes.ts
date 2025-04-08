import { Timestamp } from "firebase/firestore";

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  servingSize: string;
  quantity: number;
}

export interface NutritionLog {
  id: string;
  userId: string;
  items: FoodItem[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Timestamp;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DietPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number; // in grams
    carbs: number; // in grams
    fat: number; // in grams
  };
  mealPlan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  restrictions: string[]; // e.g., "vegetarian", "gluten-free"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FoodRecognitionResult {
  className: string;
  probability: number;
}