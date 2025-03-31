// components/ReferralRewardsTiers.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';

// Define reward tiers constants
const PRO_TIER_THRESHOLD = 10;
const DELUXE_TIER_THRESHOLD = 50;

interface ReferralRewardsTiersProps {
  userStats: {
    totalReferred: number;
    rewards?: Array<{
      tier: string;
      reward: string;
      timestamp: Date;
    }>;
  } | null;
}

const ReferralRewardsTiers: React.FC<ReferralRewardsTiersProps> = ({ userStats }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  
  // Check if user has received rewards
  const hasProReward = userStats?.rewards?.some(r => r.tier === 'PRO_TIER') || false;
  const hasDeluxeReward = userStats?.rewards?.some(r => r.tier === 'DELUXE_TIER') || false;
  
  // Calculate progress towards next tier
  const totalReferred = userStats?.totalReferred || 0;
  const proTierProgress = Math.min(totalReferred / PRO_TIER_THRESHOLD, 1);
  const deluxeTierProgress = Math.min(totalReferred / DELUXE_TIER_THRESHOLD, 1);
  
  return (
    <View 
      style={[
        styles.rewardsContainer, 
        { backgroundColor: currentColors.surface, borderColor: currentColors.border }
      ]}
    >
      <Text style={[styles.rewardsTitle, { color: currentColors.textPrimary }]}>
        {t('referrals.rewardsTitle')}
      </Text>
      <Text style={[styles.rewardsSubtitle, { color: currentColors.textSecondary }]}>
        {t('referrals.rewardsSubtitle')}
      </Text>
      
      {/* Pro Tier */}
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
              {t('referrals.proTierTitle')}
            </Text>
            <Text style={[styles.tierSubtitle, { color: currentColors.textSecondary }]}>
              {t('referrals.proTierSubtitle')}
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
              {hasProReward ? t('referrals.rewardReceived') : t('referrals.yourProgress')}
            </Text>
            
            {!hasProReward && (
              <Text style={[styles.progressText, { color: currentColors.textSecondary }]}>
                {totalReferred}/{PRO_TIER_THRESHOLD}
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
          
          {hasProReward ? (
            <View style={styles.rewardInfo}>
              <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
              <Text style={[styles.rewardText, { color: '#4CAF50' }]}>
                {t('referrals.proAccountFor1Month')}
              </Text>
            </View>
          ) : (
            <View style={styles.requirementValue}>
              <MaterialIcons name="people" size={18} color={currentColors.primary} />
              <Text style={[styles.requirementNumber, { color: currentColors.textPrimary }]}>
                {PRO_TIER_THRESHOLD}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Deluxe Tier */}
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
              {t('referrals.deluxeTierTitle')}
            </Text>
            <Text style={[styles.tierSubtitle, { color: currentColors.textSecondary }]}>
              {t('referrals.deluxeTierSubtitle')}
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
              {hasDeluxeReward ? t('referrals.rewardReceived') : t('referrals.yourProgress')}
            </Text>
            
            {!hasDeluxeReward && (
              <Text style={[styles.progressText, { color: currentColors.textSecondary }]}>
                {totalReferred}/{DELUXE_TIER_THRESHOLD}
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
          
          {hasDeluxeReward ? (
            <View style={styles.rewardInfo}>
              <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
              <Text style={[styles.rewardText, { color: '#4CAF50' }]}>
                {t('referrals.deluxeAccountFor1Month')}
              </Text>
            </View>
          ) : (
            <View style={styles.requirementValue}>
              <MaterialIcons name="people" size={18} color={currentColors.primary} />
              <Text style={[styles.requirementNumber, { color: currentColors.textPrimary }]}>
                {DELUXE_TIER_THRESHOLD}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rewardsContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardsSubtitle: {
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
  requirementValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  rewardBadge: {
    marginLeft: 8,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ReferralRewardsTiers;