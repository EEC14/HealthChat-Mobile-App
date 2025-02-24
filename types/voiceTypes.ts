export interface AudioCue {
    id: string;
    type: 'exercise' | 'rest' | 'countdown' | 'form';
    text: string;
    duration: number;
    priority: number;
}
  
export interface WorkoutAudioQueue {
    id: string;
    exerciseCues: AudioCue[];
    currentIndex: number;
    isPlaying: boolean;
}
  
export interface VoiceGuidanceConfig {
    volume: number;
    playInBackground: boolean;
    includeFormCues: boolean;
    countdownEnabled: boolean;
}
  
export type VoiceGuidanceStatus = {
    isPlaying: boolean;
    currentCue: AudioCue | null;
    timeRemaining: number;
};

export interface WorkoutExercise {
    name: string;
    description: string;
    duration: number;
    sets: number;
    reps: number;
    rest: number;
    formCues: string[];
}