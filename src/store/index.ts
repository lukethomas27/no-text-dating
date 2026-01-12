import { create } from 'zustand';
import { Session, UserProfile, Match, CallEvent } from '../types';
import {
  AuthService,
  ProfilesService,
  MatchingService,
  SafetyService,
} from '../services';
import { supabase } from '../lib/supabase';

interface AppState {
  // Auth
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Profile
  currentUser: UserProfile | undefined;

  // Discovery
  candidates: UserProfile[];
  currentCandidateIndex: number;

  // Matches
  matches: Match[];

  // Active call
  activeCallEvent: CallEvent | null;

  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ isNewUser: boolean }>;
  verifyOtp: (phone: string, token: string) => Promise<{ needsProfile: boolean }>;
  completeProfile: (name: string, age: number) => Promise<void>;
  signOut: () => Promise<void>;

  // Profile actions
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;

  // Discovery actions
  refreshCandidates: () => Promise<void>;
  likeCurrentCandidate: () => Promise<{ isMatch: boolean; matchId?: string }>;
  passCurrentCandidate: () => Promise<void>;
  nextCandidate: () => void;

  // Match actions
  refreshMatches: () => Promise<void>;
  getOtherUser: (match: Match) => Promise<UserProfile | undefined>;

  // Call actions
  setActiveCallEvent: (event: CallEvent | null) => void;

  // Safety actions
  blockUser: (userId: string) => Promise<void>;
  reportUser: (userId: string, category: 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other', notes?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  session: null,
  isLoading: true,
  isInitialized: false,
  currentUser: undefined,
  candidates: [],
  currentCandidateIndex: 0,
  matches: [],
  activeCallEvent: null,

  // Initialize the app
  initialize: async () => {
    set({ isLoading: true });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const appSession: Session = {
          userId: session.user.id,
          createdAt: session.user.created_at,
        };
        const currentUser = await ProfilesService.getMe();
        const candidates = currentUser ? await ProfilesService.listCandidates() : [];
        const matches = currentUser ? await MatchingService.getMatches() : [];
        set({
          session: appSession,
          currentUser,
          candidates,
          matches,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          session: null,
          currentUser: undefined,
          candidates: [],
          currentCandidateIndex: 0,
          matches: [],
          activeCallEvent: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    // Check for existing session
    const session = await AuthService.getSession();
    if (session) {
      const currentUser = await ProfilesService.getMe();
      const candidates = currentUser ? await ProfilesService.listCandidates() : [];
      const matches = currentUser ? await MatchingService.getMatches() : [];
      set({
        session,
        currentUser,
        candidates,
        matches,
        isLoading: false,
        isInitialized: true,
      });
    } else {
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // Auth actions
  // Note: These don't set isLoading to avoid unmounting the auth screen
  sendOtp: async (phone: string) => {
    const result = await AuthService.sendOtp(phone);
    return result;
  },

  verifyOtp: async (phone: string, token: string) => {
    const session = await AuthService.verifyOtp(phone, token);

    // Check if user has a profile
    const currentUser = await ProfilesService.getMe();

    if (currentUser) {
      // Existing user with profile
      const candidates = await ProfilesService.listCandidates();
      const matches = await MatchingService.getMatches();
      set({
        session,
        currentUser,
        candidates,
        currentCandidateIndex: 0,
        matches,
      });
      return { needsProfile: false };
    } else {
      // New user needs to complete profile
      set({ session });
      return { needsProfile: true };
    }
  },

  completeProfile: async (name: string, age: number) => {
    // Create the user profile
    const profile = await ProfilesService.createProfile({
      name,
      age,
      prompts: ['', '', ''],
      photos: [],
    });

    const candidates = await ProfilesService.listCandidates();
    set({
      currentUser: profile,
      candidates,
      currentCandidateIndex: 0,
      matches: [],
    });
  },

  signOut: async () => {
    await AuthService.signOut();
    set({
      session: null,
      currentUser: undefined,
      candidates: [],
      currentCandidateIndex: 0,
      matches: [],
      activeCallEvent: null,
    });
  },

  // Profile actions
  updateProfile: async (updates) => {
    const currentUser = await ProfilesService.updateMe(updates);
    set({ currentUser });
  },

  refreshCurrentUser: async () => {
    const currentUser = await ProfilesService.getMe();
    set({ currentUser });
  },

  // Discovery actions
  refreshCandidates: async () => {
    const candidates = await ProfilesService.listCandidates();
    set({ candidates, currentCandidateIndex: 0 });
  },

  likeCurrentCandidate: async () => {
    const { candidates, currentCandidateIndex } = get();
    const candidate = candidates[currentCandidateIndex];
    if (!candidate) return { isMatch: false };

    const result = await MatchingService.like(candidate.id);

    if (result.isMatch) {
      const matches = await MatchingService.getMatches();
      set({ matches });
    }

    get().nextCandidate();
    return result;
  },

  passCurrentCandidate: async () => {
    const { candidates, currentCandidateIndex } = get();
    const candidate = candidates[currentCandidateIndex];
    if (!candidate) return;

    await MatchingService.pass(candidate.id);
    get().nextCandidate();
  },

  nextCandidate: () => {
    const { currentCandidateIndex, candidates } = get();
    if (currentCandidateIndex < candidates.length - 1) {
      set({ currentCandidateIndex: currentCandidateIndex + 1 });
    } else {
      // Refresh candidates when we've gone through all of them
      get().refreshCandidates();
    }
  },

  // Match actions
  refreshMatches: async () => {
    const matches = await MatchingService.getMatches();
    set({ matches });
  },

  getOtherUser: async (match: Match) => {
    return MatchingService.getOtherUser(match);
  },

  // Call actions
  setActiveCallEvent: (event: CallEvent | null) => {
    set({ activeCallEvent: event });
  },

  // Safety actions
  blockUser: async (userId: string) => {
    await SafetyService.block(userId);
    // Refresh data after blocking
    const candidates = await ProfilesService.listCandidates();
    const matches = await MatchingService.getMatches();
    set({ candidates, matches, currentCandidateIndex: 0 });
  },

  reportUser: async (userId: string, category, notes) => {
    await SafetyService.report(userId, category, notes);
  },
}));
