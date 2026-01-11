// Service layer - Supabase implementation
// All methods are now async to work with Supabase

import { Session, UserProfile, Match, CallThread, CallProposal, CallEvent, Report } from '../types';
import * as supabaseRepo from './supabaseRepo';

// ============ Auth Service ============
export interface IAuthService {
  getSession(): Promise<Session | null>;
  signUp(email: string, password: string): Promise<Session>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
}

export const AuthService: IAuthService = {
  getSession: () => supabaseRepo.getSession(),
  signUp: (email, password) => supabaseRepo.signUp(email, password),
  signIn: (email, password) => supabaseRepo.signIn(email, password),
  signOut: () => supabaseRepo.signOut(),
};

// ============ Profiles Service ============
export interface IProfilesService {
  getMe(): Promise<UserProfile | undefined>;
  getProfile(id: string): Promise<UserProfile | undefined>;
  updateMe(updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<UserProfile | undefined>;
  createProfile(profile: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile>;
  listCandidates(): Promise<UserProfile[]>;
  getAllProfiles(): Promise<UserProfile[]>;
}

export const ProfilesService: IProfilesService = {
  getMe: () => supabaseRepo.getMyProfile(),
  getProfile: (id) => supabaseRepo.getProfile(id),
  updateMe: (updates) => supabaseRepo.updateProfile(updates),
  createProfile: (profile) => supabaseRepo.createProfile(profile),
  listCandidates: () => supabaseRepo.getCandidates(),
  getAllProfiles: () => supabaseRepo.getAllProfiles(),
};

// ============ Matching Service ============
export interface IMatchingService {
  like(userId: string): Promise<{ isMatch: boolean; matchId?: string }>;
  pass(userId: string): Promise<void>;
  getMatches(): Promise<Match[]>;
  getMatch(matchId: string): Promise<Match | undefined>;
  getThread(matchId: string): Promise<CallThread | undefined>;
  getOtherUser(match: Match): Promise<UserProfile | undefined>;
}

export const MatchingService: IMatchingService = {
  like: async (userId) => {
    const result = await supabaseRepo.createSwipe(userId, 'like');
    return { isMatch: result.isMatch, matchId: result.matchId };
  },
  pass: async (userId) => {
    await supabaseRepo.createSwipe(userId, 'pass');
  },
  getMatches: () => supabaseRepo.getMatches(),
  getMatch: (matchId) => supabaseRepo.getMatch(matchId),
  getThread: (matchId) => supabaseRepo.getCallThread(matchId),
  getOtherUser: async (match) => {
    const session = await supabaseRepo.getSession();
    if (!session) return undefined;
    const otherId = match.userAId === session.userId ? match.userBId : match.userAId;
    return supabaseRepo.getProfile(otherId);
  },
};

// ============ Scheduling Service ============
export interface ISchedulingService {
  createProposal(
    threadId: string,
    callType: 'audio' | 'video',
    slots: string[]
  ): Promise<CallProposal>;
  confirmSlot(threadId: string, slotISO: string): Promise<CallEvent>;
  getProposals(threadId: string): Promise<CallProposal[]>;
  getLatestProposal(threadId: string): Promise<CallProposal | undefined>;
  getUpcomingCall(threadId: string): Promise<CallEvent | undefined>;
  getCallEvent(eventId: string): Promise<CallEvent | undefined>;
  getThread(threadId: string): Promise<CallThread | undefined>;
  updateCallState(eventId: string, state: CallEvent['state']): Promise<void>;
}

// Call duration: 30 seconds in dev, 15 minutes in prod
const CALL_DURATION = __DEV__ ? 30 : 900;

export const SchedulingService: ISchedulingService = {
  createProposal: (threadId, callType, slots) =>
    supabaseRepo.createProposal(threadId, callType, slots),
  confirmSlot: async (threadId, slotISO) => {
    const proposal = await supabaseRepo.getLatestProposal(threadId);
    if (!proposal) throw new Error('No proposal found');
    return supabaseRepo.createCallEvent(
      threadId,
      slotISO,
      proposal.callType,
      CALL_DURATION
    );
  },
  getProposals: (threadId) => supabaseRepo.getProposalsForThread(threadId),
  getLatestProposal: (threadId) => supabaseRepo.getLatestProposal(threadId),
  getUpcomingCall: (threadId) => supabaseRepo.getUpcomingCall(threadId),
  getCallEvent: (eventId) => supabaseRepo.getCallEvent(eventId),
  getThread: (threadId) => supabaseRepo.getCallThreadById(threadId),
  updateCallState: (eventId, state) => supabaseRepo.updateCallEventState(eventId, state),
};

// ============ Call Provider ============
export interface ICallProvider {
  createRoom(callEventId: string): Promise<{ joinUrl: string }>;
}

export const CallProvider: ICallProvider = {
  createRoom: async (callEventId: string) => {
    // Mock implementation - replace with real video service (Daily.co, Twilio, etc.)
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
  block: async (userId) => {
    await supabaseRepo.createBlock(userId);
  },
  report: async (userId, category, notes) => {
    await supabaseRepo.createReport(userId, category, notes);
  },
  createFeedback: async (callEventId, rating) => {
    await supabaseRepo.createFeedback(callEventId, rating);
  },
};
