// components/ReferralPromoCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useReferralContext } from '@/context/ReferralContext';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

const ReferralPromoCard = () => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { shareReferralCode } = useReferralContext();
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: currentColors.surface,
          borderColor: currentColors.border
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="campaign" size={28} color={currentColors.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: currentColors.textPrimary }]}>
            Invite Friends & Earn Points
          </Text>
          <Text style={[styles.description, { color: currentColors.textSecondary }]}>
            Share HealthChat with friends and family to earn bonus points and premium access.
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: currentColors.primary }]}
        onPress={shareReferralCode}
      >
        <AntDesign name="sharealt" size={16} color={currentColors.secondary} />
        <Text style={[styles.buttonText, { color: currentColors.secondary }]}>
          Share Your Code
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReferralPromoCard;