import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";
import { Subscription } from "expo-notifications";
import { useRouter } from "expo-router";
import { updateUserProfile } from "@/firebase";
import { useAuthContext } from "./AuthContext";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<{
    remove(): void;
  }>();
  const responseListener = useRef<{
    remove(): void;
  }>();

  useEffect(() => {
    let isAmount = true;
    registerForPushNotificationsAsync().then(
      async (token) => {
        if (user?.uid) {
          await updateUserProfile(user?.uid, { expoPushToken: token });
        }
        setExpoPushToken(token);
      },
      (error) => setError(error)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        redirectNotifications(response.notification);
      });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response?.notification || !isAmount) return;
      if (response) {
        redirectNotifications(response.notification);
      }
    });
    return () => {
      isAmount = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  const redirectNotifications = async (
    notification: Notifications.Notification
  ) => {
    const url = notification.request.content.data?.url;
    if (url) {
      router.push(url);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
