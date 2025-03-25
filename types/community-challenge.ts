import { Challenge } from './challenge';

export interface CommunityChallenge extends Challenge {
  creatorId: string;
  creatorName: string;
  participantCount: number;
  isPublic: boolean;
  tags: string[];
  likes: number;
}