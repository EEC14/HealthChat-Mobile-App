import { Colors } from "@/constants/Colors";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  AntDesign,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const HeaderRight = React.memo(({}: {}) => {
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
              Account
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Octicons name="x" size={24} color={currentColors.iconDefault} />
            </TouchableOpacity>
          </View>
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
                style={[styles.emailText, { color: currentColors.textPrimary }]}
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
                style={[styles.logoutText, { color: currentColors.background }]}
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
