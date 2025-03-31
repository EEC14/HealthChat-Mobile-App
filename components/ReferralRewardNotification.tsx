// components/ReferralRewardNotification.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { FontAwesome6, AntDesign } from '@expo/vector-icons';

interface ReferralRewardNotificationProps {
  visible: boolean;
  onClose: () => void;
  rewardTier: 'pro' | 'deluxe';
}

const ReferralRewardNotification: React.FC<ReferralRewardNotificationProps> = ({
  visible,
  onClose,
  rewardTier,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Get notification message with proper tier and count values
  const getNotificationMessage = () => {
    const tierName = rewardTier === 'pro' ? 'Pro' : 'Deluxe';
    const referralCount = rewardTier === 'pro' ? '10' : '50';
    
    // Use string interpolation instead of t function with interpolation
    return t('referrals.rewardNotification')
      .replace('{tier}', tierName)
      .replace('{count}', referralCount);
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: currentColors.background,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            {rewardTier === 'pro' ? (
              <View style={[styles.iconBadge, { backgroundColor: '#6366F1' }]}>
                <FontAwesome6 name="crown" size={32} color="white" />
              </View>
            ) : (
              <View style={[styles.iconBadge, { backgroundColor: '#8B5CF6' }]}>
                <FontAwesome6 name="gem" size={32} color="white" />
              </View>
            )}
          </View>
          
          <Text style={[styles.title, { color: currentColors.textPrimary }]}>
            {t('referrals.rewardReceived')}
          </Text>
          
          <Text style={[styles.message, { color: currentColors.textSecondary }]}>
            {getNotificationMessage()}
          </Text>
          
          <View 
            style={[
              styles.rewardCard, 
              { 
                backgroundColor: currentColors.surface,
                borderColor: rewardTier === 'pro' ? '#6366F1' : '#8B5CF6',
              }
            ]}
          >
            <FontAwesome6 
              name={rewardTier === 'pro' ? 'crown' : 'gem'} 
              size={20} 
              color={rewardTier === 'pro' ? '#6366F1' : '#8B5CF6'} 
            />
            <Text style={[styles.rewardText, { color: currentColors.textPrimary }]}>
              {rewardTier === 'pro' 
                ? t('referrals.proAccountFor1Month')
                : t('referrals.deluxeAccountFor1Month')
              }
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: rewardTier === 'pro' ? '#6366F1' : '#8B5CF6' },
            ]}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>
              {t('common.awesome')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dismissButton} onPress={handleClose}>
            <AntDesign name="close" size={20} color={currentColors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    width: '100%',
    marginBottom: 24,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
});

export default ReferralRewardNotification;