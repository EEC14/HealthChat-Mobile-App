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
    Timestamp,
    DocumentData
  } from 'firebase/firestore';
  import { Platform } from 'react-native';
  import { db } from '../firebase';
  import { 
    WearableConnection, 
    UserHealthData, 
    HealthMetric, 
    RecoveryStatus 
  } from '../types/WearableTypes';
  
  // Collection references
  const wearableConnectionsRef = collection(db, 'wearableConnections');
  const healthDataRef = collection(db, 'healthData');
  
  // Health data source handlers
  let AppleHealthKit: any = null;
  let GoogleFit: any = null;
  
  // Dynamically import platform-specific health modules
  if (Platform.OS === 'ios') {
    try {
      AppleHealthKit = require('react-native-health').default;
    } catch (error) {
      console.error('Failed to load Apple HealthKit module:', error);
    }
  } else if (Platform.OS === 'android') {
    try {
      GoogleFit = require('react-native-google-fit').default;
    } catch (error) {
      console.error('Failed to load Google Fit module:', error);
    }
  }
  
  // HealthKit permission options
  const HEALTHKIT_OPTIONS = {
    permissions: {
      read: [
        'StepCount', 
        'DistanceWalking', 
        'DistanceCycling',
        'ActiveEnergyBurned',
        'BasalEnergyBurned',
        'HeartRate',
        'RestingHeartRate',
        'HeartRateVariabilitySDNN',
        'SleepAnalysis',
        'Workout'
      ],
      write: []
    }
  };

// Update the interface definitions to match actual data structures
interface HealthKitStepData {
    value: number;
    date?: string;
    endDate: string;
  }
  
  interface HealthKitHeartRateData {
    value: number;
    date?: string;
    endDate: string;
  }
  
  interface HealthKitSleepData {
    value: string;
    startDate: string;
    endDate: string;
  }
  
  interface HealthKitWorkoutData {
    activityName: string;
    start: string;
    end: string;
    calories: number;
    distance?: number;
    metadata?: {
      average_heart_rate?: number;
      max_heart_rate?: number;
    };
  }
  
  interface HealthKitCaloriesData {
    value: number;
    date?: string;
    endDate: string;
  }
  
  interface GoogleFitStepData {
    value: number;
    date: number | string;
  }
  
  interface GoogleFitHeartRateData {
    value: number;
    startDate?: number | string;
    endDate: number | string;
  }
  
  interface GoogleFitSleepData {
    sleepStage: number;
    startDate: number | string;
    endDate: number | string;
  }
  
  interface GoogleFitWorkoutData {
    activityName?: string;
    type?: number;
    start: number | string;
    end: number | string;
    calories?: number;
    distance?: number;
  }
  
  interface GoogleFitCaloriesData {
    calorie: number;
    startDate?: number | string;
    endDate: number | string;
  }
  
  // Wearable Connection Functions
  export const connectWearable = async (connection: Omit<WearableConnection, 'id' | 'lastSynced'>) => {
    try {
      // First, request permissions for the specified wearable
      let permissionGranted = false;
      
      if (connection.type === 'appleHealth' && Platform.OS === 'ios') {
        if (!AppleHealthKit) {
          throw new Error('Apple HealthKit module not available');
        }
        
        permissionGranted = await requestAppleHealthPermissions(connection.permissions);
      } 
      else if (connection.type === 'googleFit' && Platform.OS === 'android') {
        if (!GoogleFit) {
          throw new Error('Google Fit module not available');
        }
        
        permissionGranted = await requestGoogleFitPermissions(connection.permissions);
      }
      else if (connection.type === 'fitbit' || connection.type === 'garmin') {
        // For third-party services, this would involve OAuth
        // This is a placeholder for future implementation
        permissionGranted = false;
        throw new Error(`${connection.type} integration not implemented yet`);
      }
      
      // Only add to database if permissions were granted
      if (permissionGranted) {
        const docRef = await addDoc(wearableConnectionsRef, {
          ...connection,
          isConnected: true,
          lastSynced: null,
          createdAt: serverTimestamp()
        });
        
        // Sync data immediately after connecting
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
  
  // Request Apple HealthKit permissions
  const requestAppleHealthPermissions = async (permissions: string[]): Promise<boolean> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(HEALTHKIT_OPTIONS, (error: Error) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          reject(error);
          return;
        }
        
        resolve(true);
      });
    });
  };
  
  // Request Google Fit permissions
  const requestGoogleFitPermissions = async (permissions: string[]): Promise<boolean> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    try {
      const options = {
        scopes: [
          GoogleFit.Scopes.FITNESS_ACTIVITY_READ,
          GoogleFit.Scopes.FITNESS_BODY_READ,
          GoogleFit.Scopes.FITNESS_HEART_RATE_READ,
          GoogleFit.Scopes.FITNESS_SLEEP_READ,
        ]
      };
      
      const authResult = await GoogleFit.authorize(options);
      return authResult.success;
    } catch (error) {
      console.error('Error requesting Google Fit permissions:', error);
      throw error;
    }
  };
  
  export const updateWearableConnection = async (id: string, updates: Partial<WearableConnection>) => {
    try {
      const docRef = doc(wearableConnectionsRef, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating wearable connection:', error);
      throw error;
    }
  };
  
  export const getUserWearableConnections = async (userId: string) => {
    try {
      const q = query(wearableConnectionsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WearableConnection[];
    } catch (error) {
      console.error('Error getting user wearable connections:', error);
      throw error;
    }
  };
  
  // Sync health data from wearable
  export const syncHealthData = async (userId: string, wearableType: string) => {
    try {
      let healthData: Partial<UserHealthData> = {
        userId,
        lastUpdated: Timestamp.now()
      };
      
      if (wearableType === 'appleHealth' && Platform.OS === 'ios') {
        if (!AppleHealthKit) {
          throw new Error('Apple HealthKit module not available');
        }
        
        // Fetch steps data
        const stepsData = await fetchAppleHealthSteps();
        healthData.steps = stepsData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'AppleHealth'
        }));
        
        // Fetch heart rate data
        const heartRateData = await fetchAppleHealthHeartRate();
        healthData.heartRate = heartRateData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'AppleHealth'
        }));
        
        // Fetch sleep data
        const sleepData = await fetchAppleHealthSleep();
        healthData.sleepData = sleepData.map(item => ({
          startTime: Timestamp.fromDate(new Date(item.startDate)),
          endTime: Timestamp.fromDate(new Date(item.endDate)),
          quality: item.value.toLowerCase() as 'deep' | 'light' | 'rem' | 'awake',
          duration: Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 60000)
        }));
        
        // Fetch workout data
        const workoutData = await fetchAppleHealthWorkouts();
        healthData.workouts = workoutData.map(item => ({
          type: item.activityName || 'Unknown',
          startTime: Timestamp.fromDate(new Date(item.start)),
          endTime: Timestamp.fromDate(new Date(item.end)),
          calories: item.calories || 0,
          heartRateAvg: item.metadata?.average_heart_rate,
          heartRateMax: item.metadata?.max_heart_rate,
          distance: item.distance
        }));
        
        // Fetch calories burned data
        const caloriesData = await fetchAppleHealthCalories();
        healthData.caloriesBurned = caloriesData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(new Date(item.endDate)),
          source: 'AppleHealth'
        }));
      } 
      else if (wearableType === 'googleFit' && Platform.OS === 'android') {
        if (!GoogleFit) {
          throw new Error('Google Fit module not available');
        }
        
        // Fetch steps data
        const stepsData = await fetchGoogleFitSteps();
        healthData.steps = stepsData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(typeof item.date === 'string' ? new Date(item.date) : new Date(item.date)),
          source: 'GoogleFit'
        }));
        
        // Fetch heart rate data
        const heartRateData = await fetchGoogleFitHeartRate();
        healthData.heartRate = heartRateData.map(item => ({
          value: item.value,
          timestamp: Timestamp.fromDate(typeof item.endDate === 'string' ? new Date(item.endDate) : new Date(item.endDate)),
          source: 'GoogleFit'
        }));
        
        // Fetch sleep data
        const sleepData = await fetchGoogleFitSleep();
        
        // Convert Google's sleep values to our quality format
        const sleepQualityMap: {[key: number]: 'deep' | 'light' | 'rem' | 'awake'} = {
          1: 'awake',   // Awake
          2: 'light',   // Sleep
          3: 'deep',    // Out of bed
          4: 'deep',    // Deep sleep
          5: 'rem'      // REM
        };
        
        healthData.sleepData = sleepData.map(item => ({
          startTime: Timestamp.fromDate(typeof item.startDate === 'string' ? new Date(item.startDate) : new Date(item.startDate)),
          endTime: Timestamp.fromDate(typeof item.endDate === 'string' ? new Date(item.endDate) : new Date(item.endDate)),
          quality: sleepQualityMap[item.sleepStage] || 'light',
          duration: Math.round((
            (typeof item.endDate === 'string' ? new Date(item.endDate).getTime() : new Date(item.endDate).getTime()) - 
            (typeof item.startDate === 'string' ? new Date(item.startDate).getTime() : new Date(item.startDate).getTime())
          ) / 60000)
        }));
        
        // Fetch workout data
        const workoutData = await fetchGoogleFitWorkouts();
        
        healthData.workouts = workoutData.map(item => {
          // Get activity name from Google Fit activity type
          let activityName = 'Unknown';
          
          // Map Google Fit activity types to readable names
          if (typeof item.type === 'number' && GoogleFit.Activities) {
            switch (item.type) {
              case GoogleFit.Activities.WALKING:
                activityName = 'Walking';
                break;
              case GoogleFit.Activities.RUNNING:
                activityName = 'Running';
                break;
              case GoogleFit.Activities.BIKING:
                activityName = 'Biking';
                break;
              case GoogleFit.Activities.STILL:
                activityName = 'Still';
                break;
              default:
                activityName = item.activityName || `Activity ${item.type}`;
            }
          } else {
            activityName = item.activityName || 'Unknown';
          }
          
          return {
            type: activityName, // Always ensure type is a string
            startTime: Timestamp.fromDate(typeof item.start === 'string' ? new Date(item.start) : new Date(item.start)),
            endTime: Timestamp.fromDate(typeof item.end === 'string' ? new Date(item.end) : new Date(item.end)),
            calories: item.calories || 0,
            heartRateAvg: undefined, // Google Fit may not directly provide this
            heartRateMax: undefined,
            distance: item.distance
          };
        });
        
        // Fetch calories burned data
        const caloriesData = await fetchGoogleFitCalories();
        healthData.caloriesBurned = caloriesData.map(item => ({
          value: item.calorie,
          timestamp: Timestamp.fromDate(typeof item.endDate === 'string' ? new Date(item.endDate) : new Date(item.endDate)),
          source: 'GoogleFit'
        }));
      }
      
      // Save the fetched data to Firestore
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
      console.error(`Error syncing health data from ${wearableType}:`, error);
      throw error;
    }
  };
  
  // Apple HealthKit data fetching functions
  // Apple HealthKit data fetching functions
const fetchAppleHealthSteps = async (): Promise<HealthKitStepData[]> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDailyStepCountSamples(options, (error: Error, results: HealthKitStepData[]) => {
        if (error) {
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  };
  
  const fetchAppleHealthHeartRate = async (): Promise<HealthKitHeartRateData[]> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.getHeartRateSamples(options, (error: Error, results: HealthKitHeartRateData[]) => {
        if (error) {
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  };
  
  const fetchAppleHealthSleep = async (): Promise<HealthKitSleepData[]> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.getSleepSamples(options, (error: Error, results: HealthKitSleepData[]) => {
        if (error) {
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  };
  
  const fetchAppleHealthWorkouts = async (): Promise<HealthKitWorkoutData[]> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.getWorkouts(options, (error: Error, results: HealthKitWorkoutData[]) => {
        if (error) {
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  };
  
  const fetchAppleHealthCalories = async (): Promise<HealthKitCaloriesData[]> => {
    if (!AppleHealthKit) {
      throw new Error('Apple HealthKit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDailyCaloriesBurned(options, (error: Error, results: HealthKitCaloriesData[]) => {
        if (error) {
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  };
  
  // Google Fit data fetching functions
  const fetchGoogleFitSteps = async (): Promise<GoogleFitStepData[]> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 *.60 * 1000), // 7 days ago
      endDate: new Date(),
      bucketUnit: 'DAY',
      bucketInterval: 1
    };
    
    try {
      const res = await GoogleFit.getDailyStepCountSamples(options);
      
      // Find the data source with most complete data
      let stepData: GoogleFitStepData[] = [];
      
      if (res && res.length > 0) {
        for (const source of res) {
          if (source.steps && source.steps.length > 0) {
            stepData = source.steps;
            break;
          }
        }
      }
      
      return stepData;
    } catch (error) {
      console.error('Error fetching Google Fit steps:', error);
      throw error;
    }
  };
  
  const fetchGoogleFitHeartRate = async (): Promise<GoogleFitHeartRateData[]> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(),
      bucketUnit: 'HOUR',
      bucketInterval: 1
    };
    
    try {
      const res = await GoogleFit.getHeartRateSamples(options);
      return res as GoogleFitHeartRateData[];
    } catch (error) {
      console.error('Error fetching Google Fit heart rate:', error);
      throw error;
    }
  };
  
  const fetchGoogleFitSleep = async (): Promise<GoogleFitSleepData[]> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date()
    };
    
    try {
      const res = await GoogleFit.getSleepSamples(options);
      return res as GoogleFitSleepData[];
    } catch (error) {
      console.error('Error fetching Google Fit sleep data:', error);
      throw error;
    }
  };
  
  const fetchGoogleFitWorkouts = async (): Promise<GoogleFitWorkoutData[]> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      endDate: new Date()
    };
    
    try {
      const res = await GoogleFit.getActivitySamples(options);
      return res as GoogleFitWorkoutData[];
    } catch (error) {
      console.error('Error fetching Google Fit workouts:', error);
      throw error;
    }
  };
  
  const fetchGoogleFitCalories = async (): Promise<GoogleFitCaloriesData[]> => {
    if (!GoogleFit) {
      throw new Error('Google Fit module not available');
    }
    
    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(),
      basalCalculation: true
    };
    
    try {
      const res = await GoogleFit.getDailyCalorieSamples(options);
      return res as GoogleFitCaloriesData[];
    } catch (error) {
      console.error('Error fetching Google Fit calories:', error);
      throw error;
    }
  };
  
  // Health Data Functions
  export const createOrUpdateHealthData = async (userId: string, healthData: Partial<UserHealthData>) => {
    try {
      // First check if there's an existing document
      const q = query(healthDataRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new health data document
        await addDoc(healthDataRef, {
          userId,
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
  
  export const getUserHealthData = async (userId: string): Promise<UserHealthData | null> => {
    try {
      // Check if user has any connected wearables
      const wearables = await getUserWearableConnections(userId);
      const activeWearable = wearables.find(w => w.isConnected);
      
      // If there's an active wearable, try to sync latest data
      if (activeWearable) {
        try {
          // If last sync was more than 1 hour ago, sync new data
          const lastSyncTime = activeWearable.lastSynced?.toDate()?.getTime() || 0;
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          
          if (lastSyncTime < oneHourAgo) {
            await syncHealthData(userId, activeWearable.type);
          }
        } catch (syncError) {
          console.error('Error syncing latest health data:', syncError);
          // Continue with existing data if sync fails
        }
      }
      
      // Get user health data from Firestore
      const q = query(healthDataRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const docData = querySnapshot.docs[0].data();
      const userData = {
        id: querySnapshot.docs[0].id,
        userId: docData.userId,
        steps: docData.steps || [],
        heartRate: docData.heartRate || [],
        sleepData: docData.sleepData || [],
        caloriesBurned: docData.caloriesBurned || [],
        workouts: docData.workouts || [],
        lastUpdated: docData.lastUpdated
      } as UserHealthData;
      
      return userData;
    } catch (error) {
      console.error('Error getting user health data:', error);
      throw error;
    }
  };
  
  // Add metrics (steps, heart rate, etc.) - for manual entry if needed
  export const addHealthMetrics = async (
    userId: string, 
    metricType: keyof Omit<UserHealthData, 'userId' | 'lastUpdated' | 'workouts' | 'sleepData'>, 
    metrics: HealthMetric[]
  ) => {
    try {
      const userData = await getUserHealthData(userId);
      
      if (!userData) {
        // Create a new document with these metrics
        const initialData: Partial<UserHealthData> = {
          userId,
          [metricType]: metrics
        };
        await createOrUpdateHealthData(userId, initialData);
        return;
      }
      
      // Update existing document with new metrics
      const updatedMetrics = [...(userData[metricType] || []), ...metrics];
      await createOrUpdateHealthData(userId, { [metricType]: updatedMetrics });
    } catch (error) {
      console.error(`Error adding health metrics (${metricType}):`, error);
      throw error;
    }
  };
  
  // Calculate recovery status based on health data
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
// Helper function to calculate heart rate variability
const calculateHRV = (heartRateData: HealthMetric[]): number => {
    if (heartRateData.length < 5) {
      return 50; // Default value
    }
    
    // Sort by timestamp
    const sortedData = [...heartRateData]
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    
    // Calculate differences between consecutive heart rates
    const differences = [];
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
  
  // Function to check if health services are available
  export const isHealthServiceAvailable = (serviceType: 'appleHealth' | 'googleFit'): boolean => {
    try {
      if (serviceType === 'appleHealth') {
        return Platform.OS === 'ios' && !!AppleHealthKit;
      } else if (serviceType === 'googleFit') {
        return Platform.OS === 'android' && !!GoogleFit;
      }
      return false;
    } catch (error) {
      console.error(`Error checking ${serviceType} availability:`, error);
      return false;
    }
  };
  
  // Disconnect a wearable
  export const disconnectWearable = async (connectionId: string) => {
    try {
      const docRef = doc(wearableConnectionsRef, connectionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Wearable connection not found');
      }
      
      const connection = docSnap.data() as WearableConnection;
      
      // For OAuth-based services like Fitbit, we would revoke the access token here
      if (connection.type === 'fitbit' || connection.type === 'garmin') {
        // Placeholder for OAuth token revocation
        console.log(`Revoking ${connection.type} access would happen here`);
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
  
  // Get system services availability
  export const getHealthServicesStatus = async (): Promise<{
    appleHealth: boolean;
    googleFit: boolean;
    fitbit: boolean;
    garmin: boolean;
  }> => {
    try {
      // For Apple HealthKit
      let appleHealthAvailable = false;
      if (Platform.OS === 'ios' && AppleHealthKit) {
        try {
          // Check if HealthKit is available on this device
          appleHealthAvailable = await new Promise((resolve) => {
            AppleHealthKit.isAvailable((error: Error, available: boolean) => {
              if (error) {
                resolve(false);
                return;
              }
              resolve(available);
            });
          });
        } catch (error) {
          console.error('Error checking HealthKit availability:', error);
          appleHealthAvailable = false;
        }
      }
      
      // For Google Fit
      let googleFitAvailable = false;
      if (Platform.OS === 'android' && GoogleFit) {
        try {
          // Check if Google Fit is available
          const result = await GoogleFit.checkIsAuthorized();
          googleFitAvailable = result.isAuth;
        } catch (error) {
          console.error('Error checking Google Fit availability:', error);
          googleFitAvailable = false;
        }
      }
      
      // For third-party services, we would need to check if the user has the apps installed
      // This is a simplified placeholder
      const fitbitAvailable = true; // Always allow Fitbit connection attempt
      const garminAvailable = true; // Always allow Garmin connection attempt
      
      return {
        appleHealth: appleHealthAvailable,
        googleFit: googleFitAvailable,
        fitbit: fitbitAvailable,
        garmin: garminAvailable
      };
    } catch (error) {
      console.error('Error getting health services status:', error);
      throw error;
    }
  };
  
  // Fallback function to provide mock data when actual health services aren't available
  export const getHealthDataFallback = async (userId: string): Promise<UserHealthData> => {
    try {
      // First, check if real data exists in Firestore
      const q = query(healthDataRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        
        // If we have some data but it's incomplete, we'll return it with fallbacks for missing fields
        return {
          userId,
          steps: docData.steps || generateMockSteps(),
          heartRate: docData.heartRate || generateMockHeartRate(),
          sleepData: docData.sleepData || generateMockSleep(),
          caloriesBurned: docData.caloriesBurned || generateMockCalories(),
          workouts: docData.workouts || generateMockWorkouts(),
          lastUpdated: docData.lastUpdated || Timestamp.now()
        };
      }
      
      // If no real data exists, generate completely mock data
      const mockData: UserHealthData = {
        userId,
        steps: generateMockSteps(),
        heartRate: generateMockHeartRate(),
        sleepData: generateMockSleep(),
        caloriesBurned: generateMockCalories(),
        workouts: generateMockWorkouts(),
        lastUpdated: Timestamp.now()
      };
      
      return mockData;
    } catch (error) {
      console.error('Error generating fallback health data:', error);
      throw error;
    }
  };
  
  // Helper functions to generate mock data
  const generateMockSteps = (): HealthMetric[] => {
    const steps = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      steps.push({
        value: 5000 + Math.floor(Math.random() * 5000), // 5000-10000 steps
        timestamp: Timestamp.fromDate(date),
        source: 'mock'
      });
    }
    
    return steps;
  };
  
  const generateMockHeartRate = (): HealthMetric[] => {
    const heartRates = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      
      heartRates.push({
        value: 60 + Math.floor(Math.random() * 30), // 60-90 bpm
        timestamp: Timestamp.fromDate(date),
        source: 'mock'
      });
    }
    
    return heartRates;
  };
  
  const generateMockSleep = () => {
    const sleepData = [];
    const now = new Date();
    now.setHours(8, 0, 0, 0); // 8:00 AM today
    
    for (let i = 0; i < 7; i++) {
      const sleepEnd = new Date(now);
      sleepEnd.setDate(sleepEnd.getDate() - i);
      
      const sleepStart = new Date(sleepEnd);
      sleepStart.setHours(sleepStart.getHours() - 8); // 8 hours earlier
      
      // Deep sleep (2 hours)
      sleepData.push({
        startTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 2 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 4 * 60 * 60 * 1000)),
        quality: 'deep' as 'deep',
        duration: 120 // 2 hours in minutes
      });
      
      // Light sleep (4 hours)
      sleepData.push({
        startTime: Timestamp.fromDate(sleepStart),
        endTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 2 * 60 * 60 * 1000)),
        quality: 'light' as 'light',
        duration: 120 // 2 hours in minutes
      });
      
      // More light sleep
      sleepData.push({
        startTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 4 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 6 * 60 * 60 * 1000)),
        quality: 'light' as 'light',
        duration: 120 // 2 hours in minutes
      });
      
      // REM sleep (1.5 hours)
      sleepData.push({
        startTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 6 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 7.5 * 60 * 60 * 1000)),
        quality: 'rem' as 'rem',
        duration: 90 // 1.5 hours in minutes
      });
      
      // Awake (0.5 hours)
      sleepData.push({
        startTime: Timestamp.fromDate(new Date(sleepStart.getTime() + 7.5 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(sleepEnd),
        quality: 'awake' as 'awake',
        duration: 30 // 0.5 hours in minutes
      });
    }
    
    return sleepData;
  };
  
  const generateMockCalories = (): HealthMetric[] => {
    const calories = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      calories.push({
        value: 1800 + Math.floor(Math.random() * 800), // 1800-2600 calories
        timestamp: Timestamp.fromDate(date),
        source: 'mock'
      });
    }
    
    return calories;
  };
  
  const generateMockWorkouts = () => {
    const workouts = [];
    const now = new Date();
    
    const workoutTypes = ['running', 'strength', 'cycling', 'walking', 'swimming'];
    
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - i - (i % 2)); // Every other day
      startDate.setHours(18, 0, 0, 0); // 6:00 PM
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 45); // 45 minute workout
      
      const workoutType = workoutTypes[i % workoutTypes.length];
      
      workouts.push({
        type: workoutType,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        calories: 300 + Math.floor(Math.random() * 200), // 300-500 calories
        heartRateAvg: 120 + Math.floor(Math.random() * 20), // 120-140 bpm
        heartRateMax: 150 + Math.floor(Math.random() * 20), // 150-170 bpm
        distance: workoutType === 'running' || workoutType === 'cycling' ? 
          3 + Math.random() * 5 : // 3-8 km for cardio
          undefined // no distance for strength
      });
    }
    
    return workouts;
  };