import { db } from "@/firebase";
import { Challenge } from "../types/challenge";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  Timestamp,
  deleteDoc 
} from "firebase/firestore";

/**
 * Fetch all challenges from the 'challenges' collection in Firestore.
 */
export const fetchChallenges = async (): Promise<Challenge[]> => {
  try {
    const challengesCol = collection(db, "challenges");
    const snapshot = await getDocs(challengesCol);
    const challenges: Challenge[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        description: data.description,
        goal: data.goal,
        currentProgress: data.currentProgress,
        startDate: data.startDate.toDate(), // assuming stored as Firestore Timestamp
        endDate: data.endDate.toDate(),
        reward: data.reward,
      };
    });
    return challenges;
  } catch (error) {
    console.error("Error fetching challenges:", error);
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
    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, { currentProgress: newProgress });
  } catch (error) {
    console.error("Error updating challenge progress:", error);
  }
};

/**
 * Delete a challenge from Firestore.
 * @param challengeId - The ID of the challenge to delete.
 */
export const deleteChallenge = async (challengeId: string): Promise<void> => {
    try {
      const challengeRef = doc(db, "challenges", challengeId);
      await deleteDoc(challengeRef);
      console.log(`Challenge ${challengeId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting challenge:", error);
      throw error;
    }
  };

/**
 * Assign a reward to a user after completing a challenge.
 * @param challengeId - The ID of the completed challenge.
 * @param userId - The user's ID to assign the reward.
 */
export const assignReward = async (challengeId: string, userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const reward = "Badge Earned"; // Customize reward as needed
    await updateDoc(userRef, { rewards: arrayUnion(reward) });
    console.log(`Reward assigned for challenge ${challengeId} to user ${userId}`);
  } catch (error) {
    console.error("Error assigning reward:", error);
  }
};

/**
 * Create a new challenge using the OpenAI API to generate challenge details.
 * @param prompt - A prompt to guide the AI in creating a challenge.
 * @returns The generated document ID for the new challenge.
 *
 * Note: This implementation uses the fetch API to call the OpenAI chat completions endpoint.
 * For production, ensure you secure your OpenAI API key (do not expose it on the client).
 */
export const createChallenge = async (prompt: string): Promise<string> => {
    try {
      // Append explicit instructions to the prompt so that the response is valid JSON.
      const jsonPrompt = `${prompt}
  
  Please return ONLY a valid JSON object with the following keys:
  - "title": string
  - "description": string
  - "goal": number (e.g., number of rounds or repetitions)
  - "currentProgress": number (should be 0)
  - "startDate": string (ISO format)
  - "endDate": string (ISO format)
  - "reward": string (a short reward description)
  
  Do not include any additional text or formatting.`;
  
      // Call the OpenAI API with the modified prompt using the chat completions endpoint.
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Secure your API key; do not expose it in client-side code in production.
          "Authorization": `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Using the gpt-4o chat model
          messages: [
            {
              role: "user",
              content: jsonPrompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
  
      // Check for non-OK response and log error details.
      if (!openaiResponse.ok) {
        const errorBody = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorBody}`);
      }
  
      const openaiData = await openaiResponse.json();
  
      // Log the full response for debugging.
      console.log("OpenAI response:", openaiData);
  
      // Check if choices were returned.
      if (!openaiData.choices || openaiData.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }
  
      // Extract the AI's message content.
      const challengeText = openaiData.choices[0].message.content.trim();
      let challengeData: Omit<Challenge, "id">;
      try {
        challengeData = JSON.parse(challengeText);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${challengeText}`);
      }
  
      // Convert date strings into Firestore Timestamps.
      const challengeDoc = {
        ...challengeData,
        startDate: Timestamp.fromDate(new Date(challengeData.startDate)),
        endDate: Timestamp.fromDate(new Date(challengeData.endDate)),
      };
  
      // Add the new challenge document to Firestore.
      const challengesCol = collection(db, "challenges");
      const docRef = await addDoc(challengesCol, challengeDoc);
      return docRef.id;
    } catch (error) {
      console.error("Error creating challenge with AI:", error);
      throw error;
    }
  };