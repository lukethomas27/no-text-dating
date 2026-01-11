import { create } from 'zustand';
import { Session, UserProfile, Match, CallThread, CallEvent } from '../types';
import {
  AuthService,
  ProfilesService,
  MatchingService,
  SchedulingService,
  SafetyService,
  initDatabase,
  resetDatabase,
  seedDatabase,
  setAutoMatchNextLike,
  getDevSettings,
} from '../services';

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

  // Dev settings
  autoMatchNextLike: boolean;

  // Actions
  initialize: () => Promise<void>;
  loginAs: (userId: string) => Promise<void>;
  createAndLogin: (name: string, age: number) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile actions
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => Promise<void>;
  refreshCurrentUser: () => void;

  // Discovery actions
  refreshCandidates: () => void;
  likeCurrentCandidate: () => Promise<{ isMatch: boolean; matchId?: string }>;
  passCurrentCandidate: () => Promise<void>;
  nextCandidate: () => void;

  // Match actions
  refreshMatches: () => void;
  getOtherUser: (match: Match) => UserProfile | undefined;

  // Call actions
  setActiveCallEvent: (event: CallEvent | null) => void;

  // Safety actions
  blockUser: (userId: string) => Promise<void>;
  reportUser: (userId: string, category: 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other', notes?: string) => Promise<void>;

  // Dev actions
  resetAllData: () => Promise<void>;
  reseedProfiles: () => Promise<void>;
  toggleAutoMatch: () => void;
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
  autoMatchNextLike: false,

  // Initialize the app
  initialize: async () => {
    set({ isLoading: true });
    await initDatabase();
    const session = AuthService.getSession();
    const currentUser = session ? ProfilesService.getMe() : undefined;
    const candidates = session ? ProfilesService.listCandidates() : [];
    const matches = session ? MatchingService.getMatches() : [];
    set({
      session,
      currentUser,
      candidates,
      matches,
      isLoading: false,
      isInitialized: true,
      autoMatchNextLike: getDevSettings().autoMatchNextLike,
    });
  },

  // Auth actions
  loginAs: async (userId: string) => {
    set({ isLoading: true });
    await AuthService.loginAs(userId);
    const session = AuthService.getSession();
    const currentUser = ProfilesService.getMe();
    const candidates = ProfilesService.listCandidates();
    const matches = MatchingService.getMatches();
    set({
      session,
      currentUser,
      candidates,
      currentCandidateIndex: 0,
      matches,
      isLoading: false,
    });
  },

  createAndLogin: async (name: string, age: number) => {
    set({ isLoading: true });
    const profile = await ProfilesService.createProfile({
      name,
      age,
      prompts: ['', '', ''],
      photos: [],
    });
    await AuthService.loginAs(profile.id);
    const session = AuthService.getSession();
    const candidates = ProfilesService.listCandidates();
    set({
      session,
      currentUser: profile,
      candidates,
      currentCandidateIndex: 0,
      matches: [],
      isLoading: false,
    });
  },

  logout: async () => {
    await AuthService.logout();
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
    await ProfilesService.updateMe(updates);
    const currentUser = ProfilesService.getMe();
    set({ currentUser });
  },

  refreshCurrentUser: () => {
    const currentUser = ProfilesService.getMe();
    set({ currentUser });
  },

  // Discovery actions
  refreshCandidates: () => {
    const candidates = ProfilesService.listCandidates();
    set({ candidates, currentCandidateIndex: 0 });
  },

  likeCurrentCandidate: async () => {
    const { candidates, currentCandidateIndex } = get();
    const candidate = candidates[currentCandidateIndex];
    if (!candidate) return { isMatch: false };
    
    const result = await MatchingService.like(candidate.id);
    
    if (result.isMatch) {
      const matches = MatchingService.getMatches();
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
      const newCandidates = ProfilesService.listCandidates();
      set({ candidates: newCandidates, currentCandidateIndex: 0 });
    }
  },

  // Match actions
  refreshMatches: () => {
    const matches = MatchingService.getMatches();
    set({ matches });
  },

  getOtherUser: (match: Match) => {
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
    const candidates = ProfilesService.listCandidates();
    const matches = MatchingService.getMatches();
    set({ candidates, matches, currentCandidateIndex: 0 });
  },

  reportUser: async (userId: string, category, notes) => {
    await SafetyService.report(userId, category, notes);
  },

  // Dev actions
  resetAllData: async () => {
    await resetDatabase();
    await seedDatabase();
    await AuthService.logout();
    set({
      session: null,
      currentUser: undefined,
      candidates: [],
      currentCandidateIndex: 0,
      matches: [],
      activeCallEvent: null,
    });
  },

  reseedProfiles: async () => {
    await seedDatabase();
    const candidates = ProfilesService.listCandidates();
    set({ candidates, currentCandidateIndex: 0 });
  },

  toggleAutoMatch: () => {
    const newValue = !get().autoMatchNextLike;
    setAutoMatchNextLike(newValue);
    set({ autoMatchNextLike: newValue });
  },
}));
