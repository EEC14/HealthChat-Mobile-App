import { db } from "@/firebase";
import { Badge, UserBadges } from "../types/badge";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

// Available badges in the app
export const BADGES: Record<string, Badge> = {
  "first_challenge": {
    id: "first_challenge",
    name: "First Step",
    description: "Completed your first challenge",
    icon: "🏆",
  },
  "five_challenges": {
    id: "five_challenges",
    name: "Getting Strong",
    description: "Completed 5 challenges",
    icon: "💪",
  },
  "ten_challenges": {
    id: "ten_challenges",
    name: "Challenge Master",
    description: "Completed 10 challenges",
    icon: "🏅",
  },
  "streak_seven": {
    id: "streak_seven",
    name: "Consistency King",
    description: "Completed challenges for 7 days in a row",
    icon: "🔥",
  }
};

// Initialize user badges if they don't exist
export const initializeUserBadges = async (userId: string): Promise<UserBadges> => {
  try {
    const userBadgesRef = doc(db, "userBadges", userId);
    const userBadgesSnap = await getDoc(userBadgesRef);
    
    if (!userBadgesSnap.exists()) {
      // Create initial badges object with all badges set to not earned
      const initialBadges: UserBadges = {
        userId,
        badges: Object.keys(BADGES).reduce((acc, badgeId) => {
          acc[badgeId] = { earned: false };
          return acc;
        }, {} as Record<string, { earned: boolean, earnedAt?: Date }>),
        completedChallenges: 0,
        streakDays: 0,
      };
      
      await setDoc(userBadgesRef, initialBadges);
      return initialBadges;
    }
    
    // Convert from Firestore data
    const data = userBadgesSnap.data() as UserBadges;
    
    // Convert Timestamp to Date for lastCompletedDate if it exists
    if (data.lastCompletedDate) {
      data.lastCompletedDate = (data.lastCompletedDate as unknown as Timestamp).toDate();
    }
    
    // Convert earned dates if they exist
    Object.keys(data.badges).forEach(badgeId => {
      if (data.badges[badgeId].earnedAt) {
        data.badges[badgeId].earnedAt = (data.badges[badgeId].earnedAt as unknown as Timestamp).toDate();
      }
    });
    
    return data;
  } catch (error) {
    console.error("Error initializing user badges:", error);
    throw error;
  }
};

// Fetch user badges
export const getUserBadges = async (userId: string): Promise<UserBadges> => {
  try {
    //console.log(`[DEBUG] Getting badges for user: ${userId}`);
    const userBadges = await initializeUserBadges(userId);
    //console.log('[DEBUG] Current user badges:', JSON.stringify(userBadges.badges));
    return userBadges;
  } catch (error) {
    //console.error("Error getting user badges:", error);
    throw error;
  }
};

// In awardBadge function
export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  try {
    console.log(`[DEBUG] Attempting to award badge ${badgeId} to user ${userId}`);
    const userBadgesRef = doc(db, "userBadges", userId);
    const userBadges = await getUserBadges(userId);
    
    // Check if badge is already earned
    console.log(`[DEBUG] Badge ${badgeId} already earned:`, userBadges.badges[badgeId]?.earned);
    if (userBadges.badges[badgeId]?.earned) {
      console.log(`[DEBUG] Badge ${badgeId} already earned, skipping award`);
      return; // Badge already earned, do nothing
    }
    
    // Award the badge
    console.log(`[DEBUG] Updating Firestore to award badge ${badgeId}`);
    await updateDoc(userBadgesRef, {
      [`badges.${badgeId}.earned`]: true,
      [`badges.${badgeId}.earnedAt`]: serverTimestamp()
    });
    console.log(`[DEBUG] Badge ${badgeId} awarded successfully`);

    // Add to activity feed
    try {
      const activityRef = collection(db, "activities");
      await setDoc(doc(activityRef), {
        userId,
        type: "badge_earned",
        badgeId,
        badgeName: BADGES[badgeId].name,
        timestamp: serverTimestamp()
      });
      console.log(`[DEBUG] Badge activity recorded for ${badgeId}`);
    } catch (activityError) {
      console.error(`[DEBUG] Error recording badge activity:`, activityError);
    }
  } catch (error) {
    console.error(`[DEBUG] Error awarding badge ${badgeId}:`, error);
    throw error;
  }
};

// In trackChallengeCompletion function
export const trackChallengeCompletion = async (userId: string): Promise<string[]> => {
  try {
    console.log(`[DEBUG] Tracking challenge completion for user ${userId}`);
    const userBadgesRef = doc(db, "userBadges", userId);
    const userBadges = await getUserBadges(userId);
    const today = new Date();
    const earnedBadges: string[] = [];
    
    // Increment completedChallenges counter
    const completedChallenges = userBadges.completedChallenges + 1;
    console.log(`[DEBUG] New completed challenges count: ${completedChallenges}`);
    
    // Log streak status
    let streakDays = userBadges.streakDays;
    const lastCompleted = userBadges.lastCompletedDate;
    console.log(`[DEBUG] Current streak: ${streakDays}, Last completed:`, lastCompleted);
    
    // Streak logic with debugging
    if (lastCompleted) {
      // Format dates for debugging
      const lastCompletedStr = `${lastCompleted.getFullYear()}-${lastCompleted.getMonth()+1}-${lastCompleted.getDate()}`;
      const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${yesterdayDate.getMonth()+1}-${yesterdayDate.getDate()}`;
      
      console.log(`[DEBUG] Date comparison - Last: ${lastCompletedStr}, Today: ${todayStr}, Yesterday: ${yesterdayStr}`);
      
      // Check if the last completion was yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCompleted.getFullYear() === yesterday.getFullYear() &&
          lastCompleted.getMonth() === yesterday.getMonth() &&
          lastCompleted.getDate() === yesterday.getDate()) {
        // It was yesterday, increment streak
        streakDays += 1;
        console.log(`[DEBUG] Last completion was yesterday, incrementing streak to ${streakDays}`);
      } else if (lastCompleted.getFullYear() === today.getFullYear() &&
                lastCompleted.getMonth() === today.getMonth() &&
                lastCompleted.getDate() === today.getDate()) {
        // Already completed today, don't increment
        console.log(`[DEBUG] Already completed a challenge today, streak stays at ${streakDays}`);
      } else {
        // Streak broken
        streakDays = 1;
        console.log(`[DEBUG] Streak broken, resetting to 1`);
      }
    } else {
      // First completion ever
      streakDays = 1;
      console.log(`[DEBUG] First ever completion, setting streak to 1`);
    }
    
    // Update user badges data
    console.log(`[DEBUG] Updating user badges with new data`);
    await updateDoc(userBadgesRef, {
      completedChallenges,
      streakDays,
      lastCompletedDate: Timestamp.fromDate(today)
    });
    console.log(`[DEBUG] User badges updated successfully`);
    
    // Check for badge eligibility
    console.log(`[DEBUG] Checking badge eligibility`);
    
    // First challenge badge
    if (completedChallenges === 1 && !userBadges.badges.first_challenge.earned) {
      console.log(`[DEBUG] Eligible for first_challenge badge`);
      await awardBadge(userId, "first_challenge");
      earnedBadges.push("first_challenge");
    }
    
    // Five challenges badge
    if (completedChallenges >= 5 && !userBadges.badges.five_challenges.earned) {
      console.log(`[DEBUG] Eligible for five_challenges badge`);
      await awardBadge(userId, "five_challenges");
      earnedBadges.push("five_challenges");
    }
    
    // Ten challenges badge
    if (completedChallenges >= 10 && !userBadges.badges.ten_challenges.earned) {
      console.log(`[DEBUG] Eligible for ten_challenges badge`);
      await awardBadge(userId, "ten_challenges");
      earnedBadges.push("ten_challenges");
    }
    
    // Streak badge
    if (streakDays >= 7 && !userBadges.badges.streak_seven.earned) {
      console.log(`[DEBUG] Eligible for streak_seven badge`);
      await awardBadge(userId, "streak_seven");
      earnedBadges.push("streak_seven");
    }
    
    console.log(`[DEBUG] Earned badges in this completion:`, earnedBadges);
    return earnedBadges;
  } catch (error) {
    console.error("[DEBUG] Error tracking challenge completion:", error);
    throw error;
  }
};