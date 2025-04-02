// AccountModel.tsx with normal text instead of translations
import { Colors } from "@/constants/Colors";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useReferralContext } from "@/context/ReferralContext"; // Import referral context
import {
  AntDesign,
  FontAwesome6,
  MaterialCommunityIcons,
  Octicons,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Pressable,
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  Alert,
  Animated,
  Share,
  TextInput,
} from "react-native";
import { useLanguage } from '../../utils/useLanguage';
import { useTranslation } from 'react-i18next';
import { validateReferralCodeFormat } from '../../utils/referralUtils';

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

  // Referral related states and hooks
  const {
    userReferralStats,
    loading: referralLoading,
    error: referralError,
    referralCode,
    shareReferralCode,
    refreshReferralData,
    applyReferralCode,
    rewardNotification,
    clearRewardNotification
  } = useReferralContext();
  
  const [copyAnimation] = useState(new Animated.Value(0));
  const [referralSection, setReferralSection] = useState<'summary'|'details'|'apply'>('summary');
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Animation for copy button
  const startCopyAnimation = () => {
    copyAnimation.setValue(0);
    Animated.timing(copyAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  };

  // Refresh referral data when modal opens
  useEffect(() => {
    if (modalVisible) {
      refreshReferralData();
    }
  }, [modalVisible]);

  const handleCopyCode = async () => {
    if (!referralCode) return;
    
    await Clipboard.setString(referralCode);
    startCopyAnimation();
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };
  
  const handleApplyCode = async () => {
    if (!inputCode) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }
    
    if (!validateReferralCodeFormat(inputCode)) {
      Alert.alert('Error', 'Invalid referral code format');
      return;
    }
    
    setIsApplying(true);
    try {
      const success = await applyReferralCode(inputCode);
      if (success) {
        setInputCode('');
        setReferralSection('summary');
        await refreshReferralData();
      }
    } finally {
      setIsApplying(false);
    }
  };

  // Calculate progress towards rewards
  const calculateProgress = (total: number, target: number) => {
    return Math.min(total / target, 1);
  };

  const proTierProgress = calculateProgress(userReferralStats?.totalReferred || 0, 10);
  const deluxeTierProgress = calculateProgress(userReferralStats?.totalReferred || 0, 50);
  
  // Check if user has received rewards
  const hasProReward = userReferralStats?.rewards?.some(r => r.tier === 'PRO_TIER') || false;
  const hasDeluxeReward = userReferralStats?.rewards?.some(r => r.tier === 'DELUXE_TIER') || false;

  // For reward notification
  const getRewardNotificationMessage = () => {
    if (rewardNotification === 'pro') {
      return "You've been upgraded to Pro for referring 10 friends!";
    } else if (rewardNotification === 'deluxe') {
      return "You've been upgraded to Deluxe for referring 50 friends!";
    }
    return "";
  };

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
              {t('layout.accountModel.profile')}
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
                {t('layout.accountModel.account')}
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

              {/* Referral Section */}
              <View style={styles.sectionHeader}>
                <Text
                  style={{
                    fontWeight: "900",
                    fontSize: 16,
                    color: currentColors.textPrimary,
                  }}
                >
                  Refer Friends
                </Text>
                
                {referralSection !== 'summary' && (
                  <TouchableOpacity 
                    onPress={() => setReferralSection('summary')}
                    style={styles.backButton}
                  >
                    <AntDesign name="arrowleft" size={16} color={currentColors.textSecondary} />
                    <Text style={{ color: currentColors.textSecondary, fontSize: 14 }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Referral Content based on selected section */}
              <View
                style={[
                  styles.referralBox,
                  { backgroundColor: currentColors.background },
                ]}
              >
                {referralLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={currentColors.primary} />
                    <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
                      Loading referral data...
                    </Text>
                  </View>
                ) : referralError ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: 'red' }]}>
                      {referralError}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.retryButton, { backgroundColor: currentColors.primary }]}
                      onPress={refreshReferralData}
                    >
                      <Text style={[styles.retryText, { color: currentColors.secondary }]}>
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* Summary View */}
                    {referralSection === 'summary' && (
                      <>
                        <View style={styles.referralStats}>
                          <View style={styles.statItem}>
                            <MaterialIcons name="people" size={20} color={currentColors.primary} />
                            <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
                              {userReferralStats?.totalReferred || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>
                              Friends Referred
                            </Text>
                          </View>

                          <View style={styles.statItem}>
                            <FontAwesome name="diamond" size={20} color="#FFD700" />
                            <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
                              {userReferralStats?.pointsEarned || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>
                              Points Earned
                            </Text>
                          </View>
                        </View>

                        <View style={styles.codeSection}>
                          <Text style={[styles.codeLabel, { color: currentColors.textSecondary }]}>
                            Your Referral Code:
                          </Text>
                          <View style={styles.codeWrapper}>
                            <Text style={[styles.codeText, { color: currentColors.textPrimary }]}>
                              {referralCode || '-'}
                            </Text>
                            <TouchableOpacity 
                              style={[styles.copyButton, { backgroundColor: currentColors.primary + '20' }]}
                              onPress={handleCopyCode}
                            >
                              <Animated.View
                                style={{
                                  opacity: copyAnimation.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [1, 0, 1],
                                  }),
                                }}
                              >
                                <MaterialIcons name="content-copy" size={16} color={currentColors.primary} />
                              </Animated.View>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.referralActions}>
                          <TouchableOpacity 
                            style={[styles.shareButton, { backgroundColor: currentColors.primary }]}
                            onPress={shareReferralCode}
                          >
                            <AntDesign name="sharealt" size={16} color={currentColors.secondary} />
                            <Text style={[styles.buttonText, { color: currentColors.secondary }]}>
                              Share Your Code
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.moreButton, { borderColor: currentColors.border }]}
                            onPress={() => setReferralSection('details')}
                          >
                            <Text style={[styles.moreButtonText, { color: currentColors.textPrimary }]}>
                              View Details
                            </Text>
                            <AntDesign name="arrowright" size={16} color={currentColors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.applyCodeLink}
                          onPress={() => setReferralSection('apply')}
                        >
                          <Text style={{ color: currentColors.primary, fontSize: 14 }}>
                            Have a Referral Code?
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {/* Details View */}
                    {referralSection === 'details' && (
                      <>
                        <Text style={[styles.detailsTitle, { color: currentColors.textPrimary }]}>
                          Referral Rewards
                        </Text>
                        <Text style={[styles.detailsSubtitle, { color: currentColors.textSecondary }]}>
                          Refer friends and earn premium account access. The more friends you refer, the better the rewards!
                        </Text>
                        
                        {/* Pro Tier Card */}
                        <View 
                          style={[
                            styles.tierCard, 
                            { 
                              borderColor: currentColors.border,
                              backgroundColor: hasProReward ? 'rgba(99, 102, 241, 0.1)' : currentColors.surface 
                            }
                          ]}
                        >
                          <View style={styles.tierHeader}>
                            <View style={[styles.tierBadge, { backgroundColor: '#6366F1' }]}>
                              <FontAwesome6 name="crown" size={20} color="white" />
                            </View>
                            <View style={styles.tierInfo}>
                              <Text style={[styles.tierTitle, { color: currentColors.textPrimary }]}>
                                Pro Account (1 Month)
                              </Text>
                              <Text style={[styles.tierSubtitle, { color: currentColors.textSecondary }]}>
                                Refer 10 friends and get a Pro account for one month
                              </Text>
                            </View>
                            
                            {hasProReward && (
                              <View style={styles.rewardBadge}>
                                <MaterialIcons name="verified" size={20} color="#4CAF50" />
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.tierRequirement}>
                            <View style={styles.progressSection}>
                              <Text style={[styles.requirementText, { color: currentColors.textSecondary }]}>
                                {hasProReward ? "Reward Received!" : "Your Progress"}
                              </Text>
                              
                              {!hasProReward && (
                                <Text style={[styles.progressText, { color: currentColors.textSecondary }]}>
                                  {userReferralStats?.totalReferred || 0}/10
                                </Text>
                              )}
                            </View>
                            
                            {!hasProReward && (
                              <View 
                                style={[
                                  styles.progressBarContainer, 
                                  { backgroundColor: currentColors.border }
                                ]}
                              >
                                <View 
                                  style={[
                                    styles.progressBar, 
                                    { 
                                      backgroundColor: '#6366F1',
                                      width: `${proTierProgress * 100}%` 
                                    }
                                  ]}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                        
                        {/* Deluxe Tier Card */}
                        <View 
                          style={[
                            styles.tierCard, 
                            { 
                              borderColor: currentColors.border,
                              backgroundColor: hasDeluxeReward ? 'rgba(139, 92, 246, 0.1)' : currentColors.surface 
                            }
                          ]}
                        >
                          <View style={styles.tierHeader}>
                            <View style={[styles.tierBadge, { backgroundColor: '#8B5CF6' }]}>
                              <FontAwesome6 name="gem" size={20} color="white" />
                            </View>
                            <View style={styles.tierInfo}>
                              <Text style={[styles.tierTitle, { color: currentColors.textPrimary }]}>
                                Deluxe Account (1 Month)
                              </Text>
                              <Text style={[styles.tierSubtitle, { color: currentColors.textSecondary }]}>
                                Refer 50 friends and get a Deluxe account for one month
                              </Text>
                            </View>
                            
                            {hasDeluxeReward && (
                              <View style={styles.rewardBadge}>
                                <MaterialIcons name="verified" size={20} color="#4CAF50" />
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.tierRequirement}>
                            <View style={styles.progressSection}>
                              <Text style={[styles.requirementText, { color: currentColors.textSecondary }]}>
                                {hasDeluxeReward ? "Reward Received!" : "Your Progress"}
                              </Text>
                              
                              {!hasDeluxeReward && (
                                <Text style={[styles.progressText, { color: currentColors.textSecondary }]}>
                                  {userReferralStats?.totalReferred || 0}/50
                                </Text>
                              )}
                            </View>
                            
                            {!hasDeluxeReward && (
                              <View 
                                style={[
                                  styles.progressBarContainer, 
                                  { backgroundColor: currentColors.border }
                                ]}
                              >
                                <View 
                                  style={[
                                    styles.progressBar, 
                                    { 
                                      backgroundColor: '#8B5CF6',
                                      width: `${deluxeTierProgress * 100}%` 
                                    }
                                  ]}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                        
                        {/* How It Works Section */}
                          <Text style={[styles.howItWorksTitle, { color: currentColors.textPrimary }]}>
                            How It Works
                          </Text>

                          <View style={styles.stepContainer}>
                            <View style={[styles.stepBadge, { backgroundColor: currentColors.primary }]}>
                              <Text style={[styles.stepNumber, { color: currentColors.secondary }]}>1</Text>
                            </View>
                            <View style={styles.stepTextContainer}>
                              <Text style={[styles.stepTitle, { color: currentColors.textPrimary }]}>
                                Share Your Code
                              </Text>
                              <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                                Share your unique referral code with friends and family via social media or messaging apps.
                              </Text>
                            </View>
                          </View>

                          <View style={styles.stepContainer}>
                            <View style={[styles.stepBadge, { backgroundColor: currentColors.primary }]}>
                              <Text style={[styles.stepNumber, { color: currentColors.secondary }]}>2</Text>
                            </View>
                            <View style={styles.stepTextContainer}>
                              <Text style={[styles.stepTitle, { color: currentColors.textPrimary }]}>
                                Friends Sign Up
                              </Text>
                              <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                                When they create an account using your code, they'll receive a 1-week Deluxe trial and 50 bonus points.
                              </Text>
                            </View>
                          </View>

                          <View style={styles.stepContainer}>
                            <View style={[styles.stepBadge, { backgroundColor: currentColors.primary }]}>
                              <Text style={[styles.stepNumber, { color: currentColors.secondary }]}>3</Text>
                            </View>
                            <View style={styles.stepTextContainer}>
                              <Text style={[styles.stepTitle, { color: currentColors.textPrimary }]}>
                                Earn Rewards
                              </Text>
                              <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                                You'll earn 100 points for each friend who signs up with your code. Refer 10 friends to get Pro access for 1 month, or 50 friends for Deluxe access!
                              </Text>
                            </View>
                          </View>

                          {/* Rewards Explanation Box */}
                          <View style={[
                            styles.rewardsBox, 
                            { 
                              backgroundColor: currentColors.primary + '10', 
                              borderColor: currentColors.primary + '30'
                            }
                          ]}>
                            <Text style={[styles.rewardsBoxTitle, { color: currentColors.textPrimary }]}>
                              Referral Rewards
                            </Text>
                            
                            <View style={styles.rewardItem}>
                              <Text style={[styles.rewardLabel, { color: currentColors.textPrimary }]}>
                                For your friends:
                              </Text>
                              <Text style={[styles.rewardValue, { color: currentColors.textSecondary }]}>
                                • 1-week Deluxe membership trial
                              </Text>
                              <Text style={[styles.rewardValue, { color: currentColors.textSecondary }]}>
                                • 50 bonus points
                              </Text>
                            </View>
                            
                            <View style={[styles.rewardItem, { marginTop: 8 }]}>
                              <Text style={[styles.rewardLabel, { color: currentColors.textPrimary }]}>
                                For you:
                              </Text>
                              <Text style={[styles.rewardValue, { color: currentColors.textSecondary }]}>
                                • 100 points per successful referral
                              </Text>
                              <Text style={[styles.rewardValue, { color: currentColors.textSecondary }]}>
                                • Pro account for 1 month (10 referrals)
                              </Text>
                              <Text style={[styles.rewardValue, { color: currentColors.textSecondary }]}>
                                • Deluxe account for 1 month (50 referrals)
                              </Text>
                            </View>
                            
                            <Text style={[styles.rewardNote, { color: currentColors.textSecondary }]}>
                              Note: Each user can only use one referral code, either during signup or later in their account.
                            </Text>
                          </View>
                      </>
                    )}
                    
                    {/* Apply Code View */}
                    {referralSection === 'apply' && (
                      <>
                        <Text style={[styles.applyTitle, { color: currentColors.textPrimary }]}>
                          Have a Referral Code?
                        </Text>
                        <Text style={[styles.applySubtitle, { color: currentColors.textSecondary }]}>
                          Enter your friend's referral code below to earn bonus points.
                        </Text>
                        
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={[
                              styles.codeInput,
                              { 
                                backgroundColor: currentColors.surface, 
                                borderColor: currentColors.border,
                                color: currentColors.textPrimary
                              }
                            ]}
                            placeholder="Enter referral code"
                            placeholderTextColor={currentColors.textSecondary}
                            value={inputCode}
                            onChangeText={setInputCode}
                            autoCapitalize="characters"
                            maxLength={6}
                          />
                          <TouchableOpacity
                            style={[
                              styles.applyButton,
                              { backgroundColor: currentColors.primary, opacity: isApplying ? 0.7 : 1 }
                            ]}
                            onPress={handleApplyCode}
                            disabled={isApplying || !inputCode}
                          >
                            {isApplying ? (
                              <ActivityIndicator size="small" color={currentColors.secondary} />
                            ) : (
                              <Text style={[styles.applyButtonText, { color: currentColors.secondary }]}>
                                Apply
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 16,
                  color: currentColors.textPrimary,
                }}
              >
                {t('layout.accountModel.plan')}
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
                    onPress={() => {
                          setModalVisible(false);
                          router.push("/(app)/(tabs)/Subscription");
                    }}
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
                    onPress={() => {
                          setModalVisible(false);
                          router.push("/(app)/(tabs)/Subscription");
                    }}
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
      
      {/* Reward Notification */}
      {rewardNotification && (
        <Modal
          visible={rewardNotification !== null}
          transparent
          animationType="fade"
          onRequestClose={clearRewardNotification}
        >
          <View style={styles.notificationOverlay}>
            <View style={[styles.notificationContainer, { backgroundColor: currentColors.background }]}>
              <View style={styles.notificationIconContainer}>
                {rewardNotification === 'pro' ? (
                  <View style={{ backgroundColor: '#6366F1', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome6 name="crown" size={32} color="white" />
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#8B5CF6', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome6 name="gem" size={32} color="white" />
                  </View>
                )}
              </View>
              
              <Text style={[styles.notificationTitle, { color: currentColors.textPrimary }]}>
                Reward Received!
              </Text>
              
              <Text style={[styles.notificationMessage, { color: currentColors.textSecondary }]}>
                {getRewardNotificationMessage()}
              </Text>
              
              <View 
                style={[
                   
                  { 
                    backgroundColor: currentColors.surface,
                    borderColor: rewardNotification === 'pro' ? '#6366F1' : '#8B5CF6',
                    borderWidth: 2,
                    padding: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 24,
                    width: '100%'
                  }
                ]}
              >
                <FontAwesome6 
                  name={rewardNotification === 'pro' ? 'crown' : 'gem'} 
                  size={20} 
                  color={rewardNotification === 'pro' ? '#6366F1' : '#8B5CF6'} 
                />
                <Text style={[ { color: currentColors.textPrimary, marginLeft: 12, fontSize: 16, fontWeight: '600' }]}>
                  {rewardNotification === 'pro' ? 'Pro Account for 1 Month' : 'Deluxe Account for 1 Month'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  
                  { 
                    backgroundColor: rewardNotification === 'pro' ? '#6366F1' : '#8B5CF6',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    width: '100%',
                    alignItems: 'center'
                  },
                ]}
                onPress={clearRewardNotification}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Awesome!
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ position: 'absolute', top: 12, right: 12, padding: 6 }}
                onPress={clearRewardNotification}
              >
                <AntDesign name="close" size={20} color={currentColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  rewardsBox: {
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  rewardsBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardItem: {
    marginTop: 8,
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
  },
  rewardNote: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
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
  
  // Referral section styles
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referralBox: {
    width: "100%",
    borderRadius: 10,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  referralStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  codeSection: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
  },
  referralActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
  },
  moreButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  applyCodeLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  
  // Details view styles
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  tierCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tierSubtitle: {
    fontSize: 14,
  },
  tierRequirement: {
    marginTop: 4,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 14,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  rewardBadge: {
    marginLeft: 8,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Apply code section styles
  applyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  applySubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  applyButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Notification modal styles
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  notificationIconContainer: {
    marginBottom: 16,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  notificationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  }
});