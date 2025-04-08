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

console.log('Platform OS:', Platform.OS);

// Collection references
const wearableConnectionsRef = collection(db, 'wearableConnections');
const healthDataRef = collection(db, 'healthData');

// Import health services conditionally
let AppleHealthKit: any = null;
let GoogleFit: any = null;

// We need to handle imports conditionally to avoid issues with React Native's bundling
if (Platform.OS === 'ios') {
    try {
      console.log('Attempting to import AppleHealthKit...');
      // Import with require to avoid issues with tree shaking
      AppleHealthKit = require('react-native-health').default;
      console.log('AppleHealthKit import success:', !!AppleHealthKit);
    } catch (e) {
      console.error('Failed to import HealthKit:', e);
    }
  }
  
  if (Platform.OS === 'android') {
    try {
      GoogleFit = require('react-native-google-fit').default;
    } catch (e) {
      console.error('Failed to import Google Fit:', e);
    }
  }

  const getHealthKitOptions = () => {
    if (!AppleHealthKit || !AppleHealthKit.Constants) {
      console.error('AppleHealthKit or Constants not available when creating options');
      // Fallback options with string permissions
      return {
        permissions: {
          read: [
            'Steps', 
            'StepCount', 
            'DistanceWalkingRunning', 
            'HeartRate', 
            'SleepAnalysis', 
            'ActiveEnergyBurned',
            'Workout'
          ],
          write: [
            'Steps', 
            'StepCount', 
            'DistanceWalkingRunning', 
            'HeartRate', 
            'SleepAnalysis', 
            'ActiveEnergyBurned',
            'Workout'
          ]
        }
      };
    }
    
    // When constants are available
    return {
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
  };
  

// Google Fit configuration
const GOOGLEFIT_OPTIONS = {
  scopes: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read'
  ]
};

// Connect to wearable
export const connectWearable = async (connection: Omit<WearableConnection, 'id' | 'lastSynced'>): Promise<string> => {
    try {
      console.log(`Connecting ${connection.type} for user ${connection.userId}`);
      console.log('Platform:', Platform.OS);
      console.log('AppleHealthKit available:', !!AppleHealthKit);
      console.log('GoogleFit available:', !!GoogleFit);
      
      let permissionGranted = false;
      
      if (connection.type === 'appleHealth' && Platform.OS === 'ios') {
        // Request Apple HealthKit permissions
        if (!AppleHealthKit) {
          console.error('AppleHealthKit not available when connecting');
          throw new Error('HealthKit is not available on this device');
        }
        permissionGranted = await initializeHealthKit();
      } 
      else if (connection.type === 'googleFit' && Platform.OS === 'android') {
        // Request Google Fit permissions
        if (!GoogleFit) {
          console.error('GoogleFit not available when connecting');
          throw new Error('Google Fit is not available on this device');
        }
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
  

// Initialize HealthKit
const initializeHealthKit = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!AppleHealthKit) {
        console.error('HealthKit not available when initializing');
        reject(new Error('HealthKit not available'));
        return;
      }
      
      const options = getHealthKitOptions();
      console.log('Starting HealthKit initialization with options:', JSON.stringify(options));
      
      AppleHealthKit.initHealthKit(options, (error: Error) => {
        if (error) {
          console.error('HealthKit initialization error:', error);
          reject(error);
          return;
        }
        
        console.log('HealthKit initialized successfully');
        resolve(true);
      });
    });
  };
  
// Initialize Google Fit
const initializeGoogleFit = async (): Promise<boolean> => {
  if (!GoogleFit) {
    throw new Error('Google Fit not available');
  }
  
  try {
    const { success, message } = await GoogleFit.authorize(GOOGLEFIT_OPTIONS);
    
    if (!success) {
      throw new Error(message);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Google Fit:', error);
    throw error;
  }
};

// Get user's wearable connections
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

// Sync health data from connected wearable
export const syncHealthData = async (userId: string, wearableType: string): Promise<Partial<UserHealthData>> => {
    try {
      console.log(`Syncing ${wearableType} data for user ${userId}`);
      console.log('Platform:', Platform.OS);
      console.log('AppleHealthKit available:', !!AppleHealthKit);
      
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
      
      // Get data from appropriate health service
      if ((normalizedType === 'applehealth' || normalizedType === 'apple health') && Platform.OS === 'ios') {
        if (!AppleHealthKit) {
          // Try to load again as a last resort
          try {
            console.log('Attempting to re-import AppleHealthKit...');
            AppleHealthKit = require('react-native-health').default;
            console.log('Re-imported AppleHealthKit:', !!AppleHealthKit);
          } catch (e) {
            console.error('Failed to re-import AppleHealthKit:', e);
          }
        }
        
        if (!AppleHealthKit) {
          throw new Error('AppleHealthKit module is not loaded. Check installation and imports.');
        }
        
        healthData = await getAppleHealthData();
        healthData.userId = userId;
      } 
      else if ((normalizedType === 'googlefit' || normalizedType === 'google fit') && Platform.OS === 'android') {
        if (!GoogleFit) {
          throw new Error('GoogleFit module not available. Check installation and permissions.');
        }
        
        healthData = await getGoogleFitData();
        healthData.userId = userId;
      }
      else {
        throw new Error(`${wearableType} is not supported on ${Platform.OS}. AppleHealthKit=${!!AppleHealthKit}, GoogleFit=${!!GoogleFit}`);
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

// Get data from Apple HealthKit
const getAppleHealthData = async (): Promise<Partial<UserHealthData>> => {
    if (!AppleHealthKit) {
      throw new Error('HealthKit not available');
    }
    
    // Initialize health data with empty arrays
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
    
    // Get steps data
    try {
      const stepsData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getDailyStepCountSamples(options, (err: Error, results: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });
      
      healthData.steps = stepsData.map((item: any) => ({
        value: item.value || 0,
        timestamp: Timestamp.fromDate(new Date(item.endDate)),
        source: 'HealthKit'
      }));
      console.log(`Found ${healthData.steps?.length || 0} step records`);
    } catch (error) {
      console.error('Error getting steps data:', error);
      healthData.steps = [];
    }
    
    // Get heart rate data
    try {
      const heartRateData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getHeartRateSamples(options, (err: Error, results: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });
      
      healthData.heartRate = heartRateData.map((item: any) => ({
        value: item.value || 0,
        timestamp: Timestamp.fromDate(new Date(item.endDate)),
        source: 'HealthKit'
      }));
      console.log(`Found ${healthData.heartRate?.length || 0} heart rate records`);
    } catch (error) {
      console.error('Error getting heart rate data:', error);
      healthData.heartRate = [];
    }
    
    // Get sleep data
    try {
      const sleepData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getSleepSamples(options, (err: Error, results: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });
      
      // Map HealthKit sleep values to our format
      const sleepQualityMap: {[key: string]: 'deep' | 'light' | 'rem' | 'awake'} = {
        'INBED': 'light',
        'ASLEEP': 'deep',
        'AWAKE': 'awake',
        'DEEP': 'deep',
        'CORE': 'deep',
        'REM': 'rem'
      };
      
      healthData.sleepData = sleepData.map((item: any) => ({
        startTime: Timestamp.fromDate(new Date(item.startDate)),
        endTime: Timestamp.fromDate(new Date(item.endDate)),
        quality: sleepQualityMap[item.value] || 'light',
        duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
      }));
      console.log(`Found ${healthData.sleepData?.length || 0} sleep records`);
    } catch (error) {
      console.error('Error getting sleep data:', error);
      healthData.sleepData = [];
    }
    
    // Get workout data
    try {
      const workoutData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getWorkouts(options, (err: Error, results: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });
      
      healthData.workouts = workoutData.map((item: any) => ({
        type: item.activityName || 'Unknown',
        startTime: Timestamp.fromDate(new Date(item.start)),
        endTime: Timestamp.fromDate(new Date(item.end)),
        calories: item.totalEnergyBurned || 0,
        heartRateAvg: item.metadata?.averageHeartRate,
        heartRateMax: item.metadata?.maxHeartRate,
        distance: item.totalDistance
      }));
      console.log(`Found ${healthData.workouts?.length || 0} workout records`);
    } catch (error) {
      console.error('Error getting workout data:', error);
      healthData.workouts = [];
    }
    
    // Get calories data
    try {
      const caloriesData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getActiveEnergyBurned(options, (err: Error, results: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });
      
      healthData.caloriesBurned = caloriesData.map((item: any) => ({
        value: item.value || 0,
        timestamp: Timestamp.fromDate(new Date(item.endDate)),
        source: 'HealthKit'
      }));
      console.log(`Found ${healthData.caloriesBurned?.length || 0} calorie burn records`);
    } catch (error) {
      console.error('Error getting calories data:', error);
      healthData.caloriesBurned = [];
    }
    
    return healthData;
  };

// Get data from Google Fit
const getGoogleFitData = async (): Promise<Partial<UserHealthData>> => {
  if (!GoogleFit) {
    throw new Error('Google Fit not available');
  }
  
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
  
  const timeOptions = {
    startDate,
    endDate
  };
  
  // Get steps data
  try {
    const stepsResponse = await GoogleFit.getDailyStepCountSamples(timeOptions);
    
    // Find the data source with steps
    let stepsData: any[] = [];
    if (stepsResponse.length > 0) {
      for (const source of stepsResponse) {
        if (source.steps && source.steps.length > 0) {
          stepsData = source.steps;
          break;
        }
      }
    }
    
    healthData.steps = stepsData.map(item => ({
      value: item.value,
      timestamp: Timestamp.fromDate(new Date(item.date)),
      source: 'GoogleFit'
    }));
  } catch (error) {
    console.error('Error getting steps data:', error);
  }
  
  // Get heart rate data
  try {
    const heartRateData = await GoogleFit.getHeartRateSamples(timeOptions);
    
    healthData.heartRate = heartRateData.map(item => ({
      value: item.value,
      timestamp: Timestamp.fromDate(new Date(item.endDate || item.date)),
      source: 'GoogleFit'
    }));
  } catch (error) {
    console.error('Error getting heart rate data:', error);
  }
  
  // Get sleep data
  try {
    const sleepData = await GoogleFit.getSleepSamples(timeOptions);
    
    // Map Google Fit sleep stages to our format
    const sleepQualityMap: {[key: number]: 'deep' | 'light' | 'rem' | 'awake'} = {
      1: 'awake', // Awake
      2: 'light', // Sleep
      3: 'deep',  // Out of bed
      4: 'deep',  // Deep sleep
      5: 'rem'    // REM
    };
    
    healthData.sleepData = sleepData.map(item => ({
      startTime: Timestamp.fromDate(new Date(item.startDate)),
      endTime: Timestamp.fromDate(new Date(item.endDate)),
      quality: sleepQualityMap[item.sleepStage] || 'light',
      duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
    }));
  } catch (error) {
    console.error('Error getting sleep data:', error);
  }
  
  // Get workout data
  try {
    const workoutData = await GoogleFit.getActivitySamples(timeOptions);
    
    healthData.workouts = workoutData.map(item => {
      // Map Google Fit activity types to readable names
      let activityName = 'Unknown';
      if (GoogleFit.ActivityTypes) {
        switch (item.activityType || item.type) {
          case GoogleFit.ActivityTypes.Walking:
            activityName = 'Walking';
            break;
          case GoogleFit.ActivityTypes.Running:
            activityName = 'Running';
            break;
          case GoogleFit.ActivityTypes.Biking:
            activityName = 'Biking';
            break;
          case GoogleFit.ActivityTypes.Still:
            activityName = 'Still';
            break;
          default:
            activityName = item.activityName || `Activity ${item.type}`;
        }
      }
      
      return {
        type: activityName,
        startTime: Timestamp.fromDate(new Date(item.start)),
        endTime: Timestamp.fromDate(new Date(item.end)),
        calories: item.calories || 0,
        heartRateAvg: undefined, // Google Fit doesn't provide this directly
        heartRateMax: undefined,
        distance: item.distance
      };
    });
  } catch (error) {
    console.error('Error getting workout data:', error);
  }
  
  // Get calories data
  try {
    const caloriesData = await GoogleFit.getDailyCalorieSamples(timeOptions);
    
    healthData.caloriesBurned = caloriesData.map(item => ({
      value: item.calorie || item.value,
      timestamp: Timestamp.fromDate(new Date(item.endDate || item.date)),
      source: 'GoogleFit'
    }));
  } catch (error) {
    console.error('Error getting calories data:', error);
  }
  
  return healthData;
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

// Disconnect a wearable
export const disconnectWearable = async (connectionId: string): Promise<boolean> => {
  try {
    const docRef = doc(wearableConnectionsRef, connectionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Wearable connection not found');
    }
    
    // Update the connection status
    await updateDoc(docRef, {
      isConnected: false,
      disconnectedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error disconnecting wearable:', error);
    throw error;
  }
};

// Check if health services are available on the device
export const checkHealthServicesAvailability = async (): Promise<{
  appleHealth: boolean;
  googleFit: boolean;
}> => {
  let appleHealth = false;
  let googleFit = false;
  
  if (Platform.OS === 'ios' && AppleHealthKit) {
    try {
      // Check if HealthKit is available
      await new Promise((resolve, reject) => {
        AppleHealthKit.isAvailable((error: Error, available: boolean) => {
          if (error) {
            reject(error);
            return;
          }
          appleHealth = available;
          resolve(available);
        });
      });
    } catch (error) {
      console.error('Error checking HealthKit availability:', error);
    }
  }
  
  if (Platform.OS === 'android' && GoogleFit) {
    try {
      // Check if Google Fit is available
      const result = await GoogleFit.checkIsAuthorized();
      googleFit = result.isAuth;
    } catch (error) {
      console.error('Error checking Google Fit availability:', error);
    }
  }

  return {
    appleHealth,
    googleFit
  };
};

export const getAvailableHealthServices = async (): Promise<string[]> => {
    const services: string[] = [];
    const availability = await checkHealthServicesAvailability();
    
    if (Platform.OS === 'ios' && availability.appleHealth) {
      services.push('appleHealth');
    }
    
    if (Platform.OS === 'android' && availability.googleFit) {
      services.push('googleFit');
    }
    
    // Add other services that don't require platform-specific checks
    services.push('manual'); // Always allow manual entry
    
    return services;
  };
  
  // Add manual health data entry
  export const addManualHealthData = async (
    userId: string,
    dataType: 'steps' | 'heartRate' | 'sleep' | 'workout' | 'calories',
    data: any
  ): Promise<boolean> => {
    try {
      // Get existing health data
      const existingData = await getUserHealthData(userId) || {
        userId,
        steps: [],
        heartRate: [],
        sleepData: [],
        caloriesBurned: [],
        workouts: [],
        lastUpdated: Timestamp.now()
      };
      
      // Prepare update object
      const updateData: Partial<UserHealthData> = {
        userId,
        lastUpdated: Timestamp.now()
      };
      
      // Add different types of data
      switch (dataType) {
        case 'steps':
          const stepData: HealthMetric = {
            value: data.value,
            timestamp: Timestamp.fromDate(data.date || new Date()),
            source: 'manual'
          };
          updateData.steps = [...(existingData.steps || []), stepData];
          break;
        
        case 'heartRate':
          const heartRateData: HealthMetric = {
            value: data.value,
            timestamp: Timestamp.fromDate(data.date || new Date()),
            source: 'manual'
          };
          updateData.heartRate = [...(existingData.heartRate || []), heartRateData];
          break;
        
        case 'sleep':
          const sleepData = {
            startTime: Timestamp.fromDate(data.startTime),
            endTime: Timestamp.fromDate(data.endTime),
            quality: data.quality || 'light',
            duration: data.duration || Math.round(
              (data.endTime.getTime() - data.startTime.getTime()) / 60000
            )
          };
          updateData.sleepData = [...(existingData.sleepData || []), sleepData];
          break;
        
        case 'workout':
          const workoutData = {
            type: data.type || 'Unknown',
            startTime: Timestamp.fromDate(data.startTime),
            endTime: Timestamp.fromDate(data.endTime),
            calories: data.calories || 0,
            heartRateAvg: data.heartRateAvg,
            heartRateMax: data.heartRateMax,
            distance: data.distance
          };
          updateData.workouts = [...(existingData.workouts || []), workoutData];
          break;
        
        case 'calories':
          const caloriesData: HealthMetric = {
            value: data.value,
            timestamp: Timestamp.fromDate(data.date || new Date()),
            source: 'manual'
          };
          updateData.caloriesBurned = [...(existingData.caloriesBurned || []), caloriesData];
          break;
      }
      
      // Save to Firestore
      await createOrUpdateHealthData(userId, updateData);
      
      return true;
    } catch (error) {
      console.error(`Error adding manual ${dataType} data:`, error);
      throw error;
    }
  };
  
  // Get data summary for dashboard
  export const getHealthDataSummary = async (userId: string): Promise<{
    dailySteps: number;
    weeklyAvgSteps: number;
    restingHeartRate: number;
    caloriesBurned: number;
    averageSleepHours: number;
    recoveryScore: number | null;
  }> => {
    try {
      const healthData = await getUserHealthData(userId);
      
      if (!healthData) {
        return {
          dailySteps: 0,
          weeklyAvgSteps: 0,
          restingHeartRate: 0,
          caloriesBurned: 0,
          averageSleepHours: 0,
          recoveryScore: null
        };
      }
      
      // Calculate daily steps (most recent day)
      const sortedSteps = [...(healthData.steps || [])]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      const dailySteps = sortedSteps.length > 0 ? sortedSteps[0].value : 0;
      
      // Calculate weekly average steps
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekSteps = healthData.steps?.filter(step => {
        const stepDate = step.timestamp.toDate();
        return stepDate >= weekAgo && stepDate <= today;
      }) || [];
      
      const weeklyAvgSteps = weekSteps.length > 0 
        ? weekSteps.reduce((sum, step) => sum + step.value, 0) / weekSteps.length
        : 0;
      
      // Calculate resting heart rate (average of last 3 days during sleep hours)
      const sortedHeartRate = [...(healthData.heartRate || [])]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      const restingHeartRate = sortedHeartRate.length > 0 
        ? sortedHeartRate.slice(0, 10).reduce((sum, hr) => sum + hr.value, 0) / 
          Math.min(10, sortedHeartRate.length)
        : 0;
      
      // Calculate calories burned (most recent day)
      const sortedCalories = [...(healthData.caloriesBurned || [])]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      const caloriesBurned = sortedCalories.length > 0 ? sortedCalories[0].value : 0;
      
      // Calculate average sleep hours (past week)
      const weekSleep = healthData.sleepData?.filter(sleep => {
        const sleepDate = sleep.endTime.toDate();
        return sleepDate >= weekAgo && sleepDate <= today;
      }) || [];
      
      const totalSleepMinutes = weekSleep.reduce((sum, sleep) => sum + sleep.duration, 0);
      const averageSleepHours = weekSleep.length > 0 
        ? (totalSleepMinutes / weekSleep.length) / 60 
        : 0;
      
      // Get recovery score
      const recoveryStatus = await calculateRecoveryStatus(userId);
      const recoveryScore = recoveryStatus?.score || null;
      
      return {
        dailySteps: Math.round(dailySteps),
        weeklyAvgSteps: Math.round(weeklyAvgSteps),
        restingHeartRate: Math.round(restingHeartRate),
        caloriesBurned: Math.round(caloriesBurned),
        averageSleepHours: parseFloat(averageSleepHours.toFixed(1)),
        recoveryScore
      };
    } catch (error) {
      console.error('Error getting health data summary:', error);
      throw error;
    }
  };
  
  // Get health insights based on user data
  export const getHealthInsights = async (userId: string): Promise<string[]> => {
    try {
      const healthData = await getUserHealthData(userId);
      const insights: string[] = [];
      
      if (!healthData) {
        return ['Connect a wearable device to get personalized health insights.'];
      }
      
      // Step-related insights
      const sortedSteps = [...(healthData.steps || [])]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      if (sortedSteps.length > 0) {
        const latestSteps = sortedSteps[0].value;
        if (latestSteps < 5000) {
          insights.push('Try to increase your daily steps. Aim for at least 7,500 steps per day.');
        } else if (latestSteps > 10000) {
          insights.push('Great job staying active! You are exceeding the recommended 10,000 steps per day.');
        }
      }
      
      // Sleep-related insights
      const sortedSleep = [...(healthData.sleepData || [])]
        .sort((a, b) => b.endTime.toMillis() - a.endTime.toMillis());
      
      if (sortedSleep.length > 0) {
        // Calculate average sleep duration over the past week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentSleep = sortedSleep.filter(sleep => 
          sleep.endTime.toDate() >= weekAgo
        );
        
        if (recentSleep.length > 0) {
          const avgSleepMinutes = recentSleep.reduce((sum, sleep) => sum + sleep.duration, 0) / recentSleep.length;
          const avgSleepHours = avgSleepMinutes / 60;
          
          if (avgSleepHours < 7) {
            insights.push('Youa re averaging less than 7 hours of sleep. Most adults need 7-9 hours for optimal health.');
          } else if (avgSleepHours > 9) {
            insights.push('You are sleeping more than 9 hours on average. While sleep is important, too much may indicate other issues.');
          }
          
          // Check sleep consistency
          const sleepStartTimes = recentSleep.map(sleep => 
            sleep.startTime.toDate().getHours() + (sleep.startTime.toDate().getMinutes() / 60)
          );
          
          const maxStartTime = Math.max(...sleepStartTimes);
          const minStartTime = Math.min(...sleepStartTimes);
          
          if (maxStartTime - minStartTime > 2) {
            insights.push('Your sleep schedule varies by more than 2 hours. Try to maintain a more consistent sleep routine.');
          }
        }
      }
      
      // Heart rate insights
      const sortedHeartRate = [...(healthData.heartRate || [])]
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      
      if (sortedHeartRate.length > 10) {
        const avgRestingHR = sortedHeartRate.slice(0, 10).reduce((sum, hr) => sum + hr.value, 0) / 10;
        
        if (avgRestingHR > 80) {
          insights.push('Your resting heart rate appears elevated. Regular cardiovascular exercise can help lower it.');
        } else if (avgRestingHR < 50 && healthData.workouts && healthData.workouts.length > 0) {
          insights.push('Your low resting heart rate suggests good cardiovascular fitness.');
        }
      }
      
      // Workout insights
      const sortedWorkouts = [...(healthData.workouts || [])]
        .sort((a, b) => b.endTime.toMillis() - a.endTime.toMillis());
      
      if (sortedWorkouts.length > 0) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentWorkouts = sortedWorkouts.filter(workout => 
          workout.endTime.toDate() >= weekAgo
        );
        
        if (recentWorkouts.length < 3) {
          insights.push('Try to aim for at least 3 workouts per week for optimal health benefits.');
        } else if (recentWorkouts.length >= 5) {
          insights.push('Great job staying active with 5+ workouts this week!');
        }
        
        // Check workout variety
        const workoutTypes = new Set(recentWorkouts.map(w => w.type));
        if (workoutTypes.size < 2 && recentWorkouts.length >= 3) {
          insights.push('Consider diversifying your workouts to work different muscle groups and prevent overuse injuries.');
        }
      } else {
        insights.push('No recent workouts detected. Regular physical activity is important for overall health.');
      }
      
      // Recovery insights
      const recoveryStatus = await calculateRecoveryStatus(userId);
      if (recoveryStatus) {
        if (recoveryStatus.score < 50) {
          insights.push('Your recovery score is low. Focus on rest, sleep, and light activity today.');
        } else if (recoveryStatus.score > 80) {
          insights.push('Your recovery score is excellent. Your body is ready for higher intensity training.');
        }
      }
      
      // If no insights, add a default one
      if (insights.length === 0) {
        insights.push('Keep tracking your health data to receive personalized insights.');
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating health insights:', error);
      return ['Error generating insights. Please try again later.'];
    }
  };
  
  export default {
    connectWearable,
    getUserWearableConnections,
    syncHealthData,
    getUserHealthData,
    calculateRecoveryStatus,
    disconnectWearable,
    checkHealthServicesAvailability,
    getAvailableHealthServices,
    addManualHealthData,
    getHealthDataSummary,
    getHealthInsights
  };