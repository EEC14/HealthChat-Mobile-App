import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Challenge } from '../types/challenge';

const db = firebase.firestore();

/**
 * Fetch all challenges from the 'challenges' collection in Firestore.
 */
export const fetchChallenges = async (): Promise<Challenge[]> => {
  try {
    const snapshot = await db.collection('challenges').get();
    const challenges: Challenge[] = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        goal: data.goal,
        currentProgress: data.currentProgress,
        startDate: data.startDate.toDate(), // Assuming data.startDate is a Firebase Timestamp
        endDate: data.endDate.toDate(),       // Assuming data.endDate is a Firebase Timestamp
        reward: data.reward,
      };
    });
    return challenges;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
};

/**
 * Update the progress of a specific challenge.
 * @param challengeId - The ID of the challenge to update.
 * @param newProgress - The new progress value.
 */
export const updateChallengeProgress = async (challengeId: string, newProgress: number): Promise<void> => {
  try {
    await db.collection('challenges').doc(challengeId).update({
      currentProgress: newProgress,
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};

/**
 * Assign a reward to a user after completing a challenge.
 * @param challengeId - The ID of the completed challenge.
 * @param userId - The user's ID to assign the reward.
 */
export const assignReward = async (challengeId: string, userId: string): Promise<void> => {
  try {
    const reward = "Badge Earned"; // Simple reward assignment, customize as needed
    await db.collection('users').doc(userId).update({
      rewards: firebase.firestore.FieldValue.arrayUnion(reward),
    });
    console.log(`Reward assigned for challenge ${challengeId} to user ${userId}`);
  } catch (error) {
    console.error('Error assigning reward:', error);
  }
};

/**
 * Create a new challenge using the OpenAI API to generate challenge details.
 * @param prompt - A prompt to guide the AI in creating a challenge.
 * @returns The generated document ID for the new challenge.
 *
 * Dependencies: The global fetch API and an environment variable OPENAI_API_KEY must be set.
 */
export const createChallenge = async (prompt: string): Promise<string> => {
  try {
    // Call the OpenAI API with the provided prompt
    const openaiResponse = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replace process.env.OPENAI_API_KEY with a secure method to access your API key
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
    
    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || openaiData.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }
    
    // Expecting the AI's response to be a JSON string that represents challenge data.
    const challengeText = openaiData.choices[0].text.trim();
    let challengeData: Omit<Challenge, 'id'>;
    try {
      challengeData = JSON.parse(challengeText);
    } catch (parseError) {
      throw new Error(`Failed to parse AI response as JSON: ${challengeText}`);
    }
    
    // Convert date strings to Firebase Timestamps
    const challengeDoc = {
      ...challengeData,
      startDate: firebase.firestore.Timestamp.fromDate(new Date(challengeData.startDate)),
      endDate: firebase.firestore.Timestamp.fromDate(new Date(challengeData.endDate)),
    };
    
    // Create the challenge in Firestore
    const docRef = await db.collection('challenges').add(challengeDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating challenge with AI:', error);
    throw error;
  }
};
