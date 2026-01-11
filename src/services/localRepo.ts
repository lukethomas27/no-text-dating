import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  LocalDatabase,
  UserProfile,
  Swipe,
  Match,
  CallThread,
  CallProposal,
  CallEvent,
  Feedback,
  Block,
  Report,
  Session,
} from '../types';
import { SEED_PROFILES } from './seedData';

const STORAGE_KEY = '@no_text_dating_db';

// Initial empty database
const createEmptyDatabase = (): LocalDatabase => ({
  profiles: [],
  swipes: [],
  matches: [],
  callThreads: [],
  callProposals: [],
  callEvents: [],
  feedbacks: [],
  blocks: [],
  reports: [],
  session: null,
});

// In-memory database
let db: LocalDatabase = createEmptyDatabase();

// Dev settings
let devSettings = {
  autoMatchNextLike: false,
};

export const getDevSettings = () => devSettings;
export const setAutoMatchNextLike = (value: boolean) => {
  devSettings.autoMatchNextLike = value;
};

// Persistence helpers
export const saveToStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Failed to save database:', error);
  }
};

export const loadFromStorage = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      db = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load database:', error);
  }
};

export const resetDatabase = async (): Promise<void> => {
  db = createEmptyDatabase();
  await saveToStorage();
};

export const seedDatabase = async (): Promise<void> => {
  // Add seed profiles if they don't exist
  const existingIds = new Set(db.profiles.map((p) => p.id));
  for (const profile of SEED_PROFILES) {
    if (!existingIds.has(profile.id)) {
      db.profiles.push(profile);
    }
  }
  await saveToStorage();
};

// Initialize database
export const initDatabase = async (): Promise<void> => {
  await loadFromStorage();
  await seedDatabase();
};

// ============ Profile Operations ============

export const getProfile = (id: string): UserProfile | undefined => {
  return db.profiles.find((p) => p.id === id);
};

export const getAllProfiles = (): UserProfile[] => {
  return [...db.profiles];
};

export const createProfile = async (
  profile: Omit<UserProfile, 'id' | 'createdAt'>
): Promise<UserProfile> => {
  const newProfile: UserProfile = {
    ...profile,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  db.profiles.push(newProfile);
  await saveToStorage();
  return newProfile;
};

export const updateProfile = async (
  id: string,
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<UserProfile | undefined> => {
  const index = db.profiles.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  db.profiles[index] = { ...db.profiles[index], ...updates };
  await saveToStorage();
  return db.profiles[index];
};

// ============ Session Operations ============

export const getSession = (): Session | null => {
  return db.session;
};

export const createSession = async (userId: string): Promise<Session> => {
  const session: Session = {
    userId,
    createdAt: new Date().toISOString(),
  };
  db.session = session;
  await saveToStorage();
  return session;
};

export const clearSession = async (): Promise<void> => {
  db.session = null;
  await saveToStorage();
};

// ============ Swipe Operations ============

export const getSwipes = (userId: string): Swipe[] => {
  return db.swipes.filter((s) => s.fromId === userId);
};

export const hasSwipedOn = (fromId: string, toId: string): boolean => {
  return db.swipes.some((s) => s.fromId === fromId && s.toId === toId);
};

export const createSwipe = async (
  fromId: string,
  toId: string,
  action: 'like' | 'pass'
): Promise<{ swipe: Swipe; isMatch: boolean; matchId?: string }> => {
  const swipe: Swipe = {
    fromId,
    toId,
    action,
    createdAt: new Date().toISOString(),
  };
  db.swipes.push(swipe);

  let isMatch = false;
  let matchId: string | undefined;

  if (action === 'like') {
    // Check for mutual like or auto-match in dev mode
    const mutualLike = db.swipes.find(
      (s) => s.fromId === toId && s.toId === fromId && s.action === 'like'
    );

    if (mutualLike || devSettings.autoMatchNextLike) {
      isMatch = true;
      const match = await createMatch(fromId, toId);
      matchId = match.id;
    }
  }

  await saveToStorage();
  return { swipe, isMatch, matchId };
};

// ============ Match Operations ============

export const getMatches = (userId: string): Match[] => {
  return db.matches.filter(
    (m) =>
      (m.userAId === userId || m.userBId === userId) && m.state === 'active'
  );
};

export const getMatch = (matchId: string): Match | undefined => {
  return db.matches.find((m) => m.id === matchId);
};

export const createMatch = async (
  userAId: string,
  userBId: string
): Promise<Match> => {
  const match: Match = {
    id: uuidv4(),
    userAId,
    userBId,
    state: 'active',
    createdAt: new Date().toISOString(),
  };
  db.matches.push(match);

  // Create a call thread for this match
  await createCallThread(match.id);

  await saveToStorage();
  return match;
};

export const updateMatchState = async (
  matchId: string,
  state: Match['state']
): Promise<void> => {
  const match = db.matches.find((m) => m.id === matchId);
  if (match) {
    match.state = state;
    await saveToStorage();
  }
};

// ============ Call Thread Operations ============

export const getCallThread = (matchId: string): CallThread | undefined => {
  return db.callThreads.find((t) => t.matchId === matchId);
};

export const getCallThreadById = (threadId: string): CallThread | undefined => {
  return db.callThreads.find((t) => t.id === threadId);
};

export const createCallThread = async (matchId: string): Promise<CallThread> => {
  const thread: CallThread = {
    id: uuidv4(),
    matchId,
    schedulingState: 'pending',
    lastActivityAt: new Date().toISOString(),
  };
  db.callThreads.push(thread);
  await saveToStorage();
  return thread;
};

export const updateCallThreadState = async (
  threadId: string,
  state: CallThread['schedulingState']
): Promise<void> => {
  const thread = db.callThreads.find((t) => t.id === threadId);
  if (thread) {
    thread.schedulingState = state;
    thread.lastActivityAt = new Date().toISOString();
    await saveToStorage();
  }
};

// ============ Call Proposal Operations ============

export const getProposalsForThread = (threadId: string): CallProposal[] => {
  return db.callProposals.filter((p) => p.threadId === threadId);
};

export const getLatestProposal = (threadId: string): CallProposal | undefined => {
  const proposals = getProposalsForThread(threadId);
  return proposals.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
};

export const createProposal = async (
  threadId: string,
  proposedBy: string,
  callType: 'audio' | 'video',
  slots: string[]
): Promise<CallProposal> => {
  const proposal: CallProposal = {
    id: uuidv4(),
    threadId,
    proposedBy,
    callType,
    slots,
    createdAt: new Date().toISOString(),
  };
  db.callProposals.push(proposal);
  await updateCallThreadState(threadId, 'proposed');
  await saveToStorage();
  return proposal;
};

// ============ Call Event Operations ============

export const getCallEvent = (eventId: string): CallEvent | undefined => {
  return db.callEvents.find((e) => e.id === eventId);
};

export const getUpcomingCall = (threadId: string): CallEvent | undefined => {
  return db.callEvents.find(
    (e) => e.threadId === threadId && (e.state === 'scheduled' || e.state === 'live')
  );
};

export const createCallEvent = async (
  threadId: string,
  scheduledStartISO: string,
  callType: 'audio' | 'video',
  durationSeconds: number = 900 // 15 minutes default
): Promise<CallEvent> => {
  const event: CallEvent = {
    id: uuidv4(),
    threadId,
    scheduledStartISO,
    durationSeconds,
    callType,
    state: 'scheduled',
    providerJoinUrl: `mock://call/${uuidv4()}`,
  };
  db.callEvents.push(event);
  await updateCallThreadState(threadId, 'confirmed');
  await saveToStorage();
  return event;
};

export const updateCallEventState = async (
  eventId: string,
  state: CallEvent['state']
): Promise<void> => {
  const event = db.callEvents.find((e) => e.id === eventId);
  if (event) {
    event.state = state;
    await saveToStorage();
  }
};

// ============ Feedback Operations ============

export const createFeedback = async (
  callEventId: string,
  userId: string,
  rating: 'interested' | 'not_interested'
): Promise<Feedback> => {
  const feedback: Feedback = {
    id: uuidv4(),
    callEventId,
    userId,
    rating,
    createdAt: new Date().toISOString(),
  };
  db.feedbacks.push(feedback);
  await saveToStorage();
  return feedback;
};

export const getFeedback = (
  callEventId: string,
  userId: string
): Feedback | undefined => {
  return db.feedbacks.find(
    (f) => f.callEventId === callEventId && f.userId === userId
  );
};

// ============ Block Operations ============

export const getBlocks = (userId: string): Block[] => {
  return db.blocks.filter((b) => b.blockerId === userId);
};

export const isBlocked = (blockerId: string, blockedId: string): boolean => {
  return db.blocks.some(
    (b) =>
      (b.blockerId === blockerId && b.blockedId === blockedId) ||
      (b.blockerId === blockedId && b.blockedId === blockerId)
  );
};

export const createBlock = async (
  blockerId: string,
  blockedId: string
): Promise<Block> => {
  const block: Block = {
    blockerId,
    blockedId,
    createdAt: new Date().toISOString(),
  };
  db.blocks.push(block);

  // Archive any matches between these users
  for (const match of db.matches) {
    if (
      (match.userAId === blockerId && match.userBId === blockedId) ||
      (match.userAId === blockedId && match.userBId === blockerId)
    ) {
      match.state = 'blocked';
    }
  }

  await saveToStorage();
  return block;
};

// ============ Report Operations ============

export const createReport = async (
  reporterId: string,
  reportedId: string,
  category: Report['category'],
  notes?: string
): Promise<Report> => {
  const report: Report = {
    reporterId,
    reportedId,
    category,
    notes,
    createdAt: new Date().toISOString(),
  };
  db.reports.push(report);
  await saveToStorage();
  return report;
};

// ============ Discovery Helpers ============

export const getCandidates = (userId: string): UserProfile[] => {
  const swipedIds = new Set(getSwipes(userId).map((s) => s.toId));
  const blockedIds = new Set([
    ...getBlocks(userId).map((b) => b.blockedId),
    ...db.blocks.filter((b) => b.blockedId === userId).map((b) => b.blockerId),
  ]);

  return db.profiles.filter(
    (p) => p.id !== userId && !swipedIds.has(p.id) && !blockedIds.has(p.id)
  );
};
