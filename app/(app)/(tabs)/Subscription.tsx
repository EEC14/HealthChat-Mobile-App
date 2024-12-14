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
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { MotiView, MotiText } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedLottieView from "lottie-react-native";

import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthContext } from "@/context/AuthContext";
import { Plans } from "@/constants/Plans";

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
      opacity: 0.09,
      zIndex: -1,
    }}
  />
);
const Subscription: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  console.log(user);
  const [selectedPlan, setSelectedPlan] = useState<"Pro" | "Deluxe">("Pro");

  // Animated values for various interactions
  const animationValue = useSharedValue(0);
  const crownScale = useSharedValue(1);
  const gradientAnimation = useSharedValue(0);
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

  const animatedGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${gradientAnimation.value * 360}deg`,
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
      Linking.openURL(data.url);
    } catch (error) {
      console.error("There was an error!", error);
      alert("Failed to redirect to the billing portal.");
    } finally {
      setLoading(false);
    }
  };
  // Interaction handlers
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
      Linking.openURL(link);
    } catch (error) {
      console.error("Subscribe error:", error);
      alert("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gradient Background Component
  const AnimatedGradientBackground = () => {
    return (
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -2,
          },
          animatedGradientStyle,
        ]}
      >
        <LinearGradient
          colors={["#3a11cb", "#2575fc", "#ff9a9e"]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          paddingBottom: 90,
          paddingTop: 40,
        }}
      >
        <GrainBackground />
        <AnimatedGradientBackground />
        <View
          style={{
            paddingHorizontal: 10,
            flex: 1,
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {user?.isPro || user?.isDeluxe ? (
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
                    color: "white",
                    marginTop: 10,
                  }}
                >
                  You're a {user.isPro ? "Pro" : "Deluxe"} Member!
                </MotiText>
                <MotiText
                  from={{ translateY: 20, opacity: 0 }}
                  animate={{ translateY: 0, opacity: 1 }}
                  transition={{ delay: 300 }}
                  className="text-center text-gray-200 "
                >
                  Enjoy unlimited access to all premium features
                </MotiText>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: 20,
                  padding: 20,
                  gap: 30,
                }}
              >
                <View className="flex-col items-center gap-2">
                  <AntDesign name="setting" size={56} color="white" />
                  <View>
                    <Text className="text-lg font-semibold text-gray-100">
                      Manage Your Plan
                    </Text>
                    <Text className="text-sm text-gray-200">
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
                  color: "white",
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
                  color: "#eee",
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
                          ? "white"
                          : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text
                      style={{
                        color: selectedPlan === plan ? "black" : "white",
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
                  backgroundColor: "rgba(255,255,255,0.2)",
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
                      color: "white",
                    }}
                  >
                    ${Plans[selectedPlan].price}
                  </Text>
                  <Text
                    style={{
                      alignSelf: "flex-end",
                      color: "white",
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
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={{ color: "white" }}>{feature}</Text>
                  </MotiView>
                ))}

                {user ? (
                  <TouchableOpacity
                    onPress={handleSubscribe}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 25,
                      paddingVertical: 15,
                      alignItems: "center",
                      marginTop: 15,
                    }}
                  >
                    <Text
                      style={{
                        color: "#6a11cb",
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
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 15,
                      borderRadius: 15,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
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
  );
};

export default Subscription;
