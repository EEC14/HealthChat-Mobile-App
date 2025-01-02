import { Colors } from "@/constants/Colors";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  AntDesign,
  FontAwesome6,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const HeaderRight = React.memo(({}: {}) => {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const currentColors = Colors[theme];

  return (
    <>
      <Pressable
        style={styles.headerRight}
        onPress={() => setModalVisible(true)}
      >
        <View
          style={[
            styles.profileIcon,
            { backgroundColor: currentColors.secondary },
          ]}
        >
          <Text style={[styles.profileText, { color: currentColors.primary }]}>
            {user?.email.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[styles.overlay, { backgroundColor: currentColors.surface }]}
        >
          <View
            style={[
              styles.modelHeader,
              { backgroundColor: currentColors.background },
            ]}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: currentColors.textPrimary,
              }}
            >
              Profile
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Octicons name="x" size={24} color={currentColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.modalContent}>
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 16,
                  color: currentColors.textPrimary,
                }}
              >
                Account:
              </Text>
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: currentColors.background },
                ]}
              >
                <AntDesign
                  name="user"
                  size={16}
                  color={currentColors.iconDefault}
                />
                <Text
                  style={[
                    styles.emailText,
                    { color: currentColors.textPrimary },
                  ]}
                >
                  {user?.email}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 16,
                  color: currentColors.textPrimary,
                }}
              >
                Plan Details:
              </Text>
              {user?.isDeluxe || user?.isPro ? (
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: currentColors.background,
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "stretch",
                    },
                  ]}
                >
                  <FontAwesome6 name="crown" size={34} color="gold" />
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: currentColors.textPrimary,
                      marginTop: 10,
                    }}
                  >
                    You're a {user.isPro ? "Pro" : "Deluxe"} Member!
                  </Text>
                  <Text
                    style={{
                      color: currentColors.textSecondary,
                    }}
                  >
                    Enjoy unlimited access to all premium features
                  </Text>
                  <View style={{ gap: 4, alignItems: "flex-start" }}>
                    <AntDesign
                      name="setting"
                      size={26}
                      color={currentColors.textPrimary}
                    />
                    <View>
                      <Text
                        className="text-lg font-semibold"
                        style={{ color: currentColors.textPrimary }}
                      >
                        Manage Your Plan
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ color: currentColors.textSecondary }}
                      >
                        Easily upgrade, downgrade, or cancel your subscription. If you subscribed in the web app, please manage your subscription there.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(app)/(tabs)/Subscription")}
                    style={{
                      backgroundColor: "#1E3A8A",
                      borderRadius: 10,
                      alignSelf: "stretch",
                      padding: 10,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Profile
                    </Text>
                    <AntDesign name="arrowright" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: currentColors.background,
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "stretch",
                      gap: 20,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: currentColors.textPrimary,
                      marginTop: 10,
                    }}
                  >
                    You are currently on the Free plan
                  </Text>
                  <Text
                    style={{
                      color: currentColors.textSecondary,
                    }}
                  >
                    Choose the plan that best fits your wellness journey.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(app)/(tabs)/Subscription")}
                    style={{
                      backgroundColor: "#1E3A8A",
                      borderRadius: 10,
                      alignSelf: "stretch",
                      padding: 10,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Subscriptions Details
                    </Text>
                    <AntDesign name="arrowright" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              )}
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 16,
                  color: currentColors.textPrimary,
                }}
              >
                Log out:
              </Text>
              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  { backgroundColor: currentColors.textPrimary },
                ]}
                onPress={logout}
              >
                <Text
                  style={[
                    styles.logoutText,
                    { color: currentColors.background },
                  ]}
                >
                  Log Out
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 16,
                  color: currentColors.textPrimary,
                }}
              >
                Theme Preference:
              </Text>
              <Pressable
                onPress={toggleTheme}
                style={[
                  styles.themeToggle,
                  { backgroundColor: currentColors.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    theme === "light"
                      ? "moon-waning-crescent"
                      : "white-balance-sunny"
                  }
                  size={24}
                  color={
                    theme === "light" ? currentColors.textPrimary : "#FFD700"
                  }
                />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
});

export default HeaderRight;

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
  profileIcon: {
    borderRadius: 50,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
  },
  modalContent: {
    padding: 20,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 20,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "900",
  },
  logoutButton: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
  },
  logoutText: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  modelHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeToggle: {
    padding: 20,
    borderRadius: 20,
  },
});
