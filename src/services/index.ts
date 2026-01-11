// Service interfaces - these can be swapped for Supabase implementations later

import { Session, UserProfile, Match, CallThread, CallProposal, CallEvent, Report } from '../types';
import * as localRepo from './localRepo';

// ============ Auth Service ============
export interface IAuthService {
  getSession(): Session | null;
  loginAs(userId: string): Promise<Session>;
  logout(): Promise<void>;
}

export const AuthService: IAuthService = {
  getSession: () => localRepo.getSession(),
  loginAs: (userId: string) => localRepo.createSession(userId),
  logout: () => localRepo.clearSession(),
};

// ============ Profiles Service ============
export interface IProfilesService {
  getMe(): UserProfile | undefined;
  getProfile(id: string): UserProfile | undefined;
  updateMe(updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<UserProfile | undefined>;
  createProfile(profile: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile>;
  listCandidates(): UserProfile[];
  getAllProfiles(): UserProfile[];
}

export const ProfilesService: IProfilesService = {
  getMe: () => {
    const session = localRepo.getSession();
    if (!session) return undefined;
    return localRepo.getProfile(session.userId);
  },
  getProfile: (id: string) => localRepo.getProfile(id),
  updateMe: async (updates) => {
    const session = localRepo.getSession();
    if (!session) return undefined;
    return localRepo.updateProfile(session.userId, updates);
  },
  createProfile: (profile) => localRepo.createProfile(profile),
  listCandidates: () => {
    const session = localRepo.getSession();
    if (!session) return [];
    return localRepo.getCandidates(session.userId);
  },
  getAllProfiles: () => localRepo.getAllProfiles(),
};

// ============ Matching Service ============
export interface IMatchingService {
  like(userId: string): Promise<{ isMatch: boolean; matchId?: string }>;
  pass(userId: string): Promise<void>;
  getMatches(): Match[];
  getMatch(matchId: string): Match | undefined;
  getThread(matchId: string): CallThread | undefined;
  getOtherUser(match: Match): UserProfile | undefined;
}

export const MatchingService: IMatchingService = {
  like: async (userId: string) => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    const result = await localRepo.createSwipe(session.userId, userId, 'like');
    return { isMatch: result.isMatch, matchId: result.matchId };
  },
  pass: async (userId: string) => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    await localRepo.createSwipe(session.userId, userId, 'pass');
  },
  getMatches: () => {
    const session = localRepo.getSession();
    if (!session) return [];
    return localRepo.getMatches(session.userId);
  },
  getMatch: (matchId: string) => localRepo.getMatch(matchId),
  getThread: (matchId: string) => localRepo.getCallThread(matchId),
  getOtherUser: (match: Match) => {
    const session = localRepo.getSession();
    if (!session) return undefined;
    const otherId = match.userAId === session.userId ? match.userBId : match.userAId;
    return localRepo.getProfile(otherId);
  },
};

// ============ Scheduling Service ============
export interface ISchedulingService {
  createProposal(
    threadId: string,
    callType: 'audio' | 'video',
    slots: string[]
  ): Promise<CallProposal>;
  confirmSlot(proposalId: string, slotISO: string): Promise<CallEvent>;
  getProposals(threadId: string): CallProposal[];
  getLatestProposal(threadId: string): CallProposal | undefined;
  getUpcomingCall(threadId: string): CallEvent | undefined;
  getCallEvent(eventId: string): CallEvent | undefined;
  getThread(threadId: string): CallThread | undefined;
  updateCallState(eventId: string, state: CallEvent['state']): Promise<void>;
}

export const SchedulingService: ISchedulingService = {
  createProposal: async (threadId, callType, slots) => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    return localRepo.createProposal(threadId, session.userId, callType, slots);
  },
  confirmSlot: async (proposalId: string, slotISO: string) => {
    const proposals = localRepo.getProposalsForThread(proposalId);
    // Find proposal by looking through all threads - simplified lookup
    const allProfiles = localRepo.getAllProfiles();
    // Get the proposal directly
    const proposal = localRepo.getLatestProposal(proposalId);
    if (!proposal) {
      // proposalId might actually be the proposal id, let's find it differently
      throw new Error('Proposal not found');
    }
    return localRepo.createCallEvent(
      proposal.threadId,
      slotISO,
      proposal.callType,
      __DEV__ ? 30 : 900 // 30 seconds in dev, 15 minutes in prod
    );
  },
  getProposals: (threadId) => localRepo.getProposalsForThread(threadId),
  getLatestProposal: (threadId) => localRepo.getLatestProposal(threadId),
  getUpcomingCall: (threadId) => localRepo.getUpcomingCall(threadId),
  getCallEvent: (eventId) => localRepo.getCallEvent(eventId),
  getThread: (threadId) => localRepo.getCallThreadById(threadId),
  updateCallState: (eventId, state) => localRepo.updateCallEventState(eventId, state),
};

// ============ Call Provider ============
export interface ICallProvider {
  createRoom(callEventId: string): Promise<{ joinUrl: string }>;
}

export const CallProvider: ICallProvider = {
  createRoom: async (callEventId: string) => {
    // Mock implementation - in real app this would call a video service API
    return { joinUrl: `mock://video-room/${callEventId}` };
  },
};

// ============ Safety Service ============
export interface ISafetyService {
  block(userId: string): Promise<void>;
  report(userId: string, category: Report['category'], notes?: string): Promise<void>;
  createFeedback(callEventId: string, rating: 'interested' | 'not_interested'): Promise<void>;
}

export const SafetyService: ISafetyService = {
  block: async (userId: string) => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    await localRepo.createBlock(session.userId, userId);
  },
  report: async (userId: string, category: Report['category'], notes?: string) => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    await localRepo.createReport(session.userId, userId, category, notes);
  },
  createFeedback: async (callEventId: string, rating: 'interested' | 'not_interested') => {
    const session = localRepo.getSession();
    if (!session) throw new Error('No session');
    await localRepo.createFeedback(callEventId, session.userId, rating);
  },
};

// Export repo functions for dev tools
export { initDatabase, resetDatabase, seedDatabase, setAutoMatchNextLike, getDevSettings } from './localRepo';
