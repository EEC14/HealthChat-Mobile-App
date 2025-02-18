import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { StatusBar } from "expo-status-bar";
import { Tabs } from "expo-router";

import HeaderRight from "@/components/Layout/AccountModel";
import CompanyInfo from "@/components/Layout/InfoModel";
import { HapticTab } from "@/components/HapticTab";

import { Theme, useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
  const { theme } = useTheme();
  const currentColors = Colors[theme];

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: currentColors.primary,
          tabBarInactiveTintColor: currentColors.textSecondary,
          tabBarButton: HapticTab,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: currentColors.surface,
              borderTopWidth: 1,
              borderColor: currentColors.border,
            },
          ],
          tabBarPosition: "bottom",
          keyboardHandlingEnabled: true,
          tabBarHideOnKeyboard: true,
          tabBarIconStyle: { marginTop: 5 },
          tabBarLabelStyle: [
            styles.tabLabel,
            { color: currentColors.textSecondary },
          ],
          tabBarIcon: ({ color, focused }) => {
            const size = focused ? 22 : 18;
            return renderTabIcon(route.name, color, size);
          },
          tabBarIndicatorStyle: {
            height: 2,
            backgroundColor: currentColors.primary,
          },
          headerShadowVisible: false,
          headerShown: true,
          headerStyle: {
            backgroundColor: currentColors.surface,
          },
          headerTitleStyle: [
            styles.headerTitleStyle,
            { color: currentColors.textPrimary },
          ],
          headerTitleAlign: "center",
          headerTintColor: currentColors.textPrimary,

          headerRight: () => <HeaderRight />,
          headerLeft: () => <CompanyInfo />,
        })}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarLabel: "Home",
          }}
        />
        <Tabs.Screen
          name="ShareChats"
          options={{
            title: "Share Chats",
            tabBarLabel: "Share Chats",
          }}
        />
        <Tabs.Screen
          name="CarePlan"
          options={{
            title: "Care Plans",
            tabBarLabel: "Care Plans",
          }}
        />
        <Tabs.Screen
          name="Subscription"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
          }}
        />
                <Tabs.Screen
          name="ChallengeScreen"
          options={{
            title: "Challenge",
            tabBarLabel: "Challenge",
          }}
        />
      </Tabs>
    </>
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
    case "CarePlan":
      return (
        <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
      );
    case "ChallengeScreen":
      return (
          <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
      );  
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      android: {
        height: 60,
      },
    }),
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerBackground: {
    flex: 1,
  },
});
