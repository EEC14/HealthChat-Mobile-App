import { Tabs } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useAuthContext } from "@/context/AuthContext";
import Octicons from "@expo/vector-icons/Octicons";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function TabLayout() {
  const { user, logout } = useAuthContext();
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#999",
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ],
        tabBarIconStyle: { marginTop: 5 },
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = focused ? 24 : 20; // Highlight effect
          return renderTabIcon(route.name, color, size);
        },
        tabBarIndicatorStyle: (focused: boolean) => ({
          height: focused ? 4 : 0,
          backgroundColor: Colors[colorScheme ?? "light"].tint,
        }),
        // Custom header style
        headerShown: true,
        headerStyle: styles.headerStyle,
        headerTitleStyle: styles.headerTitleStyle,
        headerTitleAlign: "center",
        headerTintColor: Colors[colorScheme ?? "light"].tint,
        headerBackground: () => <View style={styles.headerBackground}></View>,
        headerRight: () =>
          user && (
            <HeaderRight
              email={user.email}
              modalVisible={modalVisible}
              logout={logout}
              setModalVisible={setModalVisible}
            />
          ),
        headerLeft: () => (
          <>
            <View style={styles.leftSection}>
              <View style={styles.logoContainer}>
                <Image
                  style={styles.logo}
                  source={require("../../../assets/images/icon.png")}
                />
              </View>
              {/* Title and Subtitle */}
              {/* <View>
                <Text style={styles.title}>HealthChat</Text>
                <Text style={styles.subtitle}>Your AI Health Assistant</Text>
              </View> */}
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              <Text style={styles.tag}>AI</Text>
            </View>
          </>
        ),
      })}
    >
      <Tabs.Screen name="Home" options={{ title: "Home" }} />
      <Tabs.Screen name="ShareChats" options={{ title: "ShareChats" }} />
      <Tabs.Screen name="DietPlan" options={{ title: "DietPlan" }} />
      <Tabs.Screen name="Subscription" options={{ title: "Subscription" }} />
    </Tabs>
  );
}

function renderTabIcon(name: string, color: string, size: number) {
  switch (name) {
    case "Home":
      return <FontAwesome5 name="brain" size={size} color={color} />;
    case "ShareChats":
      return (
        <FontAwesome6 name="share-from-square" size={size} color={color} />
      );
    case "Subscription":
      return <FontAwesome6 name="crown" size={size} color={color} />;
    case "DietPlan":
      return <FontAwesome5 name="apple-alt" size={size} color={color} />;
    default:
      return null;
  }
}
const HeaderRight = React.memo(
  ({
    email,
    modalVisible,
    setModalVisible,
    logout,
  }: {
    logout: () => void;
    email: string;
    modalVisible: boolean;
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  }) => (
    <>
      <Pressable
        style={styles.headerRight}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.profileIcon}>
          <Text style={styles.profileText}>
            {email.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </Pressable>
      <Modal
        // transparent={true}
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modelHeader}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Account</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Octicons name="x" size={24} color="gray" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "900", fontSize: 16 }}>Account:</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                paddingHorizontal: 30,
                paddingVertical: 20,
                backgroundColor: "white",
                width: "100%",
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <AntDesign name="user" size={16} color="black" />
              <Text style={styles.emailText}>{email}</Text>
            </View>
            <Text style={{ fontWeight: "900", fontSize: 16 }}>Log out:</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
);

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  // Header Styles
  headerStyle: {
    backgroundColor: Colors.light.background, // or gradient colors
    shadowColor: "transparent", // Removes default shadow
    elevation: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  headerBackground: {
    flex: 1,
    backgroundColor: Colors.light.background, // Add a gradient or background image
  },
  headerRight: {
    marginRight: 15,
  },
  profileIcon: {
    backgroundColor: "#e0f2ff",
    borderRadius: 50,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#7293ff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#eee",
    justifyContent: "flex-start",
  },
  modalContent: {
    padding: 20,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#333",
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#333",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  modelHeader: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    marginLeft: 15,
    flexDirection: "row",
    alignItems: "stretch",
  },
  logoContainer: {
    backgroundColor: "#444",
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logo: { width: 30, height: 30 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a202c",
  },
  subtitle: {
    fontSize: 14,
    color: "#4a5568",
  },
  rightSection: {
    backgroundColor: "#e7f1ff",
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d6efd",
  },
});
