import { AuthContextProvider, useAuthContext } from "@/context/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

const MainLayout = () => {
  const { isAuthenticated } = useAuthContext(); // Ensure AuthContextProvider wraps this component
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("isAuthenticated", isAuthenticated);
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
    <AuthContextProvider>
      <MainLayout />
    </AuthContextProvider>
  );
}
