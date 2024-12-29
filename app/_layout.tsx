import { Colors } from "@/constants/Colors";
import { AuthContextProvider, useAuthContext } from "@/context/AuthContext";
import { Theme, ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import * as Notifications from "expo-notifications";
import { NotificationProvider } from "@/context/NotificationContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    importance: Notifications.AndroidImportance.HIGH,
    sound: "notification1.wav",
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MainLayout = () => {
  const { theme } = useTheme();
  const color = Colors[theme];
  const { isAuthenticated } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAuthenticated === "undefined") return;

    if (isAuthenticated && segments[0] !== "(app)") {
      router.replace("/(app)/(tabs)/Home");
    } else if (
      !isAuthenticated &&
      segments[0] !== "Signin" &&
      segments[0] !== "SignUp"
    ) {
      router.replace("/Signin");
    }
  }, [isAuthenticated]);

  const themes: Theme[] = ["light", "dark"];
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <StatusBar style={themes.find((i) => i !== theme)} />
      <Slot />
    </View>
  );
};
export default function RootLayout() {
  return (
    <AuthContextProvider>
      <NotificationProvider>
        <ThemeProvider>
          <MainLayout />
        </ThemeProvider>
      </NotificationProvider>
    </AuthContextProvider>
  );
}

const Loading = () => {
  return (
    <View className="items-center justify-center flex-1 bg-white">
      <Image
        source={require("@/assets/images/icon-app.png")} //
        style={{ width: 100, height: 100 }}
        className="mb-6"
      />
      <Text className="mb-4 text-2xl font-bold text-gray-800">Health Chat</Text>
      <Text className="mb-4 text-lg text-gray-400">
        HealthChat Your AI Health Assistant
      </Text>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="mt-4 text-gray-500">Loading, please wait...</Text>
    </View>
  );
};
