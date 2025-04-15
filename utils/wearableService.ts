import { Platform } from 'react-native';
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
import { 
  WearableConnection, 
  UserHealthData, 
  HealthMetric, 
  RecoveryStatus 
} from '../types/WearableTypes';
import HealthKit, { 
  HKQuantityTypeIdentifier, 
  HKCategoryTypeIdentifier,
  HKWorkoutActivityType,
  HKUnit
} from '@kingstinct/react-native-healthkit';

const wearableConnectionsRef = collection(db, 'wearableConnections');
const healthDataRef = collection(db, 'healthData');

// HealthKit permissions
const HEALTHKIT_READ_PERMISSIONS = [
  HKQuantityTypeIdentifier.stepCount,
  HKQuantityTypeIdentifier.distanceWalkingRunning,
  HKQuantityTypeIdentifier.heartRate,
  HKCategoryTypeIdentifier.sleepAnalysis,
  HKQuantityTypeIdentifier.activeEnergyBurned
];


const HEALTHKIT_WRITE_PERMISSIONS = [
  HKQuantityTypeIdentifier.stepCount,
  HKQuantityTypeIdentifier.distanceWalkingRunning,
  HKQuantityTypeIdentifier.heartRate,
  HKCategoryTypeIdentifier.sleepAnalysis,
  HKQuantityTypeIdentifier.activeEnergyBurned
];



const inspectHealthKitModule = () => {
  const workoutMethods = Object.keys(HealthKit).filter(
    key => key.toLowerCase().includes('workout')
  );
};

const requestWorkoutAuthorization = async (): Promise<boolean> => {
  try {
    // Display available info about the HealthKit module
    inspectHealthKitModule();
    try {
      await HealthKit.requestAuthorization(['HKWorkoutTypeIdentifier'], []);
      return true;
    } catch (error) {
      console.error('Error with HKWorkoutTypeIdentifier authorization:', error);
      try {
        await HealthKit.requestAuthorization(['workoutType'], []);
        return true;
      } catch (alternativeError) {
        console.error('Error with alternative workout authorization:', alternativeError);
        
        // As a last resort, try any available workout query method to trigger implicit authorization
        if (typeof HealthKit.queryWorkouts === 'function') {
          try {
            await HealthKit.queryWorkouts({ 
              from: new Date(Date.now() - 86400000), // 24 hours ago
              to: new Date()
            });
            return true;
          } catch (queryError) {
            console.error('Error querying workouts:', queryError);
          }
        }
      }
    }
    
    console.warn('All workout authorization methods failed');
    return false;
  } catch (error) {
    console.error('Fatal error in requestWorkoutAuthorization:', error);
    return false;
  }
};

// Initialize HealthKit with proper type annotations
const initializeHealthKit = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const isAvailable = await HealthKit.isHealthDataAvailable();
    if (!isAvailable) {
      console.error('HealthKit is not available on this device');
      return false;
    }
    await HealthKit.requestAuthorization(HEALTHKIT_READ_PERMISSIONS, HEALTHKIT_WRITE_PERMISSIONS);
    
    return true;
  } catch (error) {
    console.error('Exception during HealthKit initialization:', error);
    return false;
  }
};


// Connect to wearable with proper type handling
export const connectWearable = async (connection: Omit<WearableConnection, 'id' | 'lastSynced'>): Promise<string> => {
  try {
    
    let permissionGranted = false;
    
    if (connection.type === 'appleHealth' && Platform.OS === 'ios') {
      // Core permissions are required - if these fail, connection fails
      const standardAuth = await initializeHealthKit();
      
      if (!standardAuth) {
        throw new Error('Failed to authorize core HealthKit permissions');
      }
      
      // Workout permissions are optional - we try but don't fail if they're rejected
      try {
        await requestWorkoutAuthorization();
      } catch (workoutAuthError) {
      }
      
      // Standard permissions were granted, so we succeed
      permissionGranted = true;
    } 
    else {
      throw new Error(`${connection.type} is not supported on ${Platform.OS}`);
    }
    
    if (permissionGranted) {
      // Add connection to Firestore
      const docRef = await addDoc(wearableConnectionsRef, {
        ...connection,
        isConnected: true,
        lastSynced: null,
        createdAt: serverTimestamp()
      });
      
      // Sync health data immediately
      await syncHealthData(connection.userId, connection.type);
      
      return docRef.id;
    } else {
      throw new Error(`Permission not granted for ${connection.type}`);
    }
  } catch (error) {
    console.error('Error connecting wearable:', error);
    throw error;
  }
};

// Get data from Apple HealthKit with proper type handling
const getAppleHealthData = async (): Promise<Partial<UserHealthData>> => {
  // Initialize health data
  const healthData: Partial<UserHealthData> = {
    userId: '',
    steps: [],
    heartRate: [],
    sleepData: [],
    caloriesBurned: [],
    workouts: [],
    lastUpdated: Timestamp.now()
  };
  
  // Time period (7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const options = {
    from: startDate,
    to: endDate,
  };
  
  try {
    // Get steps data
    try {
      const stepsData = await HealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.stepCount,
        options
      );
      
      if (stepsData && Array.isArray(stepsData)) {
        healthData.steps = stepsData.map(item => ({
          value: item.quantity || 0,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'HealthKit'
        }));
      }
    } catch (error) {
      console.error('Error getting steps data:', error);
    }
    
    // Get heart rate data
    try {
      const heartRateData = await HealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.heartRate,
        options
      );
      
      if (heartRateData && Array.isArray(heartRateData)) {
        healthData.heartRate = heartRateData.map(item => ({
          value: item.quantity || 0,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'HealthKit'
        }));
      }
    } catch (error) {
      console.error('Error getting heart rate data:', error);
    }
    
    // Get sleep data
    try {
      const sleepData = await HealthKit.queryCategorySamples(
        HKCategoryTypeIdentifier.sleepAnalysis,
        options
      );
      
      if (sleepData && Array.isArray(sleepData)) {
        // Map sleep categories to our quality types
        const sleepQualityMap: {[key: string]: 'deep' | 'light' | 'rem' | 'awake'} = {
          '0': 'light', // inBed
          '1': 'deep',  // asleep
          '2': 'awake', // awake
          '3': 'deep',  // deep
          '4': 'light', // core/light
          '5': 'rem'    // rem
        };
        
        healthData.sleepData = sleepData.map(item => ({
          startTime: Timestamp.fromDate(new Date(item.startDate)),
          endTime: Timestamp.fromDate(new Date(item.endDate)),
          quality: sleepQualityMap[item.value.toString()] || 'light',
          duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
        }));
      }
    } catch (error) {
      console.error('Error getting sleep data:', error);
    }
    
    // Get workout data - NOTE: different API call for workouts
    try {
      const workoutMethods = Object.keys(HealthKit).filter(
        key => key.toLowerCase().includes('workout')
      );
      if (typeof HealthKit.queryWorkouts === 'function') {
        try {
          const workoutData = await HealthKit.queryWorkouts({
            from: startDate,
            to: endDate
          });
          
          if (workoutData && Array.isArray(workoutData)) {
              
            healthData.workouts = workoutData.map(item => ({
              type: typeof item.workoutActivityType === 'number' ? 
                String(item.workoutActivityType) : 
                String(item.workoutActivityType || 'Unknown'),
              startTime: Timestamp.fromDate(new Date(item.startDate)),
              endTime: Timestamp.fromDate(new Date(item.endDate)),
              calories: item.totalEnergyBurned?.quantity || 0,
              heartRateAvg: typeof item.metadata?.averageHeartRate === 'number' 
                ? item.metadata.averageHeartRate 
                : undefined,
              heartRateMax: typeof item.metadata?.maxHeartRate === 'number' 
                ? item.metadata.maxHeartRate 
                : undefined,
              distance: item.totalDistance?.quantity || undefined
            }));
          } else {
            healthData.workouts = [];
          }
        } catch (error) {
          console.error('Error using queryWorkouts:', error);
          healthData.workouts = [];
        }
      } else {
      }
      
      // Second approach: try queryWorkoutSamples if available or first approach failed
      if ((!healthData.workouts || healthData.workouts.length === 0) && 
          typeof HealthKit.queryWorkoutSamples === 'function') {
        try {
          try {
            const workoutData = await HealthKit.queryWorkoutSamples('kcal', 'm', startDate, endDate, 0, true);
            
            if (workoutData && Array.isArray(workoutData)) {
              healthData.workouts = workoutData.map(item => ({
                type: typeof item.workoutActivityType === 'number' ? 
                  String(item.workoutActivityType) : 
                  String(item.workoutActivityType || 'Unknown'),
                startTime: Timestamp.fromDate(new Date(item.startDate)),
                endTime: Timestamp.fromDate(new Date(item.endDate)),
                calories: item.totalEnergyBurned?.quantity || 0,
                heartRateAvg: typeof item.metadata?.averageHeartRate === 'number' 
                  ? item.metadata.averageHeartRate 
                  : undefined,
                heartRateMax: typeof item.metadata?.maxHeartRate === 'number' 
                  ? item.metadata.maxHeartRate 
                  : undefined,
                distance: item.totalDistance?.quantity || undefined
              }));
            }
          } catch (basicParamError) {
            console.error('Error with basic params:', basicParamError);
            const params: any = {
              energyUnitString: 'kcal',
              distanceUnitString: 'm',
              from: startDate,
              to: endDate,
              limit: 0,
              ascending: true
            };
            
            try {
              const workoutData = await HealthKit.queryWorkoutSamples(params);
              
              if (workoutData && Array.isArray(workoutData)) {
                healthData.workouts = workoutData.map(item => ({
                  type: typeof item.workoutActivityType === 'number' ? 
                    String(item.workoutActivityType) : 
                    String(item.workoutActivityType || 'Unknown'),
                  startTime: Timestamp.fromDate(new Date(item.startDate)),
                  endTime: Timestamp.fromDate(new Date(item.endDate)),
                  calories: item.totalEnergyBurned?.quantity || 0,
                  heartRateAvg: typeof item.metadata?.averageHeartRate === 'number' 
                    ? item.metadata.averageHeartRate 
                    : undefined,
                  heartRateMax: typeof item.metadata?.maxHeartRate === 'number' 
                    ? item.metadata.maxHeartRate 
                    : undefined,
                  distance: item.totalDistance?.quantity || undefined
                }));
              }
            } catch (objectParamError) {
              console.error('Error with object params:', objectParamError);
            }
          }
        } catch (error) {
          console.error('General error in queryWorkoutSamples approach:', error);
        }
      } else if (!healthData.workouts || healthData.workouts.length === 0) {
      }
    } catch (error) {
      console.error('Error getting workout data:', error);
    }
    
    // Get calories data
    try {
      const caloriesData = await HealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.activeEnergyBurned,
        options
      );
      
      if (caloriesData && Array.isArray(caloriesData)) {
        healthData.caloriesBurned = caloriesData.map(item => ({
          value: item.quantity || 0,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'HealthKit'
        }));
      }
    } catch (error) {
      console.error('Error getting calories data:', error);
    }
    
  } catch (error) {
    console.error('Error fetching Apple Health data:', error);
  }
  
  return healthData;
};


// Check if health services are available with proper type handling
export const checkHealthServicesAvailability = async (): Promise<{
  appleHealth: boolean;
}> => {
  let appleHealth = false;
  
  if (Platform.OS === 'ios') {
    try {
      appleHealth = await HealthKit.isHealthDataAvailable();
    } catch (error) {
      console.error('Error checking HealthKit availability:', error);
    }
  }

  return {
    appleHealth
  };
};

// Sync health data from connected wearable
export const syncHealthData = async (userId: string, wearableType: string): Promise<Partial<UserHealthData>> => {
  try {
    let healthData: Partial<UserHealthData> = {
      userId,
      lastUpdated: Timestamp.now(),
      steps: [],
      heartRate: [],
      sleepData: [],
      caloriesBurned: [],
      workouts: []
    };
    
    // Normalize the wearable type to handle various inputs
    const normalizedType = wearableType.toLowerCase().trim();
    
    // Get data based on platform and wearable type
    if ((normalizedType === 'applehealth' || normalizedType === 'apple health') && Platform.OS === 'ios') {
      // Request standard authorizations
      await HealthKit.requestAuthorization(HEALTHKIT_READ_PERMISSIONS, []);
      
      // Also request workout authorization specifically 
      await requestWorkoutAuthorization();
      
      const appleHealthData = await getAppleHealthData();
      healthData = { ...appleHealthData, userId };
    } 
    else {
      throw new Error(`${wearableType} is not supported on ${Platform.OS}`);
    }
    
    // Save to Firestore
    await createOrUpdateHealthData(userId, healthData);
    
    // Update the lastSynced timestamp
    const q = query(wearableConnectionsRef, 
      where('userId', '==', userId), 
      where('type', '==', wearableType)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(wearableConnectionsRef, querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        lastSynced: serverTimestamp()
      });
    }
    
    return healthData;
  } catch (error) {
    console.error(`Error syncing ${wearableType} data:`, error);
    throw error;
  }
};

// Create or update health data
export const createOrUpdateHealthData = async (userId: string, healthData: Partial<UserHealthData>) => {
  try {
    // Check if there's an existing document
    const q = query(healthDataRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create new document
      await addDoc(healthDataRef, {
        ...healthData,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Update existing document
      const docRef = doc(healthDataRef, querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        ...healthData,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating health data:', error);
    throw error;
  }
};


export const getUserWearableConnections = async (userId: string): Promise<WearableConnection[]> => {
  try {
    const q = query(wearableConnectionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WearableConnection[];
  } catch (error) {
    console.error('Error getting wearable connections:', error);
    throw error;
  }
};

// Get user health data with fallback
export const getUserHealthData = async (userId: string): Promise<UserHealthData | null> => {
  try {
    // Check if the user has any wearable connections
    const connections = await getUserWearableConnections(userId);
    const activeConnection = connections.find(c => c.isConnected);
    
    // If there's an active connection, try to sync data if it's been a while
    if (activeConnection) {
      try {
        // If last sync was more than 1 hour ago, sync again
        const lastSyncTime = activeConnection.lastSynced?.toDate()?.getTime() || 0;
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        if (lastSyncTime < oneHourAgo) {
          await syncHealthData(userId, activeConnection.type);
        }
      } catch (syncError) {
        console.error('Error during auto-sync:', syncError);
        // Continue with existing data if sync fails
      }
    }
    
    // Get data from Firestore
    const q = query(healthDataRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // No data exists yet
      if (!activeConnection) {
        return null; // No connection, no data
      }
      
      // Try to sync data if we have a connection but no data
      try {
        await syncHealthData(userId, activeConnection.type);
        
        // Check again after sync
        const newQuery = query(healthDataRef, where('userId', '==', userId));
        const newSnapshot = await getDocs(newQuery);
        
        if (newSnapshot.empty) {
          return null; // Still no data after sync attempt
        }
        
        const docData = newSnapshot.docs[0].data();
        return {
          userId: docData.userId,
          steps: docData.steps || [],
          heartRate: docData.heartRate || [],
          sleepData: docData.sleepData || [],
          caloriesBurned: docData.caloriesBurned || [],
          workouts: docData.workouts || [],
          lastUpdated: docData.lastUpdated
        } as UserHealthData;
        
      } catch (error) {
        console.error('Error syncing on first access:', error);
        return null;
      }
    }
    
    // Return existing data
    const docData = querySnapshot.docs[0].data();
    
    return {
      userId: docData.userId,
      steps: docData.steps || [],
      heartRate: docData.heartRate || [],
      sleepData: docData.sleepData || [],
      caloriesBurned: docData.caloriesBurned || [],
      workouts: docData.workouts || [],
      lastUpdated: docData.lastUpdated
    } as UserHealthData;
  } catch (error) {
    console.error('Error getting health data:', error);
    throw error;
  }
};

// Calculate recovery status
export const calculateRecoveryStatus = async (userId: string): Promise<RecoveryStatus | null> => {
  try {
    const userData = await getUserHealthData(userId);
    
    if (!userData) {
      return null;
    }
    
    // We can proceed even without sleep data now, using heart rate data if available
    if (!userData.sleepData || userData.sleepData.length === 0) {
      if (!userData.heartRate || userData.heartRate.length === 0) {
        return null; // We need at least one of these metrics
      }
    }
    
    // Calculate sleep metrics if available
    let deepSleepPercent = 0;
    let sleepScore = 50; // Default to middle value when no sleep data
    
    if (userData.sleepData && userData.sleepData.length > 0) {
      // Sort sleep data by end time (most recent first)
      const recentSleep = userData.sleepData
        .sort((a, b) => b.endTime.toMillis() - a.endTime.toMillis())
        .slice(0, 3);
      
      // Calculate deep sleep percentage
      const totalSleepDuration = recentSleep.reduce((acc, sleep) => acc + sleep.duration, 0);
      const deepSleepDuration = recentSleep
        .filter(sleep => sleep.quality === 'deep')
        .reduce((acc, sleep) => acc + sleep.duration, 0);
      
      deepSleepPercent = totalSleepDuration > 0
        ? (deepSleepDuration / totalSleepDuration) * 100
        : 0;
        
      sleepScore = Math.min(100, Math.max(0, deepSleepPercent * 2));
    }
    
    // Get heart rate metrics
    let recentHeartRate = 70; // Default value
    let heartRateScore = 50; // Default to middle value
    
    if (userData.heartRate && userData.heartRate.length > 0) {
      recentHeartRate = userData.heartRate
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, 10)
        .reduce((acc, hr) => acc + hr.value, 0) / 
        Math.min(10, userData.heartRate.length);
      
      heartRateScore = Math.min(100, Math.max(0, 
        recentHeartRate < 60 ? 100 : 
        recentHeartRate < 70 ? 85 : 
        recentHeartRate < 80 ? 70 : 
        recentHeartRate < 90 ? 50 : 30
      ));
    }
    
    // Calculate activity level using multiple approaches
    let activityScore = 100; // Default to well-rested if no activity data
    
    // 1. First try using workout data if available
    if (userData.workouts && userData.workouts.length > 0) {
      const recentWorkouts = userData.workouts.filter(w => {
        const workoutDate = w.endTime.toDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return workoutDate > yesterday;
      });
      
      if (recentWorkouts.length > 0) {
        activityScore = Math.min(100, Math.max(0, 100 - (
          recentWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0) / 20
        )));
      }
    } 
    // 2. If no workouts, try using burned calories if available
    else if (userData.caloriesBurned && userData.caloriesBurned.length > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentCalories = userData.caloriesBurned
        .filter(c => c.timestamp.toDate() > yesterday)
        .reduce((acc, c) => acc + c.value, 0);
      
      // Adjust for calories - approximately 1000-2000 calories is moderate activity
      if (recentCalories > 0) {
        activityScore = Math.min(100, Math.max(0, 100 - (recentCalories / 30)));
      }
    }
    // 3. If no calorie data, use steps if available
    else if (userData.steps && userData.steps.length > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentSteps = userData.steps
        .filter(s => s.timestamp.toDate() > yesterday)
        .reduce((acc, s) => acc + s.value, 0);
      
      // Adjust for steps - approximately 10,000 steps is moderate activity
      if (recentSteps > 0) {
        activityScore = Math.min(100, Math.max(0, 100 - (recentSteps / 150)));
      }
    }
    // If no activity data at all, we keep the default of 100 (well-rested)
    
    // Adjust weights based on what data is available
    let sleepWeight = 0.4;
    let heartRateWeight = 0.3;
    let activityWeight = 0.3;
    
    // If sleep data is missing, redistribute its weight
    if (!userData.sleepData || userData.sleepData.length === 0) {
      heartRateWeight += sleepWeight / 2;
      activityWeight += sleepWeight / 2;
      sleepWeight = 0;
    }
    
    // Calculate overall score with adjusted weights
    const overallScore = Math.round(
      (sleepScore * sleepWeight) + 
      (heartRateScore * heartRateWeight) + 
      (activityScore * activityWeight)
    );
    
    // Generate recommendation
    let recommendation = '';
    if (overallScore < 40) {
      recommendation = 'Your body needs rest. Consider a recovery day.';
    } else if (overallScore < 60) {
      recommendation = 'Low-intensity activity is recommended today.';
    } else if (overallScore < 80) {
      recommendation = 'Your body is ready for moderate training.';
    } else {
      recommendation = 'You are well recovered for high-intensity training.';
    }
    
    // Include data source information in recommendation if workout data is missing
    if (!userData.workouts || userData.workouts.length === 0) {
      const dataSource = userData.caloriesBurned && userData.caloriesBurned.length > 0 
        ? "calorie burn" 
        : userData.steps && userData.steps.length > 0 
          ? "step count" 
          : "heart rate and sleep data";
      
      recommendation += ` (Based on your ${dataSource})`;
    }
    
    return {
      score: overallScore,
      recommendation,
      contributingFactors: {
        sleepQuality: Math.round(deepSleepPercent),
        restingHeartRate: Math.round(recentHeartRate),
        heartRateVariability: userData.heartRate?.length > 2 ? calculateHRV(userData.heartRate) : undefined,
        recentActivityLevel: Math.round(activityScore)
      }
    };
  } catch (error) {
    console.error('Error calculating recovery status:', error);
    throw error;
  }
};

// Helper function to calculate heart rate variability
const calculateHRV = (heartRateData: HealthMetric[]): number => {
  if (heartRateData.length < 5) {
    return 50; // Default value
  }
  
  // Sort by timestamp
  const sortedData = [...heartRateData]
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
  
  // Calculate differences between consecutive heart rates
  const differences: number[] = [];
  for (let i = 1; i < sortedData.length; i++) {
    differences.push(Math.abs(sortedData[i].value - sortedData[i-1].value));
  }
  
  // Calculate RMSSD (Root Mean Square of Successive Differences)
  const squaredDiffs = differences.map(diff => diff * diff);
  const meanSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
  const rmssd = Math.sqrt(meanSquaredDiff);
  
  // Convert RMSSD to a score between 0-100
  // Higher HRV is generally better for recovery
  return Math.min(100, Math.max(0, rmssd * 2));
};