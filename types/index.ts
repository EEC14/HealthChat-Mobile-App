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
}

export type PlanType = "workout" | "diet" | "meditation";
export type StepType = "select" | "profile" | "questionnaire" | "plan";

export type ColorsType = typeof Colors;

export interface MedicalSpecialist {
  id: string;
  name: string;
  specialization: SpecializationType;
  address: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  // Simple payment amount field
  paymentAmount: number; // Amount paid, 0 for non-paying
  paymentDate: Date; // Track when payment was made
}

export enum SpecializationType {
  ORTHOPEDIC = 'orthopedic',
  PHYSIOTHERAPY = 'physiotherapy',
  GENERAL = 'general',
  PSYCHOLOGY = 'psychology',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology'
};

export interface MedicalSpecialistWithDistance extends MedicalSpecialist {
  distance: number;
};
