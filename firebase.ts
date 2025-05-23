import { initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getFirestore,
  collection,
} from "firebase/firestore";
import { Message, UserProfile } from "./types";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);

export const userRef = collection(db, "users");
export const chatRef = collection(db, "chats");
export const healthDataRef = collection(db, "healthData");
export const nutritionLogsRef = collection(db, "nutritionLogs");
export const dietPlansRef = collection(db, "dietPlans");
export const wearableConnectionsRef = collection(db, "wearableConnections");

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const signupUser = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const createUserProfile = async (uid: string, email: string, fullName?: string ) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    email,
    isPro: false,
    isDeluxe: false,
    createdAt: serverTimestamp(),
    privacySettings: {
      shareHealthData: false,
      retentionPeriodDays: 90,
      consentTimestamp: null
    },
    ...(fullName ? { fullName } : {})
  });
};
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return {
    email: userSnap.data().email!,
    uid: uid,
    isPro: userSnap.data().isPro,
    isDeluxe: userSnap.data().isDeluxe,
    createdAt: userSnap.data().createdAt,
    subscriptionId: userSnap.data().subscriptionPlan || null,
    stripeCustomerId:
      typeof userSnap.data().stripeCustomerId === "object"
        ? userSnap.data().stripeCustomerId.id
        : userSnap.data().stripeCustomerId,
    connectedWearables: userSnap.data().connectedWearables || [],
    privacySettings: userSnap.data().privacySettings || {
      shareHealthData: false,
      retentionPeriodDays: 90,
      consentTimestamp: null
    },
  };
};


export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export async function saveChatToDatabase(userId: string, messages: Message[]) {
  try {
    const chatRef = doc(collection(db, "ChatsCollection"));
    const data = {
      userId,
      messages: messages.map(msg => {
        const messageData: any = {
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? Timestamp.fromDate(msg.timestamp) : Timestamp.now()
        };
        if (msg.character) {
          messageData.character = msg.character;
        }
        return messageData;
      }),
      createdAt: Timestamp.now(),
      shared: true,
      upvotes: 0,
      downvotes: 0,
    };
    await setDoc(chatRef, data);
    return chatRef.id;
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
}