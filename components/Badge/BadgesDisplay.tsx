import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Badge, UserBadges } from '../../types/badge';
import BadgeIcon from './BadgeIcon';
import { BADGES } from '../../utils/badgeService';
import { Theme, useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { auth } from "@/firebase";

interface BadgesDisplayProps {
  userBadges: UserBadges | null;
}

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ userBadges }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
  
    if (!userBadges) {
      return (
        <View style={styles.container}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Badges</Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }]}>
            Sign in to track your badges
          </Text>
        </View>
      );
    }
  
    const handleBadgePress = (badge: Badge) => {
      setSelectedBadge(badge);
      setModalVisible(true);
    };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBadge(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Badges</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
        {Object.values(BADGES).map(badge => (
          <BadgeIcon
            key={badge.id}
            badge={badge}
            earned={userBadges.badges[badge.id]?.earned || false}
            onPress={() => handleBadgePress(badge)}
          />
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {selectedBadge && (
              <>
                <Text style={[styles.badgeName, { color: colors.textPrimary }]}>
                  {selectedBadge.name}
                </Text>
                <Text style={[styles.badgeIcon, { color: colors.primary }]}>
                  {selectedBadge.icon}
                </Text>
                <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                  {selectedBadge.description}
                </Text>
                <Text style={[styles.badgeStatus, { color: colors.primary }]}>
                  {userBadges.badges[selectedBadge.id]?.earned 
                    ? `Earned: ${userBadges.badges[selectedBadge.id].earnedAt?.toDateString() || 'Yes'}` 
                    : 'Not earned yet'}
                </Text>
                <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.secondary }]}
                onPress={closeModal}
                >
                    <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  badgesRow: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeIcon: {
    fontSize: 60,
    marginVertical: 15,
  },
  badgeDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  badgeStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BadgesDisplay;