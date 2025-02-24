import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { VoiceGuidanceConfig } from '../types/voiceTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VoiceGuidanceSettingsProps {
  onSettingsChange: (settings: VoiceGuidanceConfig) => void;
}

export const VoiceGuidanceSettings: React.FC<VoiceGuidanceSettingsProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<VoiceGuidanceConfig>({
    volume: 1,
    playInBackground: true,
    includeFormCues: true,
    countdownEnabled: true,
  });

  const updateSetting = async (key: keyof VoiceGuidanceConfig, value: boolean) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    try {
      await AsyncStorage.setItem('voiceGuidanceSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Guidance Settings</Text>

      <View style={styles.settingRow}>
        <Text>Play in Background</Text>
        <Switch
          value={settings.playInBackground}
          onValueChange={(value) => updateSetting('playInBackground', value)}
        />
      </View>

      <View style={styles.settingRow}>
        <Text>Form Cues</Text>
        <Switch
          value={settings.includeFormCues}
          onValueChange={(value) => updateSetting('includeFormCues', value)}
        />
      </View>

      <View style={styles.settingRow}>
        <Text>Countdown Timer</Text>
        <Switch
          value={settings.countdownEnabled}
          onValueChange={(value) => updateSetting('countdownEnabled', value)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});