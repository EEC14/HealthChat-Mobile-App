import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Theme, useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { shareChallengeToCommunity, createCommunityChallenge } from '../../utils/communityService';
import TagInput from './TagInput';

interface CreateCommunityScreenProps {
  challengeId?: string; // Optional - if provided, we're sharing an existing challenge
  onBack: () => void;
}

export const CreateCommunityScreen: React.FC<CreateCommunityScreenProps> = ({ challengeId, onBack }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [reward, setReward] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const isSharing = !!challengeId;

  const handleCreate = async () => {
    if (isSharing) {
      // We're sharing an existing challenge
      setLoading(true);
      try {
        const communityId = await shareChallengeToCommunity(challengeId, isPublic, tags);
        Alert.alert(
          'Success',
          'Your challenge has been shared with the community!',
          [{ text: 'OK', onPress: onBack }]
        );
      } catch (error) {
        console.error('Error sharing challenge:', error);
        Alert.alert('Error', 'Failed to share challenge. Please try again later.');
      } finally {
        setLoading(false);
      }
    } else {
      // Creating a new community challenge
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title for your challenge.');
        return;
      }
      
      if (!description.trim()) {
        Alert.alert('Error', 'Please enter a description for your challenge.');
        return;
      }
      
      const goalNumber = parseInt(goal, 10);
      if (isNaN(goalNumber) || goalNumber <= 0) {
        Alert.alert('Error', 'Please enter a valid goal number.');
        return;
      }
      
      setLoading(true);
      try {
        const challenge = {
          title: title.trim(),
          description: description.trim(),
          goal: goalNumber,
          currentProgress: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          reward: reward.trim(),
        };
        
        const communityId = await createCommunityChallenge(challenge, tags, isPublic);
        Alert.alert(
          'Success',
          'Your community challenge has been created!',
          [{ text: 'OK', onPress: onBack }]
        );
      } catch (error) {
        console.error('Error creating community challenge:', error);
        Alert.alert('Error', 'Failed to create challenge. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
        padding: 24,
        flexGrow: 1,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    textArea: {
        height: 120,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        marginTop: 24,
        gap: 12,
        paddingBottom: 75
    },
    createButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    });

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        {isSharing ? 'Share Challenge to Community' : 'Create Community Challenge'}
      </Text>

      {!isSharing && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: '#000000' }]}
            placeholder="Give your challenge a catchy name"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.primary, color: '#000000' }]}
            placeholder="Describe your challenge and what it involves"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Goal</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: '#000000' }]}
            placeholder="Number of units to complete (e.g., 30)"
            placeholderTextColor="#999"
            value={goal}
            onChangeText={setGoal}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Reward</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.primary, color: '#000000' }]}
            placeholder="What will participants gain? (optional)"
            placeholderTextColor="#999"
            value={reward}
            onChangeText={setReward}
          />
        </>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Tags</Text>
      <TagInput tags={tags} setTags={setTags} colors={colors} />

      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Make Public</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#d0d0d0', true: colors.primary }}
          thumbColor={isPublic ? '#ffffff' : '#f4f4f4'}
        />
      </View>

      <View style={styles.buttonRow}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreate}
            >
              <Text style={styles.buttonText}>
                {isSharing ? 'Share to Community' : 'Create Challenge'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.secondary }]}
              onPress={onBack}
            >
              <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};