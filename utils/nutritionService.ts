import { 
    collection, 
    addDoc, 
    updateDoc, 
    getDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    serverTimestamp, 
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase';
  import { DietPlan, FoodItem, NutritionLog } from '../types/NutritionTypes';
  
  // Collection references
  const nutritionLogsRef = collection(db, 'nutritionLogs');
  const dietPlansRef = collection(db, 'dietPlans');
  const userFoodsRef = collection(db, 'userFoods');
  
  // Diet Plan Functions
  export const createDietPlan = async (dietPlan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(dietPlansRef, {
      ...dietPlan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  };
  
  export const updateDietPlan = async (id: string, updates: Partial<DietPlan>) => {
    const docRef = doc(dietPlansRef, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };
  
  export const getDietPlan = async (id: string) => {
    const docRef = doc(dietPlansRef, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as DietPlan;
  };
  
  export const getUserDietPlans = async (userId: string) => {
    const q = query(dietPlansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DietPlan[];
  };
  
  // Nutrition Log Functions
  export const logMeal = async (nutritionLog: Omit<NutritionLog, 'id' | 'timestamp'>) => {
    const docRef = await addDoc(nutritionLogsRef, {
      ...nutritionLog,
      timestamp: serverTimestamp(),
    });
    
    return docRef.id;
  };
  
  export const getUserNutritionLogs = async (userId: string, startDate?: Date, endDate?: Date) => {
    let q = query(nutritionLogsRef, where('userId', '==', userId));
    
    if (startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NutritionLog[];
  };
  
  // User Custom Foods
  export const saveCustomFood = async (userId: string, foodItem: Omit<FoodItem, 'id'>) => {
    const docRef = await addDoc(userFoodsRef, {
      ...foodItem,
      userId,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  };
  
  export const getUserCustomFoods = async (userId: string) => {
    const q = query(userFoodsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FoodItem[];
  };