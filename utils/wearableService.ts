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

// Import health services
import AppleHealthKit from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';

// Collection references
const wearableConnectionsRef = collection(db, 'wearableConnections');
const healthDataRef = collection(db, 'healthData');

// HealthKit permissions
const HEALTHKIT_OPTIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Workout
    ],
    write: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Workout
    ]
  }
};

// Google Fit scopes
const GOOGLEFIT_OPTIONS = {
  scopes: [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_HEART_RATE_READ,
    Scopes.FITNESS_SLEEP_READ
  ]
};

// Define interface for GoogleFit authorization result
interface GoogleFitAuthResult {
  success: boolean;
  message?: string;
}

// Initialize HealthKit with proper type annotations
const initializeHealthKit = async (): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    // Use 'any' for the error type to match what the library expects
    AppleHealthKit.isAvailable((error: any, available: boolean) => {
      if (error) {
        console.error('Error checking HealthKit availability:', error);
        reject(error);
        return;
      }
      
      if (!available) {
        console.log('HealthKit is not available on this device');
        resolve(false);
        return;
      }
      
      // Initialize with proper error type
      AppleHealthKit.initHealthKit(HEALTHKIT_OPTIONS, (initError: any) => {
        if (initError) {
          console.error('Error initializing HealthKit:', initError);
          reject(initError);
          return;
        }
        
        console.log('HealthKit initialized successfully');
        resolve(true);
      });
    });
  });
};

// Define interface for GoogleFit authorization result
interface GoogleFitAuthResult {
  success: boolean;
  message?: string;
}

// Initialize Google Fit with proper type handling
const initializeGoogleFit = async (): Promise<boolean> => {
  try {
    // The return type is different across versions, so we need to handle it carefully
    const authResult = await GoogleFit.authorize(GOOGLEFIT_OPTIONS);
    
    // Check if authResult has a success property
    if (typeof authResult === 'object' && authResult !== null) {
      const typedResult = authResult as GoogleFitAuthResult;
      
      if (!typedResult.success) {
        const errorMsg = typedResult.message || 'Authorization failed';
        console.error('Google Fit authorization failed:', errorMsg);
        return false;
      }
      
      return true;
    }
    
    // If we can't determine success, assume failure
    return false;
  } catch (error) {
    console.error('Error initializing Google Fit:', error);
    throw error;
  }
};

// Connect to wearable with proper type handling
export const connectWearable = async (connection: Omit<WearableConnection, 'id' | 'lastSynced'>): Promise<string> => {
  try {
    console.log(`Connecting ${connection.type} for user ${connection.userId}`);
    
    let permissionGranted = false;
    
    if (connection.type === 'appleHealth' && Platform.OS === 'ios') {
      permissionGranted = await initializeHealthKit();
    } 
    else if (connection.type === 'googleFit' && Platform.OS === 'android') {
      permissionGranted = await initializeGoogleFit();
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

// Helper function to get health data with proper types
const getHealthKitData = <T>(method: string, options: any): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - Use dynamic method call
    AppleHealthKit[method](options, (error: any, results: T[]) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results || []);
    });
  });
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
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
  
  try {
    // Use Promise.all for parallel fetching with proper typing
    const [stepsData, heartRateData, sleepData, workoutData, caloriesData] = await Promise.all([
      getHealthKitData<any>('getDailyStepCountSamples', options),
      getHealthKitData<any>('getHeartRateSamples', options),
      getHealthKitData<any>('getSleepSamples', options),
      getHealthKitData<any>('getWorkouts', options),
      getHealthKitData<any>('getActiveEnergyBurned', options)
    ]);
    
    // Process steps data
    healthData.steps = stepsData.map(item => ({
      value: item.value || 0,
      timestamp: Timestamp.fromDate(new Date(item.endDate)),
      source: 'HealthKit'
    }));
    
    // Process heart rate data
    healthData.heartRate = heartRateData.map(item => ({
      value: item.value || 0,
      timestamp: Timestamp.fromDate(new Date(item.endDate)),
      source: 'HealthKit'
    }));
    
    // Process sleep data
    const sleepQualityMap: {[key: string]: 'deep' | 'light' | 'rem' | 'awake'} = {
      'INBED': 'light',
      'ASLEEP': 'deep',
      'AWAKE': 'awake',
      'DEEP': 'deep',
      'CORE': 'deep',
      'REM': 'rem'
    };
    
    healthData.sleepData = sleepData.map(item => ({
      startTime: Timestamp.fromDate(new Date(item.startDate)),
      endTime: Timestamp.fromDate(new Date(item.endDate)),
      quality: sleepQualityMap[item.value] || 'light',
      duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
    }));
    
    // Process workout data
    healthData.workouts = workoutData.map(item => ({
      type: item.activityName || 'Unknown',
      startTime: Timestamp.fromDate(new Date(item.start)),
      endTime: Timestamp.fromDate(new Date(item.end)),
      calories: item.totalEnergyBurned || 0,
      heartRateAvg: item.metadata?.averageHeartRate,
      heartRateMax: item.metadata?.maxHeartRate,
      distance: item.totalDistance
    }));
    
    // Process calories data
    healthData.caloriesBurned = caloriesData.map(item => ({
      value: item.value || 0,
      timestamp: Timestamp.fromDate(new Date(item.endDate)),
      source: 'HealthKit'
    }));
    
  } catch (error) {
    console.error('Error fetching Apple Health data:', error);
  }
  
  return healthData;
};

// Get data from Google Fit with proper type handling
const getGoogleFitData = async (): Promise<Partial<UserHealthData>> => {
  // Initialize health data
  const healthData: Partial<UserHealthData> = {
    steps: [],
    heartRate: [],
    sleepData: [],
    caloriesBurned: [],
    workouts: []
  };
  
  // Time period (7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  // Format dates as strings in the format expected by GoogleFit
  const timeOptions = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
  
  try {
    // Start recording data with the correct callback parameter
    GoogleFit.startRecording((callback: any) => {
      console.log('Recording started', callback);
    }, ['step', 'distance', 'activity']);
    
    // Get steps data
    let stepsData: any[] = [];
    try {
      const stepsResponse = await GoogleFit.getDailyStepCountSamples(timeOptions);
      
      if (Array.isArray(stepsResponse)) {
        for (const source of stepsResponse) {
          if (source.steps && source.steps.length > 0) {
            stepsData = source.steps;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error getting steps data:', error);
    }
    
    healthData.steps = stepsData.map(item => ({
      value: item.value,
      timestamp: Timestamp.fromDate(new Date(item.date)),
      source: 'GoogleFit'
    }));
    
    // Get heart rate data
    try {
      const heartRateData = await GoogleFit.getHeartRateSamples(timeOptions);
      
      if (Array.isArray(heartRateData)) {
        healthData.heartRate = heartRateData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(new Date(item.endDate || item.startDate)),
          source: 'GoogleFit'
        }));
      }
    } catch (error) {
      console.error('Error getting heart rate data:', error);
    }
    
    // Get sleep data
    try {
      // Add the missing inLocalTimeZone parameter
      const sleepData = await GoogleFit.getSleepSamples(timeOptions, false);
      
      if (Array.isArray(sleepData)) {
        healthData.sleepData = sleepData.map(item => {
          // Based on the SleepSampleResponse type, determine the sleep quality
          // The actual property might be different based on the library version
          let quality: 'deep' | 'light' | 'rem' | 'awake' = 'light'; // default
          
          // Check available properties and determine quality
          if ('sleepState' in item) {
            // Some versions use sleepState
            const sleepState = (item as any).sleepState;
            if (sleepState === 1) quality = 'awake';
            else if (sleepState === 2) quality = 'light';
            else if (sleepState === 3 || sleepState === 4) quality = 'deep';
            else if (sleepState === 5) quality = 'rem';
          } else if ('stage' in item) {
            // Some versions use stage
            const stage = (item as any).stage;
            if (stage === 1) quality = 'awake';
            else if (stage === 2) quality = 'light';
            else if (stage === 3 || stage === 4) quality = 'deep';
            else if (stage === 5) quality = 'rem';
          }
          
          return {
            startTime: Timestamp.fromDate(new Date(item.startDate)),
            endTime: Timestamp.fromDate(new Date(item.endDate)),
            quality,
            duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
          };
        });
      }
    } catch (error) {
      console.error('Error getting sleep data:', error);
    }
    
    // Get workout data
    try {
      const workoutData = await GoogleFit.getActivitySamples(timeOptions);
      
      if (Array.isArray(workoutData)) {
        healthData.workouts = workoutData.map(item => {
          // Map activity types
          let activityName = 'Unknown';
          
          // According to the GoogleFit API documentation, the property should be 'activityName' or 'activity'
          if (item.activityName) {
            activityName = item.activityName;
          } else if ('activityType' in item) {
            // Some versions might use activityType
            const activityType = (item as any).activityType;
            switch (activityType) {
              case 7: // Walking
                activityName = 'Walking';
                break;
              case 8: // Running
                activityName = 'Running';
                break;
              case 1: // Biking
                activityName = 'Biking';
                break;
              default:
                activityName = `Activity ${activityType}`;
            }
          }
          
          return {
            type: activityName,
            startTime: Timestamp.fromDate(new Date(item.start)),
            endTime: Timestamp.fromDate(new Date(item.end)),
            calories: item.calories || 0,
            heartRateAvg: undefined,
            heartRateMax: undefined,
            distance: item.distance
          };
        });
      }
    } catch (error) {
      console.error('Error getting workout data:', error);
    }
    
    // Get calories data
    try {
      const caloriesData = await GoogleFit.getDailyCalorieSamples(timeOptions);
      
      if (Array.isArray(caloriesData)) {
        healthData.caloriesBurned = caloriesData.map(item => ({
          // CalorieResponse has 'calorie' property, not 'value'
          value: item.calorie || 0,
          // It has startDate and endDate, not 'date'
          timestamp: Timestamp.fromDate(new Date(item.endDate || item.startDate)),
          source: 'GoogleFit'
        }));
      }
    } catch (error) {
      console.error('Error getting calories data:', error);
    }
    
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
  }
  
  return healthData;
};

// Check if health services are available with proper type handling
export const checkHealthServicesAvailability = async (): Promise<{
  appleHealth: boolean;
  googleFit: boolean;
}> => {
  let appleHealth = false;
  let googleFit = false;
  
  if (Platform.OS === 'ios') {
    try {
      // Use the correctly typed promise for checking availability
      appleHealth = await new Promise<boolean>((resolve) => {
        AppleHealthKit.isAvailable((error: any, available: boolean) => {
          if (error) {
            console.error('Error checking HealthKit availability:', error);
            resolve(false);
            return;
          }
          resolve(available);
        });
      });
    } catch (error) {
      console.error('Error checking HealthKit availability:', error);
    }
  }
  
  if (Platform.OS === 'android') {
    try {
      // For Google Fit, just try to authorize and check success
      const authResult = await GoogleFit.authorize(GOOGLEFIT_OPTIONS);
      if (typeof authResult === 'object' && authResult !== null && 'success' in authResult) {
        googleFit = authResult.success;
      }
    } catch (error) {
      console.error('Error checking Google Fit availability:', error);
    }
  }

  return {
    appleHealth,
    googleFit
  };
};

// Sync health data from connected wearable
export const syncHealthData = async (userId: string, wearableType: string): Promise<Partial<UserHealthData>> => {
  try {
    console.log(`Syncing ${wearableType} data for user ${userId}`);
    
    // Initialize the data structure with empty arrays
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
      const appleHealthData = await getAppleHealthData();
      healthData = { ...appleHealthData, userId };
    } 
    else if ((normalizedType === 'googlefit' || normalizedType === 'google fit') && Platform.OS === 'android') {
      const googleFitData = await getGoogleFitData();
      healthData = { ...googleFitData, userId };
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
    
    if (!userData || !userData.sleepData || userData.sleepData.length === 0) {
      return null;
    }
    
    // Sort sleep data by end time (most recent first)
    const recentSleep = userData.sleepData
      .sort((a, b) => b.endTime.toMillis() - a.endTime.toMillis())
      .slice(0, 3);
    
    // Calculate deep sleep percentage
    const totalSleepDuration = recentSleep.reduce((acc, sleep) => acc + sleep.duration, 0);
    const deepSleepDuration = recentSleep
      .filter(sleep => sleep.quality === 'deep')
      .reduce((acc, sleep) => acc + sleep.duration, 0);
    
    const deepSleepPercent = totalSleepDuration > 0
      ? (deepSleepDuration / totalSleepDuration) * 100
      : 0;
    
    // Get recent heart rate average
    const recentHeartRate = userData.heartRate?.length > 0
      ? userData.heartRate
          .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
          .slice(0, 10)
          .reduce((acc, hr) => acc + hr.value, 0) / 
          Math.min(10, userData.heartRate.length)
      : 70; // Default value if no heart rate data
    
    // Calculate activity intensity from recent workouts
    const recentWorkouts = userData.workouts?.length > 0
      ? userData.workouts
          .filter(w => {
            const workoutDate = w.endTime.toDate();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return workoutDate > yesterday;
          })
      : [];
    
    // Calculate activity score based on recent workouts
    // Lower score means more recovery needed
    const activityScore = recentWorkouts.length > 0
      ? Math.min(100, Math.max(0, 100 - (recentWorkouts.reduce((acc, w) => 
          acc + (w.calories || 0), 0) / 20)))
      : 100; // Full recovery if no recent workouts
    
    // Calculate overall score
    const sleepScore = Math.min(100, Math.max(0, deepSleepPercent * 2));
    const heartRateScore = Math.min(100, Math.max(0, 
      recentHeartRate < 60 ? 100 : 
      recentHeartRate < 70 ? 85 : 
      recentHeartRate < 80 ? 70 : 
      recentHeartRate < 90 ? 50 : 30
    ));
    
    const overallScore = Math.round((sleepScore * 0.4) + (heartRateScore * 0.3) + (activityScore * 0.3));
    
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