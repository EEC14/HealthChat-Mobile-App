import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthContext } from '../../context/AuthContext'; // Updated import
import {
  connectWearable,
  getUserWearableConnections,
  calculateRecoveryStatus,
} from '../../utils/wearableService';
import { 
  WearableConnection, 
  WearableType, 
  RecoveryStatus 
} from '../../types/WearableTypes';
import { updateUserProfile } from '../../firebase';
import { AntDesign } from '@expo/vector-icons';

// Define a fallback color or access the correct structure
const PRIMARY_COLOR = Colors.light ? Colors.light.primary : '#2196F3';

const PRIVACY_RETENTION_DAYS = 90; // Default data retention period

interface WearableIntegrationScreenProps {
  onGoBack?: () => void;
  onDeviceConnected?: () => void;
}

const WearableIntegrationScreen: React.FC<WearableIntegrationScreenProps> = ({ 
  onGoBack, 
  onDeviceConnected 
}) => {
  const { user } = useAuthContext(); // Using AuthContext instead of useAuth
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [privacySettings, setPrivacySettings] = useState({
    shareHealthData: false,
    retentionPeriodDays: PRIVACY_RETENTION_DAYS,
    consentTimestamp: 0, // Added default value
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load wearable connections
      const userConnections = await getUserWearableConnections(user.uid);
      setConnections(userConnections);
      
      // Load recovery status if there are connections
      if (userConnections.length > 0 && userConnections.some(c => c.isConnected)) {
        const status = await calculateRecoveryStatus(user.uid);
        setRecoveryStatus(status);
      }
      
      // Load privacy settings
      if (user.privacySettings) {
        setPrivacySettings({
          shareHealthData: user.privacySettings.shareHealthData || false,
          retentionPeriodDays: user.privacySettings.retentionPeriodDays || PRIVACY_RETENTION_DAYS,
          consentTimestamp: user.privacySettings.consentTimestamp || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWearable = async (type: WearableType) => {
    if (!user) return;
  
    try {
      setIsLoading(true);
      
      // Check if already connected
      const existingConnection = connections.find(c => c.type === type);
      if (existingConnection && existingConnection.isConnected) {
        Alert.alert('Already Connected', `You are already connected to ${type}.`);
        setIsLoading(false);
        return;
      }
  
      // Platform-specific checks
      if (type === 'appleHealth' && Platform.OS !== 'ios') {
        Alert.alert('Not Supported', 'Apple Health is only available on iOS devices.');
        setIsLoading(false);
        return;
      }
  
      if (type === 'googleFit' && Platform.OS !== 'android') {
        Alert.alert('Not Supported', 'Google Fit is only available on Android devices.');
        setIsLoading(false);
        return;
      }
      if (!privacySettings.shareHealthData) {
        const consentGiven = await requestHealthDataConsent();
        if (!consentGiven) {
          setIsLoading(false);
          return;
        }
      }
      const permissions = getDefaultPermissionsForType(type);
      const connectionId = await connectWearable({
        userId: user.uid,
        type,
        isConnected: true,
        permissions,
      });
      setConnections(prev => [
        ...prev.filter(c => c.type !== type),
        {
          id: connectionId,
          userId: user.uid,
          type,
          isConnected: true,
          lastSynced: null,
          permissions,
        }
      ]);
  
      // Update user profile
      await updateUserProfile(user.uid, {
        connectedWearables: [...(user.connectedWearables || []), type],
      });
  
      Alert.alert('Success', `Successfully connected to ${type}!`);
      
      // Important: Wait a moment and then call onDeviceConnected to trigger data refresh
      setTimeout(() => {
        if (onDeviceConnected) {
          onDeviceConnected();
        }
      }, 500);
      
    } catch (error) {
      console.error(`Error connecting to ${type}:`, error);
      Alert.alert('Connection Failed', `Failed to connect to ${type}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  

  const requestHealthDataConsent = (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Health Data Consent',
        'We need your permission to collect and process your health data to provide personalized recommendations. Your data will be stored securely and only used to improve your experience.',
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Accept',
            onPress: async () => {
              // Update privacy settings
              const currentTime = Date.now();
              setPrivacySettings(prev => ({
                ...prev,
                shareHealthData: true,
                consentTimestamp: currentTime,
              }));
              
              // Save to user profile
              if (user) {
                await updateUserProfile(user.uid, {
                  privacySettings: {
                    shareHealthData: true,
                    retentionPeriodDays: PRIVACY_RETENTION_DAYS,
                    consentTimestamp: currentTime,
                  }
                });
              }
              
              resolve(true);
            },
          },
        ]
      );
    });
  };

  const getDefaultPermissionsForType = (type: WearableType): string[] => {
    switch (type) {
      case 'appleHealth':
        return ['steps', 'heart_rate', 'sleep', 'calories'];
      case 'googleFit':
        return ['steps', 'heart_rate', 'sleep', 'calories'];
      default:
        return ['steps'];
    }
  };

  const handleTogglePrivacySetting = async (setting: keyof typeof privacySettings, value: boolean) => {
    if (!user) return;

    try {
      const newSettings = {
        ...privacySettings,
        [setting]: value,
        // If enabling, update the consent timestamp
        ...(setting === 'shareHealthData' && value ? { consentTimestamp: Date.now() } : {})
      };
      
      setPrivacySettings(newSettings);
      
      await updateUserProfile(user.uid, {
        privacySettings: newSettings
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings.');
      
      // Revert the toggle
      setPrivacySettings(prevSettings => ({
        ...prevSettings,
        [setting]: !value
      }));
    }
  };

  const handleDone = async () => {
    // Clear any previous attempt refresh flags
    if (onDeviceConnected) {
      onDeviceConnected();
    }
    
    if (onGoBack) {
      onGoBack();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  const additionalStyles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backButton: {
      padding: 8,
    },
    doneButton: {
      backgroundColor: PRIMARY_COLOR,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 24,
    },
    doneButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    }
  });

  return (
    <ScrollView style={styles.container}>
      <View style={additionalStyles.headerContainer}>
        <TouchableOpacity 
          onPress={onGoBack}
          style={additionalStyles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginLeft: 16, flex: 1 }]}>
          Wearable Integration
        </Text>
      </View>

      {recoveryStatus && (
        <View style={styles.recoveryContainer}>
          <View style={styles.recoveryHeader}>
            <Text style={styles.recoveryTitle}>Recovery Status</Text>
            <View style={[
              styles.scoreContainer,
              recoveryStatus.score > 80 ? styles.scoreHigh :
              recoveryStatus.score > 60 ? styles.scoreMedium :
              styles.scoreLow
            ]}>
              <Text style={styles.scoreText}>{recoveryStatus.score}</Text>
            </View>
          </View>
          
          <Text style={styles.recoveryMessage}>
            {recoveryStatus.recommendation}
          </Text>
          
          <View style={styles.factorsContainer}>
            <Text style={styles.factorsTitle}>Contributing Factors:</Text>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Sleep Quality:</Text>
              <Text style={styles.factorValue}>{recoveryStatus.contributingFactors.sleepQuality}%</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Resting Heart Rate:</Text>
              <Text style={styles.factorValue}>{recoveryStatus.contributingFactors.restingHeartRate} bpm</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Recent Activity Level:</Text>
              <Text style={styles.factorValue}>{recoveryStatus.contributingFactors.recentActivityLevel}%</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Available Devices</Text>

        <TouchableOpacity 
          style={styles.deviceCard}
          onPress={() => handleConnectWearable('appleHealth')}
        >
          <Ionicons name="heart" size={24} color={PRIMARY_COLOR} />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>Apple Health</Text>
            <Text style={styles.deviceDescription}>
              Steps, heart rate, sleep, and more
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {connections.some(c => c.type === 'appleHealth' && c.isConnected) ? (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <Ionicons name="add-circle" size={24} color={PRIMARY_COLOR} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deviceCard}
          onPress={() => handleConnectWearable('googleFit')}
        >
          <Ionicons name="fitness" size={24} color={PRIMARY_COLOR} />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>Google Fit</Text>
            <Text style={styles.deviceDescription}>
              Physical activity, heart rate, and more
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {connections.some(c => c.type === 'googleFit' && c.isConnected) ? (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <Ionicons name="add-circle" size={24} color={PRIMARY_COLOR} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Data Privacy</Text>
        
        <View style={styles.privacyCard}>
          <View style={styles.privacyItem}>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyLabel}>Share Health Data</Text>
              <Text style={styles.privacyDescription}>
                Allow the app to process your health data for personalized recommendations
              </Text>
            </View>
            <Switch
              value={privacySettings.shareHealthData}
              onValueChange={(value) => handleTogglePrivacySetting('shareHealthData', value)}
              trackColor={{ false: '#d1d1d1', true: `${PRIMARY_COLOR}80` }}
              thumbColor={privacySettings.shareHealthData ? PRIMARY_COLOR : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.privacyInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.privacyInfoText}>
              Your data is stored securely and retained for {privacySettings.retentionPeriodDays} days. 
              You can request data deletion at any time.
            </Text>
          </View>
        </View>
      </View>
      {connections.some(c => c.isConnected) && (
        <View style={styles.gdprInfo}>
          <Text style={styles.gdprTitle}>Connected Device Capabilities</Text>
          <Text style={styles.gdprText}>
            Your iPhone can track step count and basic activity data. For heart rate, 
            sleep analysis, and more advanced metrics, you would need an Apple Watch 
            or other compatible fitness tracker.
          </Text>
          <Text style={styles.gdprText}>
            We'll use whatever data is available to provide the best possible recommendations.
          </Text>
        </View>
      )}
      
      <View style={styles.gdprInfo}>
        <Text style={styles.gdprTitle}>Your Privacy Rights</Text>
        <Text style={styles.gdprText}>
          In compliance with GDPR regulations, you have the right to access, modify, 
          and delete your personal data. We do not share your health information with 
          third parties without your explicit consent.
        </Text>
      </View>
      <View
      style={{
        paddingBottom: 35,
      }}>
      <TouchableOpacity 
          style={{
            backgroundColor: PRIMARY_COLOR,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 10,
            alignItems: 'center',
            marginHorizontal: 16,
            marginVertical: 24,
          }}
          onPress={() => {
            if (onDeviceConnected) {
              onDeviceConnected();
            } else if (onGoBack) {
              onGoBack();
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            {connections.some(c => c.isConnected) ? "Done - Refresh Health Data" : "Done"}
          </Text>
        </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  recoveryContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recoveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreHigh: {
    backgroundColor: '#4caf50',
  },
  scoreMedium: {
    backgroundColor: '#ff9800',
  },
  scoreLow: {
    backgroundColor: '#f44336',
  },
  scoreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  recoveryMessage: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  factorsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  factorLabel: {
    fontSize: 14,
    color: '#666',
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContainer: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    paddingLeft: 8,
  },
  connectedBadge: {
    backgroundColor: '#e6f7e6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  connectedText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '500',
  },
  privacyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  privacyInfo: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  privacyInfoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  gdprInfo: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f0f5ff',
    borderRadius: 12,
    marginBottom: 32,
  },
  gdprTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c5282',
  },
  gdprText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d3748',
  }
});

export default WearableIntegrationScreen;