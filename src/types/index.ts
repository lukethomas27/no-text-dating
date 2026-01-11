// Core data types for the No Text Dating app

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  prompts: [string, string, string];
  photos: string[];
  bio?: string;
  createdAt: string;
}

export interface Swipe {
  fromId: string;
  toId: string;
  action: 'like' | 'pass';
  createdAt: string;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  state: 'active' | 'archived' | 'blocked';
  createdAt: string;
}

export interface CallThread {
  id: string;
  matchId: string;
  schedulingState: 'pending' | 'proposed' | 'confirmed';
  lastActivityAt: string;
}

export interface CallProposal {
  id: string;
  threadId: string;
  proposedBy: string;
  callType: 'audio' | 'video';
  slots: string[]; // ISO date strings
  createdAt: string;
}

export interface CallEvent {
  id: string;
  threadId: string;
  scheduledStartISO: string;
  durationSeconds: number;
  callType: 'audio' | 'video';
  state: 'scheduled' | 'live' | 'completed' | 'missed' | 'canceled';
  providerJoinUrl?: string;
}

export interface Feedback {
  id: string;
  callEventId: string;
  userId: string;
  rating: 'interested' | 'not_interested';
  createdAt: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  reporterId: string;
  reportedId: string;
  category: 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other';
  notes?: string;
  createdAt: string;
}

// Session type for auth
export interface Session {
  userId: string;
  createdAt: string;
}

// Store state for the entire local database
export interface LocalDatabase {
  profiles: UserProfile[];
  swipes: Swipe[];
  matches: Match[];
  callThreads: CallThread[];
  callProposals: CallProposal[];
  callEvents: CallEvent[];
  feedbacks: Feedback[];
  blocks: Block[];
  reports: Report[];
  session: Session | null;
}
