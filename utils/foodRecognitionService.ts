import axios from 'axios';
import { FoodItem } from '../types/NutritionTypes';

// Configuration for Open Food Facts API
const OPEN_FOOD_FACTS_API = {
  BASE_URL: 'https://world.openfoodfacts.org/api/v2',
  PRODUCT_SEARCH: '/product/',
  NUTRITION_SEARCH: '/search'
};

// Fetch nutrition data from Open Food Facts
export const searchFoodByName = async (searchTerm: string): Promise<FoodItem[]> => {
  try {
    const response = await axios.get(`${OPEN_FOOD_FACTS_API.BASE_URL}${OPEN_FOOD_FACTS_API.NUTRITION_SEARCH}`, {
      params: {
        query: searchTerm,
        fields: 'product_name,nutriments,serving_size',
        page_size: 10
      }
    });

    return response.data.products.map((product: any) => ({
      id: product.code || `food-${Math.random().toString(36).substring(7)}`,
      name: product.product_name || searchTerm,
      calories: Math.round(product.nutriments['energy-kcal_100g'] || 100),
      protein: Math.round(product.nutriments.proteins_100g || 0),
      carbs: Math.round(product.nutriments.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments.fat_100g || 0),
      fiber: Math.round(product.nutriments.fiber_100g || 0),
      sugar: Math.round(product.nutriments.sugars_100g || 0),
      servingSize: product.serving_size || '100g',
      quantity: 1
    }));
  } catch (error) {
    console.error('Error searching food by name:', error);
    // Fallback to a generic result
    return [{
      id: `food-${Math.random().toString(36).substring(7)}`,
      name: searchTerm,
      calories: 100,
      protein: 2,
      carbs: 15,
      fat: 5,
      fiber: 0,
      sugar: 0,
      servingSize: '1 serving',
      quantity: 1
    }];
  }
};

// Scan barcode using Open Food Facts API
export const scanBarcode = async (barcode: string): Promise<FoodItem | null> => {
  try {
    const response = await axios.get(`${OPEN_FOOD_FACTS_API.BASE_URL}${OPEN_FOOD_FACTS_API.PRODUCT_SEARCH}${barcode}.json`);
    
    const product = response.data.product;
    if (!product) return null;

    return {
      id: barcode,
      name: product.product_name || 'Unknown Product',
      calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
      protein: Math.round(product.nutriments.proteins_100g || 0),
      carbs: Math.round(product.nutriments.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments.fat_100g || 0),
      fiber: Math.round(product.nutriments.fiber_100g || 0),
      sugar: Math.round(product.nutriments.sugars_100g || 0),
      servingSize: product.serving_size || '100g',
      quantity: 1
    };
  } catch (error) {
    console.error('Error scanning barcode:', error);
    return null;
  }
};

// Manually add a food item
export const createCustomFoodItem = (foodData: Partial<FoodItem>): FoodItem => {
  return {
    id: `custom-${Math.random().toString(36).substring(7)}`,
    name: foodData.name || 'Custom Food',
    calories: foodData.calories || 0,
    protein: foodData.protein || 0,
    carbs: foodData.carbs || 0,
    fat: foodData.fat || 0,
    fiber: foodData.fiber || 0,
    sugar: foodData.sugar || 0,
    servingSize: foodData.servingSize || '1 serving',
    quantity: foodData.quantity || 1
  };
};