import { Timestamp } from "firebase/firestore";

export type WearableType = 'appleHealth' | 'googleFit' | 'fitbit' | 'garmin' | 'other';

export interface WearableConnection {
  id: string;
  userId: string;
  type: WearableType;
  isConnected: boolean;
  lastSynced: Timestamp | null;
  permissions: string[];
}

export interface HealthMetric {
  timestamp: Timestamp;
  value: number;
  source: string;
}

export interface UserHealthData {
  userId: string;
  steps: HealthMetric[];
  heartRate: HealthMetric[];
  sleepData: {
    startTime: Timestamp;
    endTime: Timestamp;
    quality: 'deep' | 'light' | 'rem' | 'awake';
    duration: number; // in minutes
  }[];
  caloriesBurned: HealthMetric[];
  workouts: {
    type: string;
    startTime: Timestamp;
    endTime: Timestamp;
    calories: number;
    heartRateAvg?: number;
    heartRateMax?: number;
    distance?: number;
  }[];
  lastUpdated: Timestamp;
}

export interface SleepSummary {
  date: Date;
  totalSleepTime: number; // in minutes
  deepSleepTime: number; // in minutes
  remSleepTime: number; // in minutes
  lightSleepTime: number; // in minutes
  awakeTimes: number;
  sleepScore: number; // 0-100
}

export interface RecoveryStatus {
  score: number; // 0-100
  recommendation: string;
  contributingFactors: {
    sleepQuality: number; // 0-100
    restingHeartRate: number;
    heartRateVariability?: number;
    recentActivityLevel: number; // 0-100
  };
}