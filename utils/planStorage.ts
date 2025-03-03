import { db } from '../firebase'; 
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
    try {
      const planData: Record<string, any> = {
        userId,
        type,
        name,
        plan,
        createdAt: Date.now()
      };
      if (audioCues && Array.isArray(audioCues) && audioCues.length > 0) {
        const cleanAudioCues = audioCues.map(cue => ({
          id: cue.id || String(Date.now()),
          type: cue.type || 'exercise',
          text: cue.text || '',
          duration: cue.duration || 0,
          priority: cue.priority || 1
        }));
        planData.audioCues = cleanAudioCues;
      }
      Object.keys(planData).forEach(key => {
        if (planData[key] === undefined) {
          delete planData[key];
        }
      });
      const docRef = await addDoc(collection(db, 'savedPlans'), planData);
      return docRef.id;
    } catch (error: unknown) {
      console.error('Detailed save plan error:', error);
      
      if (error instanceof Error) {
        console.error('Error code:', (error as any).code);
        console.error('Error message:', error.message);
        throw new Error(`Failed to save plan: ${error.message}`);
      } else {
        console.error('Unknown error type:', error);
        throw new Error('Failed to save plan due to an unexpected error');
      }
    }
}

export async function updatePlan(
  planId: string,
  updates: {
    name?: string,
    plan?: string,
    audioCues?: AudioCue[]
  }
): Promise<void> {
  try {
    const planRef = doc(db, 'savedPlans', planId);
    const updateData: Record<string, any> = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.plan) updateData.plan = updates.plan;
    if (updates.audioCues) updateData.audioCues = updates.audioCues;
    
    await updateDoc(planRef, updateData);
  } catch (error) {
    console.error('Error updating plan:', error);
    throw new Error('Failed to update plan');
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