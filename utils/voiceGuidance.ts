import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

class VoiceGuidanceManager {
    private isPlaying: boolean = false;
    private isSpeaking: boolean = false;
    private countdownTimer: NodeJS.Timeout | null = null;
  async init() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async playVoiceGuidance(text: string, duration?: number) {
    try {
      if (this.isSpeaking) {
        await Speech.stop();
      }

      this.isPlaying = true;
      this.isSpeaking = true;

      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          this.isSpeaking = false;
          
          // If duration is provided, start countdown timer for last 5 seconds
          if (duration && duration > 5) {
            const countdownStart = duration - 5;
            this.startCountdown(countdownStart);
          } else {
            this.isPlaying = false;
          }
        },
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          this.isSpeaking = false;
          this.isPlaying = false;
        }
      });
    } catch (error) {
      console.error('Failed to play voice guidance:', error);
      this.isSpeaking = false;
      this.isPlaying = false;
    }
  }

  private async startCountdown(delay: number) {
    // Wait until it's time to start countdown
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    // Start countdown from 5
    for (let i = 5; i > 0; i--) {
      if (!this.isPlaying) break; // Stop if playback was stopped
      await Speech.speak(i.toString(), {
        language: 'en',
        pitch: 1.0,
        rate: 0.9
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isPlaying = false;
  }

  async stop() {
    try {
      if (this.isSpeaking) {
        await Speech.stop();
        this.isSpeaking = false;
      }
      if (this.countdownTimer) {
        clearTimeout(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.isPlaying = false;
    } catch (error) {
      console.error('Failed to stop voice guidance:', error);
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const voiceGuidanceManager = new VoiceGuidanceManager();