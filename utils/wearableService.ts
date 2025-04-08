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
  
  // Mock health data for development
  const MOCK_HEALTH_DATA = {
    steps: [
      { value: 8432, timestamp: new Date(), source: 'mock' },
      { value: 10123, timestamp: new Date(Date.now() - 86400000), source: 'mock' }, // yesterday
      { value: 6543, timestamp: new Date(Date.now() - 86400000 * 2), source: 'mock' }, // 2 days ago
    ],
    heartRate: [
      { value: 68, timestamp: new Date(), source: 'mock' },
      { value: 72, timestamp: new Date(Date.now() - 3600000), source: 'mock' }, // 1 hour ago
      { value: 75, timestamp: new Date(Date.now() - 7200000), source: 'mock' }, // 2 hours ago
    ],
    sleepData: [
      { 
        startTime: new Date(Date.now() - 28800000), // 8 hours ago
        endTime: new Date(), 
        quality: 'deep' as 'deep', // type assertion
        duration: 120 // 2 hours deep sleep
      },
      { 
        startTime: new Date(Date.now() - 28800000), 
        endTime: new Date(), 
        quality: 'light' as 'light', // type assertion
        duration: 240 // 4 hours light sleep
      },
      { 
        startTime: new Date(Date.now() - 28800000), 
        endTime: new Date(), 
        quality: 'rem' as 'rem', // type assertion
        duration: 90 // 1.5 hours REM sleep
      },
      { 
        startTime: new Date(Date.now() - 28800000), 
        endTime: new Date(), 
        quality: 'awake' as 'awake', // type assertion
        duration: 30 // 30 minutes awake
      },
    ],
    caloriesBurned: [
      { value: 1850, timestamp: new Date(), source: 'mock' },
      { value: 2100, timestamp: new Date(Date.now() - 86400000), source: 'mock' }, // yesterday
    ],
    workouts: [
      {
        type: 'running',
        startTime: new Date(Date.now() - 172800000), // 2 days ago
        endTime: new Date(Date.now() - 169200000), // 2 days ago + 1 hour
        calories: 450,
        heartRateAvg: 140,
        heartRateMax: 165,
        distance: 5.2,
      },
      {
        type: 'strength',
        startTime: new Date(Date.now() - 86400000), // yesterday
        endTime: new Date(Date.now() - 84600000), // yesterday + 30 minutes
        calories: 320,
        heartRateAvg: 125,
        heartRateMax: 145,
      },
    ],
  };
  
  // Check if real health data APIs are available
  const isHealthKitAvailable = Platform.OS === 'ios';
  const isGoogleFitAvailable = Platform.OS === 'android';
  
  // Wearable Connection Functions
  export const connectWearable = async (connection: Omit<WearableConnection, 'id' | 'lastSynced'>) => {
    const docRef = await addDoc(wearableConnectionsRef, {
      ...connection,
      lastSynced: null,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  };
  
  export const updateWearableConnection = async (id: string, updates: Partial<WearableConnection>) => {
    const docRef = doc(wearableConnectionsRef, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };
  
  export const getUserWearableConnections = async (userId: string) => {
    const q = query(wearableConnectionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WearableConnection[];
  };
  
  // Health Data Functions
  export const createOrUpdateHealthData = async (userId: string, healthData: Partial<UserHealthData>) => {
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
  };
  
  export const getUserHealthData = async (userId: string): Promise<UserHealthData | null> => {
    // In a real app, we would fetch from HealthKit, Google Fit, etc.
    // For this implementation, we'll return mock data or fetch from Firebase
    
    // First, try to get data from Firebase
    const q = query(healthDataRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
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
    }
    
    // No data in Firebase, return mock data
    // In a real app, this would be the place to fetch from HealthKit/Google Fit
    const mockData: UserHealthData = {
      userId,
      steps: MOCK_HEALTH_DATA.steps.map(step => ({
        ...step,
        timestamp: Timestamp.fromDate(step.timestamp)
      })),
      heartRate: MOCK_HEALTH_DATA.heartRate.map(hr => ({
        ...hr,
        timestamp: Timestamp.fromDate(hr.timestamp)
      })),
      sleepData: MOCK_HEALTH_DATA.sleepData.map(sleep => ({
        ...sleep,
        startTime: Timestamp.fromDate(sleep.startTime),
        endTime: Timestamp.fromDate(sleep.endTime),
        quality: sleep.quality as 'deep' | 'light' | 'rem' | 'awake'
      })),
      caloriesBurned: MOCK_HEALTH_DATA.caloriesBurned.map(cal => ({
        ...cal,
        timestamp: Timestamp.fromDate(cal.timestamp)
      })),
      workouts: MOCK_HEALTH_DATA.workouts.map(workout => ({
        ...workout,
        startTime: Timestamp.fromDate(workout.startTime),
        endTime: Timestamp.fromDate(workout.endTime)
      })),
      lastUpdated: Timestamp.fromDate(new Date())
    };
    
    // Save mock data to Firebase
    await createOrUpdateHealthData(userId, mockData);
    
    return mockData;
  };
  
  // Add metrics (steps, heart rate, etc.)
  export const addHealthMetrics = async (
    userId: string, 
    metricType: keyof Omit<UserHealthData, 'userId' | 'lastUpdated' | 'workouts' | 'sleepData'>, 
    metrics: HealthMetric[]
  ) => {
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
  };
  
  // Calculate recovery status based on health data
  export const calculateRecoveryStatus = async (userId: string): Promise<RecoveryStatus | null> => {
    const userData = await getUserHealthData(userId);
    
    if (!userData || !userData.sleepData || userData.sleepData.length === 0) {
      return null;
    }
    
    // Simple algorithm to calculate recovery status
    // In a real app, this would be more sophisticated
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
    
    // Calculate activity level
    const recentWorkouts = userData.workouts?.length > 0
      ? userData.workouts
          .filter(w => {
            const workoutDate = w.endTime.toDate();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return workoutDate > yesterday;
          })
      : [];
    
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
        heartRateVariability: userData.heartRate?.length > 2 ? 50 : undefined, // Mock HRV value
        recentActivityLevel: Math.round(activityScore)
      }
    };
  };