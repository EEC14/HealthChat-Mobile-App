import { AuthContextProvider, useAuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
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

  return <Slot />;
};
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthContextProvider>
        <MainLayout />
      </AuthContextProvider>
    </ThemeProvider>
  );
}

const Loading = () => {
  return (
    <View className="items-center justify-center flex-1 bg-white">
      <Image
        source={require("@/assets/images/icon.png")} //
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
