export interface Challenge {
    id: string;
    title: string;
    description: string;
    goal: number; // The target value (e.g., steps, minutes, etc.)
    currentProgress: number;
    startDate: Date;
    endDate: Date;
    reward?: string; // Optional reward information (e.g., badge name)
  }