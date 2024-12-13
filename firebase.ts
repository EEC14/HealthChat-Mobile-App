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
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);

export const userRef = collection(db, "users");
export const chatRef = collection(db, "chats");

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

export const createUserProfile = async (uid: string, email: string) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    uid,
    email,
    isPro: false,
    isDeluxe: false,
    createdAt: serverTimestamp(),
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
    stripeCustomerId: userSnap.data().stripeCustomerId || null,
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
  const chatRef = doc(collection(db, "ChatsCollection"));
  await setDoc(chatRef, {
    userId,
    messages,
    createdAt: Timestamp.now(),
    shared: true,
    upvotes: 0,
    downvotes: 0,
  });
  return chatRef.id;
}
