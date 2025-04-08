import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext'; // Update this path as needed
import { 
  getUserHealthData, 
  calculateRecoveryStatus 
} from '../utils/wearableService';
import { 
  UserHealthData, 
  RecoveryStatus, 
  SleepSummary 
} from '../types/WearableTypes';

type HealthDataState = {
  isLoading: boolean;
  healthData: UserHealthData | null;
  recoveryStatus: RecoveryStatus | null;
  recentSleepSummary: SleepSummary | null;
  error: Error | null;
  refreshData: () => Promise<void>;
};

const useHealthData = (): HealthDataState => {
  const { user } = useAuthContext(); // Using AuthContext instead of useAuth
  const [isLoading, setIsLoading] = useState(true);
  const [healthData, setHealthData] = useState<UserHealthData | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [recentSleepSummary, setRecentSleepSummary] = useState<SleepSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchHealthData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user health data
      const data = await getUserHealthData(user.uid);
      setHealthData(data);

      // Calculate recovery status
      if (data) {
        const status = await calculateRecoveryStatus(user.uid);
        setRecoveryStatus(status);

        // Process sleep data to get recent summary
        if (data.sleepData && data.sleepData.length > 0) {
          // Sort by date (most recent first)
          const sortedSleepData = [...data.sleepData].sort(
            (a, b) => b.endTime.toMillis() - a.endTime.toMillis()
          );

          // Get most recent sleep data
          const recentSleep = sortedSleepData[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          // Calculate sleep metrics
          const totalSleepTime = recentSleep.duration;
          const deepSleepTime = sortedSleepData
            .filter(s => s.quality === 'deep' && 
                   s.endTime.toDate().getTime() > yesterday.getTime())
            .reduce((acc, s) => acc + s.duration, 0);
          const remSleepTime = sortedSleepData
            .filter(s => s.quality === 'rem' && 
                   s.endTime.toDate().getTime() > yesterday.getTime())
            .reduce((acc, s) => acc + s.duration, 0);
          const lightSleepTime = sortedSleepData
            .filter(s => s.quality === 'light' && 
                   s.endTime.toDate().getTime() > yesterday.getTime())
            .reduce((acc, s) => acc + s.duration, 0);
          const awakeTimes = sortedSleepData
            .filter(s => s.quality === 'awake' && 
                   s.endTime.toDate().getTime() > yesterday.getTime())
            .length;

          // Calculate sleep score (simple algorithm)
          const deepSleepPercent = (deepSleepTime / totalSleepTime) * 100;
          const remSleepPercent = (remSleepTime / totalSleepTime) * 100;
          const sleepScore = Math.min(
            100, 
            Math.max(
              0, 
              50 + 
              (deepSleepPercent > 20 ? 25 : deepSleepPercent * 1.25) + 
              (remSleepPercent > 25 ? 25 : remSleepPercent * 1) - 
              (awakeTimes * 5)
            )
          );

          setRecentSleepSummary({
            date: recentSleep.endTime.toDate(),
            totalSleepTime,
            deepSleepTime,
            remSleepTime,
            lightSleepTime,
            awakeTimes,
            sleepScore: Math.round(sleepScore)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch health data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [user]);

  return {
    isLoading,
    healthData,
    recoveryStatus,
    recentSleepSummary,
    error,
    refreshData: fetchHealthData,
  };
};

export default useHealthData;