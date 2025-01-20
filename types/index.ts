import { Colors } from "@/constants/Colors";
import { Timestamp } from "firebase/firestore";

export type Message = {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
};

export type Chat = {
  id: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  shared: boolean;
  messages: Message[];
  createdAt: Timestamp;
};

export interface UserProfile {
  uid: string;
  email: string;
  isPro: boolean;
  isDeluxe: boolean;
  createdAt: Date;
  stripeCustomerId?: string;
  subscriptionId?: string;
  expoPushToken?: string;
  fullName?: string;
}

export type PlanType = "workout" | "diet" | "meditation";
export type StepType = "select" | "questionnaire" | "plan";

export type ColorsType = typeof Colors;
