import { db, auth } from "@/firebase";
import { Challenge } from "../types/challenge";
import { CommunityChallenge } from "../types/community-challenge";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query,
  where,
  increment,
  Timestamp,
  deleteDoc,
  limit,
  orderBy
} from "firebase/firestore";

// Fetch community challenges with optional filters
export const fetchCommunityChallengers = async (
  tagFilter?: string, 
  sortBy: 'popular' | 'recent' = 'recent',
  limitCount: number = 20
): Promise<CommunityChallenge[]> => {
  try {
    const challengesCol = collection(db, "communityChallenges");
    
    // Build query based on filters
    let challengeQuery = query(
      challengesCol, 
      where("isPublic", "==", true)
    );
    
    // Add tag filter if provided
    if (tagFilter) {
      challengeQuery = query(
        challengeQuery,
        where("tags", "array-contains", tagFilter)
      );
    }
    
    // Add sorting
    if (sortBy === 'popular') {
      challengeQuery = query(challengeQuery, orderBy("participantCount", "desc"));
    } else {
      challengeQuery = query(challengeQuery, orderBy("startDate", "desc"));
    }
    
    // Add limit
    challengeQuery = query(challengeQuery, limit(limitCount));
    
    const snapshot = await getDocs(challengeQuery);
    
    const challenges: CommunityChallenge[] = snapshot.docs.map((docSnap) => {
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
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        participantCount: data.participantCount,
        isPublic: data.isPublic,
        tags: data.tags,
        likes: data.likes
      };
    });
    
    return challenges;
  } catch (error) {
    console.error("Error fetching community challenges:", error);
    return [];
  }
};

// Create a community challenge
export const createCommunityChallenge = async (
  challenge: Omit<Challenge, "id">,
  tags: string[] = [],
  isPublic: boolean = true
): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to create a community challenge");
    }
    
    // Get user's display name
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userName = userSnap.exists() 
      ? userSnap.data().displayName || "Anonymous User" 
      : "Anonymous User";
    
    const communityChallenge = {
      ...challenge,
      creatorId: currentUser.uid,
      creatorName: userName,
      participantCount: 0,
      isPublic,
      tags,
      likes: 0,
      createdAt: Timestamp.now()
    };
    
    const challengesCol = collection(db, "communityChallenges");
    const docRef = await addDoc(challengesCol, communityChallenge);
    return docRef.id;
  } catch (error) {
    console.error("Error creating community challenge:", error);
    throw error;
  }
};

// Join a community challenge
export const joinCommunityChallenge = async (challengeId: string): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to join a challenge");
    }
    
    // Get the community challenge
    const challengeRef = doc(db, "communityChallenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      throw new Error("Challenge not found");
    }
    
    const challengeData = challengeSnap.data();
    
    // Create personal copy of the challenge
    const personalChallenge: Omit<Challenge, "id"> = {
      title: challengeData.title,
      description: challengeData.description,
      goal: challengeData.goal,
      currentProgress: 0, // Start from 0
      startDate: new Date(),
      endDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)), // 30 days from now
      reward: challengeData.reward,
    };
    
    // Add reference to original challenge
    const challengesCol = collection(db, "challenges");
    const personalChallengeRef = await addDoc(challengesCol, {
      ...personalChallenge,
      originalCommunityId: challengeId
    });
    
    // Increment participant count
    await updateDoc(challengeRef, {
      participantCount: increment(1)
    });
    
    // Add to user's joined challenges
    const userChallengesRef = doc(db, "userChallenges", currentUser.uid);
    const userChallengesSnap = await getDoc(userChallengesRef);
    
    if (userChallengesSnap.exists()) {
      await updateDoc(userChallengesRef, {
        joinedChallenges: [...userChallengesSnap.data().joinedChallenges, challengeId]
      });
    } else {
      await addDoc(collection(db, "userChallenges"), {
        userId: currentUser.uid,
        joinedChallenges: [challengeId]
      });
    }
    
    return personalChallengeRef.id;
  } catch (error) {
    console.error("Error joining community challenge:", error);
    throw error;
  }
};

// Like a community challenge
export const likeCommunityChallenge = async (challengeId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to like a challenge");
    }
    
    const challengeRef = doc(db, "communityChallenges", challengeId);
    
    // Add to user's liked challenges
    const userLikesRef = doc(db, "userLikes", currentUser.uid);
    const userLikesSnap = await getDoc(userLikesRef);
    
    if (userLikesSnap.exists()) {
      const likedChallenges = userLikesSnap.data().likedChallenges || [];
      
      // Check if already liked
      if (likedChallenges.includes(challengeId)) {
        return; // Already liked
      }
      
      await updateDoc(userLikesRef, {
        likedChallenges: [...likedChallenges, challengeId]
      });
    } else {
      await addDoc(collection(db, "userLikes"), {
        userId: currentUser.uid,
        likedChallenges: [challengeId]
      });
    }
    
    // Increment like count
    await updateDoc(challengeRef, {
      likes: increment(1)
    });
  } catch (error) {
    console.error("Error liking community challenge:", error);
    throw error;
  }
};

// Share a challenge to the community
export const shareChallengeToCommunity = async (
  challengeId: string,
  isPublic: boolean = true,
  tags: string[] = []
): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to share a challenge");
    }
    
    // Get user's challenge
    const challengeRef = doc(db, "challenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      throw new Error("Challenge not found");
    }
    
    const challengeData = challengeSnap.data();
    
    // Get user's display name
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userName = userSnap.exists() 
      ? userSnap.data().displayName || "Anonymous User" 
      : "Anonymous User";
    
    // Create community version
    const communityChallenge = {
      title: challengeData.title,
      description: challengeData.description,
      goal: challengeData.goal,
      currentProgress: 0,
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + (1000 * 60 * 60 * 24 * 30))),
      reward: challengeData.reward,
      creatorId: currentUser.uid,
      creatorName: userName,
      participantCount: 0,
      isPublic,
      tags,
      likes: 0
    };
    
    const challengesCol = collection(db, "communityChallenges");
    const docRef = await addDoc(challengesCol, communityChallenge);
    return docRef.id;
  } catch (error) {
    console.error("Error sharing challenge to community:", error);
    throw error;
  }
};