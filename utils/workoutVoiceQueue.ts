import { AudioCue, WorkoutAudioQueue } from '../types/voiceTypes';
import { voiceGuidanceManager } from './voiceGuidance';

class WorkoutVoiceQueueManager {
  private currentQueue: WorkoutAudioQueue | null = null;
  private timer: NodeJS.Timeout | null = null;

  createQueue(exerciseCues: AudioCue[]): WorkoutAudioQueue {
    return {
      id: Date.now().toString(),
      exerciseCues,
      currentIndex: 0,
      isPlaying: false
    };
  }

  async startQueue(queue: WorkoutAudioQueue) {
    this.currentQueue = queue;
    this.currentQueue.isPlaying = true;
    await this.playNextCue();
  }

  private async playNextCue() {
    if (!this.currentQueue || !this.currentQueue.isPlaying) return;
  
    const currentCue = this.currentQueue.exerciseCues[this.currentQueue.currentIndex];
    if (!currentCue) {
      await this.stopQueue();
      return;
    }
    
    await voiceGuidanceManager.playVoiceGuidance(
      currentCue.text, 
      currentCue.type === 'exercise' ? currentCue.duration : undefined
    );
  
    // Set timer for next cue
    this.timer = setTimeout(async () => {
      this.currentQueue!.currentIndex++;
      await this.playNextCue();
    }, currentCue.duration * 1000);
  }

  async stopQueue() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.currentQueue) {
      this.currentQueue.isPlaying = false;
      this.currentQueue.currentIndex = 0;
    }

    await voiceGuidanceManager.stop();
  }

  async pauseQueue() {
    if (this.currentQueue) {
      this.currentQueue.isPlaying = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      await voiceGuidanceManager.stop();
    }
  }

  getCurrentCue(): AudioCue | null {
    if (!this.currentQueue) return null;
    return this.currentQueue.exerciseCues[this.currentQueue.currentIndex] || null;
  }
}

export const workoutVoiceQueue = new WorkoutVoiceQueueManager();