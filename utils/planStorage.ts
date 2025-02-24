import { db } from '../firebase'; // Your Firebase config file
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { SavedPlan } from '../types';
import { PlanType } from '../types';
import { AudioCue } from '../types/voiceTypes';

export async function savePlan(
    userId: string,
    type: PlanType,
    name: string,
    plan: string,
    audioCues?: AudioCue[]
  ): Promise<string> {
    console.log('Starting savePlan with:', { userId, type, name, planLength: plan.length });
    
    try {
      // Create the base plan data
      const planData: Record<string, any> = {
        userId,
        type,
        name,
        plan,
        createdAt: Date.now()
      };
  
      // Only add audioCues if they exist and are not undefined
      if (audioCues && Array.isArray(audioCues) && audioCues.length > 0) {
        // Clean the audio cues to ensure no undefined values
        const cleanAudioCues = audioCues.map(cue => ({
          id: cue.id || String(Date.now()),
          type: cue.type || 'exercise',
          text: cue.text || '',
          duration: cue.duration || 0,
          priority: cue.priority || 1
        }));
        planData.audioCues = cleanAudioCues;
      }
  
      // Remove any undefined values from the object
      Object.keys(planData).forEach(key => {
        if (planData[key] === undefined) {
          delete planData[key];
        }
      });
  
      console.log('Cleaned plan data:', planData);
      console.log('Attempting to save plan to Firestore...');
      
      const docRef = await addDoc(collection(db, 'savedPlans'), planData);
      console.log('Plan saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Detailed save plan error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`Failed to save plan: ${error.message}`);
    }
}

export async function getUserPlans(userId: string): Promise<SavedPlan[]> {
  try {
    const plansRef = collection(db, 'savedPlans');
    const q = query(plansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SavedPlan));
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw new Error('Failed to fetch plans');
  }
}

export async function deletePlan(planId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'savedPlans', planId));
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw new Error('Failed to delete plan');
  }
}