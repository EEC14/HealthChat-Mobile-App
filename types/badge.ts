export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Icon name for display
    earnedAt?: Date;
  }
  
  export interface UserBadges {
    userId: string;
    badges: {
      [badgeId: string]: {
        earned: boolean;
        earnedAt?: Date;
      }
    };
    completedChallenges: number;
    streakDays: number;
    lastCompletedDate?: Date;
  }