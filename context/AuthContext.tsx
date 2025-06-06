import { onAuthStateChanged, User } from "firebase/auth";
import {
  auth,
  createUserProfile,
  getUserProfile,
  loginUser,
  logoutUser,
  signupUser,
} from "../firebase";
import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserProfile } from "@/types";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
type AuthError = {
  code: string;
  message: string;
};

type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean | undefined;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  fetchUserDetails: () => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authSub = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid);
          
          // Check for trial expiration
          checkTrialExpiration(profile);
          
          setUser(profile);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        handleAuthError(err as AuthError);
      } finally {
        setIsLoading(false);
      }
    });
    return authSub;
  }, []);

  const checkTrialExpiration = (profile: UserProfile | null) => {
    // Add a null check at the beginning of the function
    if (!profile) return;
    if (profile.isDeluxe && profile.deluxeExpiresAt && profile.subscriptionSource === 'referral_trial') {
      const expirationDate = new Date(profile.deluxeExpiresAt);
      const now = new Date();
      
      // If trial has expired
      if (now > expirationDate) {
        // Check if we've already shown the expiration alert today
        const lastAlertShown = localStorage.getItem('lastTrialExpirationAlert');
        const today = now.toDateString();
        
        if (lastAlertShown !== today) {
          // Set the flag to avoid showing multiple alerts on the same day
          localStorage.setItem('lastTrialExpirationAlert', today);
          
          // Show expiration alert
          setTimeout(() => {
            Alert.alert(
              "Your Deluxe Trial Has Expired",
              "Your 1-week Deluxe trial has ended. Upgrade now to continue enjoying premium features!",
              [
                {
                  text: "Not Now",
                  style: "cancel"
                },
                {
                  text: "Upgrade",
                  onPress: () => {
                    const router = useRouter();
                    router.push("/(app)/(tabs)/Subscription");
                  }
                }
              ]
            );
          }, 1000); // Slight delay to ensure UI is fully loaded
        }
      }
    }
  };

  const handleAuthError = (error: AuthError) => {
    let errorMessage = "An unexpected error occurred";
    switch (error.code) {
      case "auth/wrong-password":
        errorMessage = "Incorrect password. Please try again.";
        break;
      case "auth/user-not-found":
        errorMessage = "No user found with this email.";
        break;
      case "auth/email-already-in-use":
        errorMessage = "Email is already registered.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email format.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection.";
        break;
      case "auth/invalid-credential":
        errorMessage = "Invalid credentials. Please try again.";
        break;
      default:
        errorMessage = error.message || "Authentication failed";
    }

    setError(errorMessage);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const firebaseUser = await loginUser(email, password);
      const profile = await getUserProfile(firebaseUser.uid);
      setUser(profile);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const firebaseUser = await signupUser(email, password);
      await createUserProfile(firebaseUser.uid, firebaseUser.email!);
      setUser({
        email: firebaseUser.email!,
        uid: firebaseUser.uid,
        isPro: false,
        isDeluxe: false,
        createdAt: new Date(),
      });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      router.replace("/(app)/(auth)/Signin");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      return true;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };
  const fetchUserDetails = async (): Promise<void> => {
    if (!user || !user.uid) {
      console.warn("User is not logged in or has no UID.");
      return;
    }

    try {
      setIsLoading(true);
      const updatedProfile = await getUserProfile(user.uid);
      setUser(updatedProfile);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        isLoading,
        error,
        clearError,
        fetchUserDetails,
        signInWithGoogle,
        setUser,
        setIsAuthenticated,
        signInWithApple,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error(
      "useAuthContext must be used within an AuthContextProvider"
    );
  return context;
};