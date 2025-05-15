import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
} from "react-native-reanimated";
import { MotiView, MotiText } from "moti";
import AnimatedLottieView from "lottie-react-native";
import LottieView from "lottie-react-native";
import { Alert } from 'react-native';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthContext } from "@/context/AuthContext";
import { Plans } from "@/constants/Plans";
import ExternalLinkHandler from "@/components/Layout/ExternalLinkHandler";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { usePurchases } from "@/context/PurchaseContext";
import Paywall, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from "react-native-purchases";
import { useTranslation } from 'react-i18next';

const Subscription: React.FC = () => {
  const { currentOffering, handlePurchase } = usePurchases();
  const { theme, toggleTheme } = useTheme();
  const currentColors = Colors[theme];
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, fetchUserDetails, logout } = useAuthContext();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "deluxe" | "ProYearly" | "DeluxeYearly">("pro");
  const handleOpenLink = (url: string) => {
    setWebviewUrl(url);
    setWebviewVisible(true);
  };

  const closeWebview = () => {
    setWebviewVisible(false);
    setWebviewUrl("");
  };

  const crownScale = useSharedValue(1);
  const lottieRef = useRef<LottieView>(null);

  const animatedCrownStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSpring(crownScale.value, { damping: 2 }),
            -1,
            true
          ),
        },
      ],
    };
  });

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      if (Platform.OS === "ios") {
        const link = `https://apps.apple.com/account/subscriptions`;
        if (!link) throw new Error("Plan link is undefined");
        const supported = await Linking.canOpenURL(link);
        if (!supported) throw new Error("Cannot open the URL");
        handleOpenLink(link);
      } else if (Platform.OS === "android") {
        const link = `https://play.google.com/store/account/subscriptions`;
        if (!link) throw new Error("Plan link is undefined");
        const supported = await Linking.canOpenURL(link);
        if (!supported) throw new Error("Cannot open the URL");
        handleOpenLink(link);
      }
    } catch (error) {
      console.error("There was an error!", error);
      alert("Failed to redirect to the billing portal.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const currentUser = auth.currentUser;
              
              if (!currentUser) {
                throw new Error('No user found');
              }
              await deleteDoc(doc(db, "users", currentUser.uid));
              await deleteUser(currentUser);
              await logout();
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again later."
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  const handlePlanSelect = (plan: "pro" | "deluxe" | "ProYearly" | "DeluxeYearly") => {
    setSelectedPlan(plan);
    crownScale.value = withSpring(1.2);
    setTimeout(() => {
      if (lottieRef.current) {
        lottieRef.current.play();
      }
    }, 0);
  };
  const handleSubscribe = async (plan?: "pro" | "deluxe" | "ProYearly" | "DeluxeYearly") => {
    try {
      setLoading(true);
      if (!user) return;
      const result: PAYWALL_RESULT = await Paywall.presentPaywall({
        displayCloseButton: true,
        offering: plan
          ? currentOffering![plan]
          : currentOffering![selectedPlan],
      });
      if (result === PAYWALL_RESULT.PURCHASED) {
        await handlePurchase(
          currentOffering![selectedPlan.toLowerCase()].availablePackages[0]
        );
        alert("Purchased successfully");
      } else if (result === PAYWALL_RESULT.CANCELLED) {
        alert("Purchase cancelled");
      } else if (result === PAYWALL_RESULT.ERROR) {
        alert("Error occurred during purchase");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      alert("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserDetails();
    } catch (error) {
      console.error("Error refreshing user details:", error);
    } finally {
      setRefreshing(false);
    }
  };
  const handleProfileWeb = () => {
    Linking.openURL("https://healthchat-patient.esbhealthcare.com/profile");
  };
  const openTerms = () => {
    Linking.openURL('https://healthchat-patient.esbhealthcare.com/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://healthchat-patient.esbhealthcare.com/privacy');
  };

  const formatTrialTimeRemaining = (expiryDateString: string) => {
    const expiryDate = new Date(expiryDateString);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = expiryDate.getTime() - now.getTime();
    
    // If already expired
    if (diffTime <= 0) return "Expired";
    
    // Calculate days, hours, minutes
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining`;
    }
  };

// … your existing imports and function definitions stay exactly the same :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}

// … your existing imports/hooks/functions remain unchanged
return (
  <>
    {/* keep your webview/modal wrapper */}
    <ExternalLinkHandler
      visible={webviewVisible}
      url={webviewUrl}
      onClose={closeWebview}
    />

    <ScrollView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── ACCOUNT INFO ── */}
      <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
        <Text style={[styles.cardTitle, { color: currentColors.textSecondary }]}>
          {t('layout.accountModel.account')}
        </Text>
        <View style={styles.infoRow}>
          <AntDesign name="user" size={20} color={currentColors.iconDefault} />
          <Text style={[styles.infoText, { color: currentColors.textPrimary }]}>
            {user?.email ?? '—'}
          </Text>
        </View>
      </View>

      {/* ── SUBSCRIPTION STATUS vs UPGRADE ── */}
      {user?.isPro || user?.isDeluxe ? (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          style={[
            styles.card,
            styles.centered,
            { backgroundColor: currentColors.surface },
          ]}
        >
          <Animated.View style={[styles.crown, animatedCrownStyle]}>
            <FontAwesome6 name="crown" size={48} color={currentColors.primary} />
          </Animated.View>
          <Text style={[styles.statusTitle, { color: currentColors.textPrimary }]}>
            {`You're a ${user.isPro ? 'Pro' : 'Deluxe'} Member`}
          </Text>
          {(user.subscriptionSource === 'referral_trial' ||
            user.subscriptionSource === 'referral_reward') && (
            <Text style={[styles.statusSubtitle, { color: currentColors.textSecondary }]}>
              {user.subscriptionSource === 'referral_trial'
                ? formatTrialTimeRemaining(user.deluxeExpiresAt!)
                : formatTrialTimeRemaining(user.proExpiresAt!)}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: currentColors.primary }]}
            onPress={handleManageBilling}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={currentColors.background} />
            ) : (
              <Text style={[styles.actionText, { color: currentColors.background }]}>
                {t('layout.accountModel.manage')}
              </Text>
            )}
          </TouchableOpacity>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          style={[styles.card, { backgroundColor: currentColors.surface }]}
        >
          <LottieView
            ref={lottieRef}
            source={require('@/assets/subscription-animation.json')}
            autoPlay
            loop={false}
            style={styles.upgradeAnim}
          />
          <Text style={[styles.cardTitle, { color: currentColors.textPrimary, fontSize: 20 }]}>
            {t('layout.accountModel.upgrade')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: currentColors.textSecondary }]}>
            {t('layout.accountModel.choosePlan')}
          </Text>

          {/* Plan Selector */}
          <View style={styles.planTabs}>
            {(Object.keys(Plans) as Array<keyof typeof Plans>).map((plan) => {
              const isSelected = selectedPlan === plan;
              return (
                <Pressable
                  key={plan}
                  onPress={() => handlePlanSelect(plan as any)}
                  style={[
                    styles.planTab,
                    {
                      backgroundColor: isSelected
                        ? currentColors.primary
                        : currentColors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planTabText,
                      {
                        color: isSelected
                          ? currentColors.background
                          : currentColors.textPrimary,
                      },
                    ]}
                  >
                    {Plans[plan].name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Plan Details */}
          <View style={[styles.card, { backgroundColor: currentColors.surface }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: currentColors.textPrimary }]}>
                ${Plans[selectedPlan].price}
              </Text>
              <Text style={[styles.perPeriod, { color: currentColors.textSecondary }]}>
                /month or year
              </Text>
            </View>
            {Plans[selectedPlan].features.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <MaterialIcons
                  name="check"
                  size={20}
                  color={currentColors.primary}
                  style={styles.featureIcon}
                />
                <Text style={[styles.featureText, { color: currentColors.textPrimary }]}>
                  {feature}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentColors.primary }]}
              onPress={() => handleSubscribe(selectedPlan)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={currentColors.background} />
              ) : (
                <Text style={[styles.actionText, { color: currentColors.background }]}>
                  {t('layout.accountModel.subscribe')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      )}

      {/* ── UTILITY ACTIONS ── */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={async () => {
            setLoading(true);
            try { await Purchases.restorePurchases(); alert('Restored'); }
            catch { alert('Restore failed'); }
            finally { setLoading(false); }
          }}
          disabled={loading}
        >
          <AntDesign name="reload1" size={20} color={currentColors.iconDefault} />
          <Text style={[styles.actionRowText, { color: currentColors.textPrimary }]}>
            Restore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={logout}
        >
          <AntDesign name="logout" size={20} color={currentColors.iconDefault} />
          <Text style={[styles.actionRowText, { color: currentColors.textPrimary }]}>
            Logout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={openTerms}
        >
          <Text style={[styles.actionRowText, { color: currentColors.primary }]}>
            Terms
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={openPrivacy}
        >
          <Text style={[styles.actionRowText, { color: currentColors.primary }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={handleProfileWeb}
        >
          <MaterialIcons name="mail" size={20} color={currentColors.iconDefault} />
          <Text style={[styles.actionRowText, { color: currentColors.textPrimary }]}>
            {t('layout.accountModel.mailChange')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.warn }]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="delete-alert"
            size={20}
            color={currentColors.background}
          />
          <Text style={[styles.actionRowText, { color: currentColors.background }]}>
            {t('layout.accountModel.deleteAcc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: currentColors.surface }]}
          onPress={toggleTheme}
        >
          <MaterialCommunityIcons
            name={
              theme === 'light'
                ? 'moon-waning-crescent'
                : 'white-balance-sunny'
            }
            size={20}
            color={currentColors.iconDefault}
          />
          <Text style={[styles.actionRowText, { color: currentColors.textPrimary }]}>
            {t('layout.accountModel.themeChoose')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </>
);
};
const styles = StyleSheet.create({
  container: { flex: 1 },

  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, marginBottom: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 16 },

  centered: { alignItems: 'center', justifyContent: 'center' },
  crown: { marginBottom: 12 },
  statusTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statusSubtitle: { fontSize: 14 },

  upgradeAnim: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 8,
  },

  planTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  planTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  planTabText: { fontSize: 14, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  price: { fontSize: 32, fontWeight: '700' },
  perPeriod: { fontSize: 14, marginLeft: 4 },

  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureIcon: { marginRight: 8 },
  featureText: { fontSize: 14 },

  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '600' },

  actionsContainer: { marginTop: 24, marginHorizontal: 16 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionRowText: { marginLeft: 8, fontSize: 16 },

});

export default Subscription;