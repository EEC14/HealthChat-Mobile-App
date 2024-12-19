import React, { useState, useRef, useEffect } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Pressable,
  ImageBackground,
  ScrollView,
  RefreshControl,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
} from "react-native-reanimated";
import { MotiView, MotiText } from "moti";
import AnimatedLottieView from "lottie-react-native";

import { WebView } from "react-native-webview";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthContext } from "@/context/AuthContext";
import { Plans } from "@/constants/Plans";
import ExternalLinkHandler from "@/components/Layout/ExternalLinkHandler";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";

// Grain effect component
const GrainBackground = () => (
  <ImageBackground
    source={require("@/assets/images/grain-texture.png")}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.13,
      zIndex: -1,
    }}
  />
);
const Subscription: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const currentColors = Colors[theme];
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, fetchUserDetails } = useAuthContext();

  const [selectedPlan, setSelectedPlan] = useState<"Pro" | "Deluxe">("Pro");
  const handleOpenLink = (url: string) => {
    setWebviewUrl(url);
    setWebviewVisible(true);
  };

  const closeWebview = () => {
    setWebviewVisible(false);
    setWebviewUrl("");
  };

  const crownScale = useSharedValue(1);
  const lottieRef = useRef(null);

  // Animated styles
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
      const response = await fetch(
        "https://healthchat-patient.esbhealthcare.com/.netlify/functions/billingportal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: user?.stripeCustomerId,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      handleOpenLink(data.url);
      // Linking.openURL(data.url);
    } catch (error) {
      console.error("There was an error!", error);
      alert("Failed to redirect to the billing portal.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: "Pro" | "Deluxe") => {
    setSelectedPlan(plan);
    crownScale.value = withSpring(1.2);
    setTimeout(() => {
      if (lottieRef.current) {
        lottieRef.current?.play();
      }
    }, 0);
  };
  const handleSubscribe = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const link = `${Plans[selectedPlan]?.link}?prefilled_email=${user.email}`;
      if (!link) throw new Error("Plan link is undefined");
      const supported = await Linking.canOpenURL(link);
      if (!supported) throw new Error("Cannot open the URL");
      // console.log("Opened link:", link);
      handleOpenLink(link);
      // Linking.openURL(link);
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
      await fetchUserDetails(); // Refresh user details
    } catch (error) {
      console.error("Error refreshing user details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <View>
        <ExternalLinkHandler
          visible={webviewVisible}
          url={webviewUrl}
          onClose={closeWebview}
        />
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: currentColors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "transparent",
            paddingBottom: 90,
            paddingTop: 40,
          }}
        >
          <View
            style={{
              paddingHorizontal: 10,
              flex: 1,
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {user?.isPro || !user?.isDeluxe ? (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
                style={{ alignItems: "center", gap: 30 }}
              >
                <View style={{ alignItems: "center", gap: 2 }}>
                  <Animated.View style={animatedCrownStyle}>
                    <FontAwesome6 name="crown" size={64} color="gold" />
                  </Animated.View>
                  <MotiText
                    from={{ translateY: 20, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ delay: 200 }}
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: currentColors.textPrimary,
                      marginTop: 10,
                    }}
                  >
                    You're a {user.isPro ? "Pro" : "Deluxe"} Member!
                  </MotiText>
                  <MotiText
                    from={{ translateY: 20, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    transition={{ delay: 300 }}
                    style={{ color: currentColors.textSecondary }}
                  >
                    Enjoy unlimited access to all premium features
                  </MotiText>
                </View>

                <View
                  style={{
                    backgroundColor: currentColors.surface,
                    borderRadius: 20,
                    padding: 20,
                    gap: 30,
                  }}
                >
                  <View className="flex-col items-center gap-2">
                    <AntDesign
                      name="setting"
                      size={56}
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
                        className="text-sm "
                        style={{ color: currentColors.textSecondary }}
                      >
                        Easily upgrade, downgrade, or cancel your subscription.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    disabled={loading}
                    onPress={handleManageBilling}
                    className="flex-row items-center justify-center gap-2 py-4 bg-blue-600 rounded-lg"
                  >
                    <Text className="text-lg font-medium text-white ">
                      {loading ? "Loading" : "Go to Dashboard"}
                    </Text>
                    {loading ? (
                      <ActivityIndicator
                        animating={loading}
                        size="small"
                        color="#fff"
                      />
                    ) : (
                      <AntDesign name="arrowright" size={24} color="white" />
                    )}
                    View{" "}
                  </TouchableOpacity>
                </View>
              </MotiView>
            ) : (
              <View style={{ width: "100%", paddingHorizontal: 20 }}>
                <MotiText
                  from={{ opacity: 0, translateY: -20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: currentColors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Upgrade Your Plan
                </MotiText>
                <MotiText
                  from={{ opacity: 0, translateY: -20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    fontSize: 14,
                    textAlign: "center",
                    color: currentColors.textSecondary,
                    marginBottom: 20,
                  }}
                >
                  Choose the plan that best fits your wellness journey.
                </MotiText>
                {/* Plan Selection */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {Object.keys(Plans).map((plan) => (
                    <Pressable
                      key={plan}
                      onPress={() => handlePlanSelect(plan as "Pro" | "Deluxe")}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        marginHorizontal: 5,
                        borderRadius: 20,
                        backgroundColor:
                          selectedPlan === plan
                            ? "#1E3A8A"
                            : currentColors.surface,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            selectedPlan === plan
                              ? "white"
                              : currentColors.textPrimary,
                          fontWeight: "bold",
                        }}
                      >
                        {plan}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Lottie Animation */}
                <View
                  style={{
                    alignItems: "center",
                    marginBottom: 20,
                    position: "absolute",
                    height: 800,
                    width: 400,
                    top: "0%",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    backgroundColor: "transparent",
                    zIndex: -1,
                  }}
                >
                  <AnimatedLottieView
                    ref={lottieRef}
                    source={require("@/assets/subscription-animation.json")}
                    autoPlay={true}
                    loop={false}
                    style={{ width: 300, height: 1000 }}
                  />
                </View>

                {/* Subscription Details */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 }}
                  style={{
                    backgroundColor: currentColors.surface,
                    borderRadius: 20,
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      marginBottom: 15,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 36,
                        fontWeight: "bold",
                        color: currentColors.textPrimary,
                      }}
                    >
                      ${Plans[selectedPlan].price}
                    </Text>
                    <Text
                      style={{
                        alignSelf: "flex-end",
                        color: currentColors.textPrimary,
                        marginLeft: 5,
                      }}
                    >
                      /month
                    </Text>
                  </View>

                  {Plans[selectedPlan].features.map((feature, index) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 400 + index * 100 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <MaterialIcons
                        name="check"
                        size={24}
                        color={currentColors.textPrimary}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={{ color: currentColors.textPrimary }}>
                        {feature}
                      </Text>
                    </MotiView>
                  ))}

                  {user ? (
                    <TouchableOpacity
                      onPress={handleSubscribe}
                      style={{
                        backgroundColor: "#1E3A8A",
                        borderRadius: 25,
                        paddingVertical: 15,
                        alignItems: "center",
                        marginTop: 15,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          fontSize: 18,
                        }}
                      >
                        {loading ? "Processing..." : "Subscribe Now"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        backgroundColor: currentColors.surface,
                        padding: 15,
                        borderRadius: 15,
                      }}
                    >
                      <Text
                        style={{
                          color: currentColors.textPrimary,
                          textAlign: "center",
                        }}
                      >
                        Please log in to upgrade your plan
                      </Text>
                    </View>
                  )}
                </MotiView>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Overlay with transparency
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  modalText: {
    color: "black",
    fontSize: 16,
    marginBottom: 10,
  },
  closeText: {
    color: "blue",
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    zIndex: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: "#000",
  },
  loader: {
    marginRight: 10,
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
export default Subscription;
