// components/SubscriptionExpirationAlert.tsx
import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionExpirationAlertProps {
  isVisible: boolean;
  onClose: () => void;
  expirationDate: Date;
  subscriptionType: 'pro' | 'deluxe';
  source: 'referral_trial' | 'referral_reward';
}

const SubscriptionExpirationAlert: React.FC<SubscriptionExpirationAlertProps> = ({
  isVisible,
  onClose,
  expirationDate,
  subscriptionType,
  source
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  
  useEffect(() => {
    if (isVisible) {
      // Calculate days remaining
      const now = new Date();
      const diffTime = expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [isVisible, expirationDate]);
  
  const handleSubscribe = () => {
    onClose();
    router.push("/(app)/(tabs)/Subscription");
  };
  
  const getMessage = () => {
    if (daysRemaining <= 0) {
      return source === 'referral_trial' 
        ? `Your ${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} trial has ended. Upgrade now to continue enjoying premium features!`
        : `Your ${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} referral reward has expired. Subscribe to keep your premium access!`;
    } else if (daysRemaining === 1) {
      return `Your ${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} membership expires tomorrow! Don't lose your premium features.`;
    } else if (daysRemaining <= 3) {
      return `Your ${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} membership expires in ${daysRemaining} days. Upgrade now to maintain access!`;
    } else {
      return null; // Don't show for more than 3 days remaining
    }
  };
  
  const title = daysRemaining <= 0 
    ? `Your ${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} Access Has Expired` 
    : `${subscriptionType === 'pro' ? 'Pro' : 'Deluxe'} Access Expiring Soon`;
  
  const message = getMessage();
  
  // Don't display if no message (more than 3 days remaining)
  if (!message) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: currentColors.background }]}>
          <View style={styles.iconContainer}>
            {subscriptionType === 'pro' ? (
              <FontAwesome6 name="crown" size={40} color="#FFD700" />
            ) : (
              <FontAwesome6 name="gem" size={40} color="#C576F6" />
            )}
          </View>
          
          <Text style={[styles.title, { color: currentColors.textPrimary }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, { color: currentColors.textSecondary }]}>
            {message}
          </Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.subscribeButton]} 
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeButtonText}>
                Upgrade Now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.laterButton, { borderColor: currentColors.border }]} 
              onPress={onClose}
            >
              <Text style={[styles.laterButtonText, { color: currentColors.textPrimary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: '#1E3A8A',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  laterButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  laterButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SubscriptionExpirationAlert;