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
        startDate: data.startDate.toDate(),
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

export const updateChallengeProgress = async (challengeId: string, newProgress: number): Promise<void> => {
  try {
    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, { currentProgress: newProgress });
  } catch (error) {
    console.error("Error updating challenge progress:", error);
  }
};

export const deleteChallenge = async (challengeId: string): Promise<void> => {
    try {
      const challengeRef = doc(db, "challenges", challengeId);
      await deleteDoc(challengeRef);
    } catch (error) {
      console.error("Error deleting challenge:", error);
      throw error;
    }
  };

export const assignReward = async (challengeId: string, userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const reward = "Badge Earned";
    await updateDoc(userRef, { rewards: arrayUnion(reward) });
  } catch (error) {
    console.error("Error assigning reward:", error);
  }
};

export const createChallenge = async (prompt: string): Promise<string> => {
    try {
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
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", 
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
      if (!openaiResponse.ok) {
        const errorBody = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorBody}`);
      }
      const openaiData = await openaiResponse.json();
      if (!openaiData.choices || openaiData.choices.length === 0) {
        throw new Error("No response from OpenAI");
      }
  
      const challengeText = openaiData.choices[0].message.content.trim();
      let challengeData: Omit<Challenge, "id">;
      try {
        challengeData = JSON.parse(challengeText);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${challengeText}`);
      }
  
      const challengeDoc = {
        ...challengeData,
        startDate: Timestamp.fromDate(new Date(challengeData.startDate)),
        endDate: Timestamp.fromDate(new Date(challengeData.endDate)),
      };
  
      const challengesCol = collection(db, "challenges");
      const docRef = await addDoc(challengesCol, challengeDoc);
      return docRef.id;
    } catch (error) {
      console.error("Error creating challenge with AI:", error);
      throw error;
    }
  };