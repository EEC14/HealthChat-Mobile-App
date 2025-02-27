import { Colors } from "@/constants/Colors";
import { Timestamp } from "firebase/firestore";
import { AudioCue } from "./voiceTypes";
export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  character: SpecializationType;
  timestamp: Date;
  replyTo?: Message | null;
  isPartial?: boolean; 
}

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
export enum SpecializationType {
  ORTHOPEDIC = 'orthopedic',
  PHYSIOTHERAPY = 'physiotherapy',
  GENERAL = 'general',
  PSYCHOLOGY = 'psychology',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology',
  DEFAULT= 'default',
  DENTISTRY = 'dentistry',
};



export type PlanType = "workout" | "diet" | "meditation";
export type StepType = "select" | "questionnaire" | "plan";

export type ColorsType = typeof Colors;

export interface ExtendedUserProfile extends UserProfile {
}

export interface SavedPlan {
  id: string;
  userId: string;
  type: PlanType;
  name: string; 
  plan: string;
  audioCues?: AudioCue[];
  createdAt: number;
}