export interface Challenge {
    id: string;
    title: string;
    description: string;
    goal: number;
    currentProgress: number;
    startDate: Date;
    endDate: Date;
    reward?: string;
  }