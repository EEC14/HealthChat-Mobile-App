import { StyleSheet, Text, View, Button } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useAuthContext } from "@/context/AuthContext";

export default function HomeScreen() {
  const { user, logout } = useAuthContext();
  return (
    <View>
      <Text className="text-3xl text-blue-500 ">{user?.email}</Text>
      <Button title="logout" onPress={logout} />
      {/* <ThemedView style={styles.titleContainer}> */}
      <ThemedText type="title">Welcome!</ThemedText>
      {/* </ThemedView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
