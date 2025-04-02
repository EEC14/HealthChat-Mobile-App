// context/ReferralContext.tsx - Fixed version
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  serverTimestamp,
  arrayUnion,
  setDoc 
} from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { generateReferralCode } from '../utils/referralUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Define the reward tiers
const REWARD_TIERS = {
  PRO_TIER: 10,     // 10 referrals for Pro account
  DELUXE_TIER: 50,  // 50 referrals for Deluxe account
};

interface ReferralReward {
  tier: 'PRO_TIER' | 'DELUXE_TIER';
  timestamp: Date;
  reward: string;
}

interface Referral {
  id: string;
  referrerId: string;
  referralCode: string;
  usedBy: string[];
  createdAt: Date;
  expiresAt?: Date;
  rewards: {
    referrerReward: number;
    refereeReward: number;
  }
}

interface UserReferralStats {
  totalReferred: number;
  pointsEarned: number;
  referralCode: string;
  rewards?: ReferralReward[];
  lastRewardTier?: 'PRO_TIER' | 'DELUXE_TIER';
}

interface ReferralContextType {
    userReferralStats: UserReferralStats | null;
    loading: boolean;
    error: string | null;
    referralCode: string | null;
    rewardNotification: 'pro' | 'deluxe' | null;
    clearRewardNotification: () => void;
    generateNewReferralCode: () => Promise<string>;
    applyReferralCode: (code: string) => Promise<boolean>;
    shareReferralCode: () => Promise<void>;
    refreshReferralData: () => Promise<void>;
    showExpirationAlert: boolean;
    expirationInfo: {
      type: 'pro' | 'deluxe';
      date: Date;
      source: 'referral_trial' | 'referral_reward';
    } | null;
    handleCloseExpirationAlert: () => void;
  }

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use fetchUserDetails instead of refreshUser from AuthContext
  const { user, fetchUserDetails } = useAuthContext();
  const [userReferralStats, setUserReferralStats] = useState<UserReferralStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [rewardNotification, setRewardNotification] = useState<'pro' | 'deluxe' | null>(null);
  const [showExpirationAlert, setShowExpirationAlert] = useState<boolean>(false);
    const [expirationInfo, setExpirationInfo] = useState<{
    type: 'pro' | 'deluxe';
    date: Date;
    source: 'referral_trial' | 'referral_reward';
    } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserReferralData();
      checkSubscriptionExpiration(user);
    } else {
      setUserReferralStats(null);
      setReferralCode(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const checkInterval = setInterval(async () => {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isDeluxe && userData.deluxeExpiresAt) {
          const expirationDate = new Date(userData.deluxeExpiresAt);
          const now = new Date();
          
          if (now > expirationDate) {
            console.log("Background check: Found expired subscription");
            await revokeExpiredSubscription(user.uid);
          }
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [user]);

  const clearRewardNotification = () => {
    setRewardNotification(null);
  };

  /**
 * Check the user's subscription status and show expiration alerts if needed
 */
const checkSubscriptionExpiration = async (userData: any) => {
    // Skip if user has no subscriptions
    if (!userData) return;
    if (!user) return;
    const now = new Date();
    let shouldShowAlert = false;
    let expirationType: 'pro' | 'deluxe' = 'pro';
    let expirationDate = new Date();
    let source: 'referral_trial' | 'referral_reward' = 'referral_trial';
    
    // Check Deluxe first (higher priority)
    if (userData.isDeluxe && userData.deluxeExpiresAt) {
      const deluxeExpirationDate = new Date(userData.deluxeExpiresAt);
      
      // Calculate days until expiration
      const secondsUntilExpiration = Math.ceil(
        (deluxeExpirationDate.getTime() - now.getTime()) / 1000
      );
      
      // Show alerts for: day of expiration, 1 day before, 3 days before
      if (secondsUntilExpiration <= 30 || secondsUntilExpiration <= 0) {

        shouldShowAlert = true;
        expirationType = 'deluxe';
        expirationDate = deluxeExpirationDate;
        source = userData.subscriptionSource === 'referral_trial' 
          ? 'referral_trial' 
          : 'referral_reward';
        
        // Check if we already showed this alert today
        const lastAlertShown = await AsyncStorage.getItem('lastExpirationAlert');
        const today = now.toDateString();
        
        if (lastAlertShown === today) {
          shouldShowAlert = false;
        } else {
          // Set the last alert date to today
          await AsyncStorage.setItem('lastExpirationAlert', today);
        }
      }
    } 
    // Check Pro only if not already showing Deluxe alert
    else if (!shouldShowAlert && userData.isPro && userData.proExpiresAt) {
      const proExpirationDate = new Date(userData.proExpiresAt);
      
      // Calculate days until expiration
      const secondsUntilExpiration = Math.ceil(
        (proExpirationDate.getTime() - now.getTime()) / 1000
      );
      
      // Show alerts for: day of expiration, 1 day before, 3 days before
      if (secondsUntilExpiration <= 30 || secondsUntilExpiration <= 0) {
        shouldShowAlert = true;
        expirationType = 'pro';
        expirationDate = proExpirationDate;
        source = 'referral_reward'; // Pro is only from referral rewards, not trials
        
        // Check if we already showed this alert today
        const lastAlertShown = await AsyncStorage.getItem('lastExpirationAlert');
        const today = now.toDateString();
        
        if (lastAlertShown === today) {
          shouldShowAlert = false;
        } else {
          // Set the last alert date to today
          await AsyncStorage.setItem('lastExpirationAlert', today);
        }
      }
    }
    
    // Set the state to show the alert if needed
    if (shouldShowAlert) {
      setExpirationInfo({
        type: expirationType,
        date: expirationDate,
        source: source
      });
      setShowExpirationAlert(true);
      await revokeExpiredSubscription(user.uid);
    }
  };

  /**
   * Check and apply subscription rewards based on referral count
   */
  const checkAndApplyReferralRewards = async (userId: string, totalReferred: number) => {
    try {
      // Get user's current subscription status
      const userRef = doc(db, "UserProfiles", userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      
      // Check if user has already been rewarded for this tier
      const rewardsHistory = userData.referralRewards || [];
      
      // Check for Deluxe tier (higher priority)
      if (totalReferred >= REWARD_TIERS.DELUXE_TIER && 
          !rewardsHistory.some((r: any) => r.tier === 'DELUXE_TIER')) {
        
        // Apply Deluxe account for one month
        await grantDeluxeSubscription(userId);
        
        // Record the reward
        await updateDoc(userRef, {
          referralRewards: arrayUnion({
            tier: 'DELUXE_TIER',
            timestamp: serverTimestamp(),
            reward: 'Deluxe account for 1 month'
          })
        });
        
        // Create notification for user
        await addDoc(collection(db, "Notifications"), {
          userId,
          title: 'Referral Reward!',
          message: 'Congratulations! You\'ve referred 50 friends and earned a Deluxe account for 1 month.',
          read: false,
          createdAt: serverTimestamp()
        });
        
        return 'DELUXE_TIER';
      }
      
      // Check for Pro tier
      if (totalReferred >= REWARD_TIERS.PRO_TIER && 
          !rewardsHistory.some((r: any) => r.tier === 'PRO_TIER')) {
        
        // Apply Pro account for one month
        await grantProSubscription(userId);
        
        // Record the reward
        await updateDoc(userRef, {
          referralRewards: arrayUnion({
            tier: 'PRO_TIER',
            timestamp: serverTimestamp(),
            reward: 'Pro account for 1 month'
          })
        });
        
        // Create notification for user
        await addDoc(collection(db, "Notifications"), {
          userId,
          title: 'Referral Reward!',
          message: 'Congratulations! You\'ve referred 10 friends and earned a Pro account for 1 month.',
          read: false,
          createdAt: serverTimestamp()
        });
        
        return 'PRO_TIER';
      }
      
      return null;
    } catch (error) {
      console.error('Error checking referral rewards:', error);
      return null;
    }
  };

  /**
   * Grant Pro subscription for one month
   */
  const grantProSubscription = async (userId: string) => {
    try {
      const userRef = doc(db, "UserProfiles", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Calculate expiration date (1 month from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        
        // Update user subscription
        await updateDoc(userRef, {
          isPro: true,
          proExpiresAt: expirationDate.toISOString(),
          subscriptionSource: 'referral_reward',
        });
        
        // Log subscription change in a separate collection
        await addDoc(collection(db, "SubscriptionChanges"), {
          userId,
          changeType: 'upgrade_to_pro',
          source: 'referral_reward',
          previousStatus: userData.isPro ? 'pro' : 'free',
          newStatus: 'pro',
          duration: '1 month',
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error granting Pro subscription:', error);
    }
  };

  /**
   * Grant Deluxe subscription for one month
   */
  const grantDeluxeSubscription = async (userId: string) => {
    try {
      const userRef = doc(db, "UserProfiles", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Calculate expiration date (1 month from now)
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        
        // Update user subscription
        await updateDoc(userRef, {
          isDeluxe: true,
          deluxeExpiresAt: expirationDate.toISOString(),
          subscriptionSource: 'referral_reward',
        });
        
        // Log subscription change in a separate collection
        await addDoc(collection(db, "SubscriptionChanges"), {
          userId,
          changeType: 'upgrade_to_deluxe',
          source: 'referral_reward',
          previousStatus: userData.isDeluxe ? 'deluxe' : (userData.isPro ? 'pro' : 'free'),
          newStatus: 'deluxe',
          duration: '1 month',
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error granting Deluxe subscription:', error);
    }
  };

  const fetchUserReferralData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user profile from the correct collection
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If user already has referral stats
        if (userData.referralPoints !== undefined) {
          const totalReferred = userData.totalReferred || 0;
          
          // Set user referral stats
          setUserReferralStats({
            totalReferred,
            pointsEarned: userData.referralPoints || 0,
            referralCode: userData.referralCode || '',
            rewards: userData.referralRewards || [],
            lastRewardTier: userData.lastRewardTier || null
          });
          setReferralCode(userData.referralCode || null);
          
          // Check if user qualifies for rewards
          if (totalReferred >= REWARD_TIERS.PRO_TIER) {
            const rewardResult = await checkAndApplyReferralRewards(user.uid, totalReferred);
            
            // If user just received a reward, update notification state
            if (rewardResult) {
              setRewardNotification(rewardResult === 'PRO_TIER' ? 'pro' : 'deluxe');
              
              // Update the last reward tier in Firestore
              await updateDoc(userRef, {
                lastRewardTier: rewardResult
              });
              
              // Refresh user auth data to reflect subscription changes
              if (fetchUserDetails) {
                await fetchUserDetails();
              }
            }
          }
          await checkSubscriptionExpiration(userData);
          if (userData.referralCode == null && userData.referralPoints !== undefined) {
            const newCode = await generateNewReferralCode();
            setReferralCode(newCode);
          }
        } else {
          // Initialize referral stats if not present
          const newCode = await generateNewReferralCode();
          setReferralCode(newCode);
        }
      } else {
        // Create user profile if it doesn't exist
        const newCode = await generateNewReferralCode();
        setReferralCode(newCode);
      }
    } catch (err) {
      console.error("Error fetching referral data:", err);
      setError("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };
  const generateNewReferralCode = async (): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Generate a unique code
      const newCode = generateReferralCode();
      
      // Check if code exists
      const codesQuery = query(
        collection(db, "Referrals"),
        where("referralCode", "==", newCode)
      );
      const querySnapshot = await getDocs(codesQuery);
      
      if (!querySnapshot.empty) {
        // Code already exists, try again with recursion
        return generateNewReferralCode();
      }
      
      // Create new referral in Referrals collection
      await addDoc(collection(db, "Referrals"), {
        referrerId: user.uid,
        referralCode: newCode,
        usedBy: [],
        createdAt: serverTimestamp(),
        rewards: {
          referrerReward: 100, // Default points for referrer
          refereeReward: 50,   // Default points for new user
        }
      });
      
      // Update user profile with referral code
      const userProfileRef = doc(db, "UserProfiles", user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        await updateDoc(userProfileRef, {
          referralCode: newCode,
          totalReferred: 0,
          referralPoints: 0,
        });
      } else {
        // Create user profile if it doesn't exist
        await addDoc(collection(db, "UserProfiles"), {
          id: user.uid,
          referralCode: newCode,
          totalReferred: 0,
          referralPoints: 0,
        });
      }
      
      setReferralCode(newCode);
      return newCode;
    } catch (err) {
      console.error("Error generating referral code:", err);
      throw new Error("Failed to generate referral code");
    }
  };

  const applyReferralCode = async (code: string): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated");
    if (!code) throw new Error("Invalid referral code");
    
    try {
      // Find the user document in the correct collection
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      // Check if user already has a referral code
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.usedReferralCode) {
          Alert.alert("Error", "You have already used a referral code");
          return false;
        }
      }
      
      // Validate code is not user's own code
      if (code === referralCode) {
        Alert.alert("Error", "You cannot use your own referral code");
        return false;
      }
      
      // Find the referral
      const referralQuery = query(
        collection(db, "Referrals"),
        where("referralCode", "==", code)
      );
      const querySnapshot = await getDocs(referralQuery);
      
      if (querySnapshot.empty) {
        Alert.alert("Error", "Invalid referral code");
        return false;
      }
      
      const referralDoc = querySnapshot.docs[0];
      const referralData = referralDoc.data() as Referral;
      
      // Check if user already used this code
      if (referralData.usedBy.includes(user.uid)) {
        Alert.alert("Error", "You've already used this referral code");
        return false;
      }
      
      // Check if code is expired (if expiresAt is set)
      if (referralData.expiresAt && new Date(referralData.expiresAt) < new Date()) {
        Alert.alert("Error", "This referral code has expired");
        return false;
      }
      
      // Apply the referral: Add user to usedBy array
      await updateDoc(doc(db, "Referrals", referralDoc.id), {
        usedBy: arrayUnion(user.uid)
      });
      
      // Update referrer stats (who created the code)
      const referrerRef = doc(db, "users", referralData.referrerId);
      const referrerDoc = await getDoc(referrerRef);
      
      if (referrerDoc.exists()) {
        const referrerData = referrerDoc.data();
        const newTotalReferred = (referrerData.totalReferred || 0) + 1;
        const newPoints = (referrerData.referralPoints || 0) + referralData.rewards.referrerReward;
        
        await updateDoc(referrerRef, {
          totalReferred: newTotalReferred,
          referralPoints: newPoints
        });
        
        // Check if referrer qualifies for rewards now
        await checkAndApplyReferralRewards(referralData.referrerId, newTotalReferred);
      }
      
      // Calculate trial expiration date (1 week from now)
      const trialExpirationDate = new Date();
    trialExpirationDate.setMinutes(trialExpirationDate.getMinutes() + 1);
      
      // Update current user (referee) profile with bonus points and Deluxe trial
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          referralPoints: userDoc.data()?.referralPoints + referralData.rewards.refereeReward || referralData.rewards.refereeReward,
          usedReferralCode: code,
          isDeluxe: true,
          deluxeExpiresAt: trialExpirationDate.toISOString(),
          subscriptionSource: 'referral_trial'
        });
      } else {
        // Create user profile if it doesn't exist
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          referralPoints: referralData.rewards.refereeReward,
          usedReferralCode: code,
          isDeluxe: true,
          deluxeExpiresAt: trialExpirationDate.toISOString(),
          subscriptionSource: 'referral_trial',
          createdAt: serverTimestamp()
        });
      }
      
      // Log subscription change
      await addDoc(collection(db, "SubscriptionChanges"), {
        userId: user.uid,
        changeType: 'deluxe_trial',
        source: 'referral_reward',
        previousStatus: 'free',
        newStatus: 'deluxe',
        duration: '1 week',
        timestamp: serverTimestamp()
      });
      
      Alert.alert(
        "Success!", 
        "You've earned 50 points and a 1-week Deluxe membership trial!"
      );
      
      // Refresh the user stats
      await fetchUserReferralData();
      
      // Refresh user auth data to reflect subscription changes
      if (fetchUserDetails) {
        await fetchUserDetails();
      }
      
      return true;
    } catch (err) {
      console.error("Error applying referral code:", err);
      Alert.alert("Error", "Failed to apply referral code");
      return false;
    }
  };

  const revokeExpiredSubscription = async (userId: string) => {
  try {
    console.log("Revoking expired subscription for user:", userId);
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      isDeluxe: false,
      subscriptionSource: 'expired_trial'
    });
    
    // Log the change
    await addDoc(collection(db, "SubscriptionChanges"), {
      userId,
      changeType: 'trial_expired',
      source: 'system',
      previousStatus: 'deluxe',
      newStatus: 'free',
      timestamp: serverTimestamp()
    });
    
    console.log("Subscription successfully revoked");
    
    // Force refresh the user data
    await fetchUserDetails();
    
    // Also refresh referral data to update UI
    await refreshReferralData();
  } catch (error) {
    console.error("Error revoking subscription:", error);
  }
};

  const handleCloseExpirationAlert = () => {
    setShowExpirationAlert(false);
  };

  const shareReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      const result = await Share.share({
        message: `Join me on HealthChat! Use my referral code ${referralCode} and get bonus points when you sign up. Download the app now: https://healthchat-patient.esbhealthcare.com/app`,
        title: 'Join me on HealthChat',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const refreshReferralData = async () => {
    await fetchUserReferralData();
  };

  return (
    <ReferralContext.Provider
      value={{
        userReferralStats,
        loading,
        error,
        referralCode,
        rewardNotification,
        clearRewardNotification,
        generateNewReferralCode,
        applyReferralCode,
        shareReferralCode,
        refreshReferralData,
        showExpirationAlert,
        expirationInfo,
        handleCloseExpirationAlert,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferralContext = () => {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferralContext must be used within a ReferralProvider');
  }
  return context;
};