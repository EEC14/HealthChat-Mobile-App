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
import { useLanguage } from '../../utils/useLanguage';
import { useTranslation } from 'react-i18next';
const HeaderRight = React.memo(({}: {}) => {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const currentColors = Colors[theme];
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];
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
                    {t('layout.accountModel.featuresFinal')}
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
                        {t('layout.accountModel.modifyPlan')}
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
                      Go Profile
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
                    {t('layout.accountModel.freePlan')}
                  </Text>
                  <Text
                    style={{
                      color: currentColors.textSecondary,
                    }}
                  >
                    {t('layout.accountModel.choosePlan')}
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
                    {t('layout.accountModel.subDetails')}
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
                {t('layout.accountModel.themeChoose')}
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
            <Text
              style={{
                fontWeight: "900",
                fontSize: 16,
                color: currentColors.textPrimary,
              }}
            >
              {t('layout.accountModel.languages.title')}:
            </Text>
            <View style={[styles.languageContainer, { backgroundColor: currentColors.background }]}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor: currentLanguage === lang.code ? currentColors.secondary : currentColors.background,
                      borderColor: currentColors.textSecondary,
                    },
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={{ fontSize: 18, marginRight: 4 }}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageText,
                      {
                        color: currentLanguage === lang.code ? currentColors.primary : currentColors.textPrimary,
                        fontWeight: currentLanguage === lang.code ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {t(`layout.accountModel.languages.${lang.code}`)}
                  </Text>
                </TouchableOpacity>
              ))}
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
  languageContainer: {
    width: '100%',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 16,
  },
});
