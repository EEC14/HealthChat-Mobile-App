import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { Octicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Modal,
  Linking,
} from "react-native";

const CompanyInfo = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const styles = StyleSheet.create({
    logo: {
      width: 26,
      height: 26,
      resizeMode: "contain",
    },
    leftSection: {
      marginLeft: 15,
      flexDirection: "row",
      alignItems: "stretch",
    },
    logoSmall: {
      backgroundColor: "#1E3A8A",
      borderRadius: 8,
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    logoContainer: {
      backgroundColor: "#1E3A8AC1",
      borderRadius: 8,
      width: 86,
      height: 86,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    rightSection: {
      backgroundColor: currentColors.surface,
      borderRadius: 8,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    tag: {
      fontSize: 14,
      fontWeight: "600",
      color: currentColors.textPrimary,
    },

    // Modal Styles
    overlay: {
      flex: 1,
      backgroundColor: currentColors.surface,
    },
    modalHeader: {
      backgroundColor: currentColors.background,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentColors.textPrimary,
    },
    modalContent: {
      padding: 20,
      flex: 1,
      paddingTop: 60,
      alignItems: "center",
      justifyContent: "space-between",
    },

    logoLarge: {
      width: 64,
      height: 64,
    },
    companyDescription: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: "center",
    },
    actionButton: {
      backgroundColor: currentColors.primary,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 10,
      width: "100%",
      alignItems: "center",
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentColors.background,
    },
    footerText: {
      textAlign: "center",
      fontSize: 12,
      color: currentColors.textSecondary,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentColors.primary,
    },
    subtitle: {
      fontSize: 14,
      color: currentColors.primary,
    },
    badgeContainer: {
      backgroundColor: currentColors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentColors.primary,
      borderStyle: "solid",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: currentColors.primary,
    },
  });

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@esbhealthcare.com");
  };

  const handleVisitWebsite = () => {
    Linking.openURL("https://www.esbhealthcare.com");
  };

  return (
    <>
      <Pressable
        style={{ flexDirection: "row" }}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.leftSection}>
          <View style={styles.logoSmall}>
            <Image
              style={styles.logo}
              source={require("@/assets/images/icon.png")}
            />
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.tag}>AI</Text>
        </View>
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About HealthChat</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Octicons name="x" size={24} color={currentColors.iconDefault} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View
              style={{
                width: "100%",
                gap: 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={styles.logoLarge}
                  />
                </View>
                <View style={{ gap: 12, alignItems: "flex-start" }}>
                  <View>
                    <Text style={styles.title}>HealthChat</Text>
                    <Text style={styles.subtitle}>
                      Your AI Health Assistant
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>Powered by AI</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.companyDescription}>
                HealthChat - Your AI Health Assistant. Providing intelligent
                healthcare solutions to simplify your life.
              </Text>
            </View>
            <View style={{ width: "100%", gap: 10 }}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleContactSupport}
              >
                <Text style={styles.actionButtonText}>Contact Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVisitWebsite}
              >
                <Text style={styles.actionButtonText}>Visit Our Website</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}>© 2024 ESB Healthcare Ltd</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CompanyInfo;
