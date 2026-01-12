// Supabase repository - replaces localRepo for production use

import { supabase } from '../lib/supabase';
import {
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
import {
  DbProfile,
  DbSwipe,
  DbMatch,
  DbCallThread,
  DbCallProposal,
  DbCallEvent,
  DbFeedback,
  DbBlock,
  DbReport,
} from '../types/database';

// ============ Type Converters (snake_case <-> camelCase) ============

const toUserProfile = (db: DbProfile): UserProfile => ({
  id: db.id,
  name: db.name,
  age: db.age,
  prompts: db.prompts as [string, string, string],
  photos: db.photos,
  bio: db.bio ?? undefined,
  createdAt: db.created_at,
});

const toSwipe = (db: DbSwipe): Swipe => ({
  fromId: db.from_id,
  toId: db.to_id,
  action: db.action,
  createdAt: db.created_at,
});

const toMatch = (db: DbMatch): Match => ({
  id: db.id,
  userAId: db.user_a_id,
  userBId: db.user_b_id,
  state: db.state,
  createdAt: db.created_at,
});

const toCallThread = (db: DbCallThread): CallThread => ({
  id: db.id,
  matchId: db.match_id,
  schedulingState: db.scheduling_state,
  lastActivityAt: db.last_activity_at,
});

const toCallProposal = (db: DbCallProposal): CallProposal => ({
  id: db.id,
  threadId: db.thread_id,
  proposedBy: db.proposed_by,
  callType: db.call_type,
  slots: db.slots,
  createdAt: db.created_at,
});

const toCallEvent = (db: DbCallEvent): CallEvent => ({
  id: db.id,
  threadId: db.thread_id,
  scheduledStartISO: db.scheduled_start,
  durationSeconds: db.duration_seconds,
  callType: db.call_type,
  state: db.state,
  providerJoinUrl: db.provider_join_url ?? undefined,
});

const toFeedback = (db: DbFeedback): Feedback => ({
  id: db.id,
  callEventId: db.call_event_id,
  userId: db.user_id,
  rating: db.rating,
  createdAt: db.created_at,
});

const toBlock = (db: DbBlock): Block => ({
  blockerId: db.blocker_id,
  blockedId: db.blocked_id,
  createdAt: db.created_at,
});

const toReport = (db: DbReport): Report => ({
  reporterId: db.reporter_id,
  reportedId: db.reported_id,
  category: db.category,
  notes: db.notes ?? undefined,
  createdAt: db.created_at,
});

// ============ Auth Operations ============

export const getSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    userId: session.user.id,
    createdAt: session.user.created_at,
  };
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export const sendOtp = async (phone: string): Promise<{ isNewUser: boolean }> => {
  // Check if user already exists by looking for a profile with this phone
  // Note: We can't directly check auth.users, so we assume new user for now
  // and handle it in verifyOtp based on profile existence

  console.log('supabaseRepo.sendOtp called with:', phone);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  console.log('signInWithOtp response:', { data, error });

  if (error) {
    console.error('Supabase OTP error:', error);
    throw new Error(error.message || 'Failed to send verification code');
  }

  // We'll determine if they're new after OTP verification
  return { isNewUser: false };
};

export const verifyOtp = async (phone: string, token: string): Promise<Session> => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user returned from verification');

  return {
    userId: data.user.id,
    createdAt: data.user.created_at,
  };
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ============ Profile Operations ============

export const getProfile = async (id: string): Promise<UserProfile | undefined> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return toUserProfile(data);
};

export const getMyProfile = async (): Promise<UserProfile | undefined> => {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;
  return getProfile(userId);
};

export const createProfile = async (
  profile: Omit<UserProfile, 'id' | 'createdAt'>
): Promise<UserProfile> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: profile.name,
      age: profile.age,
      prompts: profile.prompts,
      photos: profile.photos,
      bio: profile.bio ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toUserProfile(data);
};

export const updateProfile = async (
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<UserProfile | undefined> => {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      age: updates.age,
      prompts: updates.prompts,
      photos: updates.photos,
      bio: updates.bio ?? null,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return toUserProfile(data);
};

export const getAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  if (error) throw error;
  return data.map(toUserProfile);
};

// ============ Discovery Operations ============

export const getCandidates = async (): Promise<UserProfile[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Get IDs of users we've already swiped on
  const { data: swipes } = await supabase
    .from('swipes')
    .select('to_id')
    .eq('from_id', userId);
  const swipedIds = swipes?.map(s => s.to_id) ?? [];

  // Get blocked user IDs (both directions)
  const { data: blocksOut } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  const { data: blocksIn } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocked_id', userId);

  const blockedIds = [
    ...(blocksOut?.map(b => b.blocked_id) ?? []),
    ...(blocksIn?.map(b => b.blocker_id) ?? []),
  ];

  const excludeIds = [...new Set([userId, ...swipedIds, ...blockedIds])];

  // Get candidates excluding swiped and blocked users
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${excludeIds.join(',')})`);

  if (error) throw error;
  return data.map(toUserProfile);
};

// ============ Swipe Operations ============

export const createSwipe = async (
  toId: string,
  action: 'like' | 'pass'
): Promise<{ swipe: Swipe; isMatch: boolean; matchId?: string }> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Create the swipe
  const { data: swipeData, error: swipeError } = await supabase
    .from('swipes')
    .insert({
      from_id: userId,
      to_id: toId,
      action,
    })
    .select()
    .single();

  if (swipeError) throw swipeError;

  let isMatch = false;
  let matchId: string | undefined;

  if (action === 'like') {
    // Check for mutual like
    const { data: mutualSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('from_id', toId)
      .eq('to_id', userId)
      .eq('action', 'like')
      .single();

    if (mutualSwipe) {
      // Create match
      const match = await createMatch(userId, toId);
      isMatch = true;
      matchId = match.id;
    }
  }

  return {
    swipe: toSwipe(swipeData),
    isMatch,
    matchId,
  };
};

export const getSwipes = async (): Promise<Swipe[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('swipes')
    .select('*')
    .eq('from_id', userId);

  if (error) throw error;
  return data.map(toSwipe);
};

// ============ Match Operations ============

export const createMatch = async (userAId: string, userBId: string): Promise<Match> => {
  // Ensure consistent ordering
  const [first, second] = [userAId, userBId].sort();

  const { data, error } = await supabase
    .from('matches')
    .insert({
      user_a_id: first,
      user_b_id: second,
      state: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  // Create call thread for this match
  await createCallThread(data.id);

  return toMatch(data);
};

export const getMatches = async (): Promise<Match[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq('state', 'active');

  if (error) throw error;
  return data.map(toMatch);
};

export const getMatch = async (matchId: string): Promise<Match | undefined> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error || !data) return undefined;
  return toMatch(data);
};

export const updateMatchState = async (
  matchId: string,
  state: Match['state']
): Promise<void> => {
  const { error } = await supabase
    .from('matches')
    .update({ state })
    .eq('id', matchId);

  if (error) throw error;
};

// ============ Call Thread Operations ============

export const createCallThread = async (matchId: string): Promise<CallThread> => {
  const { data, error } = await supabase
    .from('call_threads')
    .insert({
      match_id: matchId,
      scheduling_state: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return toCallThread(data);
};

export const getCallThread = async (matchId: string): Promise<CallThread | undefined> => {
  const { data, error } = await supabase
    .from('call_threads')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error || !data) return undefined;
  return toCallThread(data);
};

export const getCallThreadById = async (threadId: string): Promise<CallThread | undefined> => {
  const { data, error } = await supabase
    .from('call_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (error || !data) return undefined;
  return toCallThread(data);
};

export const updateCallThreadState = async (
  threadId: string,
  state: CallThread['schedulingState']
): Promise<void> => {
  const { error } = await supabase
    .from('call_threads')
    .update({
      scheduling_state: state,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', threadId);

  if (error) throw error;
};

// ============ Call Proposal Operations ============

export const createProposal = async (
  threadId: string,
  callType: 'audio' | 'video',
  slots: string[]
): Promise<CallProposal> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('call_proposals')
    .insert({
      thread_id: threadId,
      proposed_by: userId,
      call_type: callType,
      slots,
    })
    .select()
    .single();

  if (error) throw error;

  // Update thread state
  await updateCallThreadState(threadId, 'proposed');

  return toCallProposal(data);
};

export const getProposalsForThread = async (threadId: string): Promise<CallProposal[]> => {
  const { data, error } = await supabase
    .from('call_proposals')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(toCallProposal);
};

export const getLatestProposal = async (threadId: string): Promise<CallProposal | undefined> => {
  const { data, error } = await supabase
    .from('call_proposals')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return toCallProposal(data);
};

// ============ Call Event Operations ============

export const createCallEvent = async (
  threadId: string,
  scheduledStartISO: string,
  callType: 'audio' | 'video',
  durationSeconds: number = 900
): Promise<CallEvent> => {
  const { data, error } = await supabase
    .from('call_events')
    .insert({
      thread_id: threadId,
      scheduled_start: scheduledStartISO,
      call_type: callType,
      duration_seconds: durationSeconds,
      state: 'scheduled',
      provider_join_url: `mock://call/${Date.now()}`, // Replace with real provider URL
    })
    .select()
    .single();

  if (error) throw error;

  // Update thread state
  await updateCallThreadState(threadId, 'confirmed');

  return toCallEvent(data);
};

export const getCallEvent = async (eventId: string): Promise<CallEvent | undefined> => {
  const { data, error } = await supabase
    .from('call_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !data) return undefined;
  return toCallEvent(data);
};

export const getUpcomingCall = async (threadId: string): Promise<CallEvent | undefined> => {
  const { data, error } = await supabase
    .from('call_events')
    .select('*')
    .eq('thread_id', threadId)
    .in('state', ['scheduled', 'live'])
    .single();

  if (error || !data) return undefined;
  return toCallEvent(data);
};

export const updateCallEventState = async (
  eventId: string,
  state: CallEvent['state']
): Promise<void> => {
  const { error } = await supabase
    .from('call_events')
    .update({ state })
    .eq('id', eventId);

  if (error) throw error;
};

// ============ Feedback Operations ============

export const createFeedback = async (
  callEventId: string,
  rating: 'interested' | 'not_interested'
): Promise<Feedback> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      call_event_id: callEventId,
      user_id: userId,
      rating,
    })
    .select()
    .single();

  if (error) throw error;
  return toFeedback(data);
};

export const getFeedback = async (
  callEventId: string
): Promise<Feedback | undefined> => {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;

  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('call_event_id', callEventId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return undefined;
  return toFeedback(data);
};

// ============ Block Operations ============

export const createBlock = async (blockedId: string): Promise<Block> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: userId,
      blocked_id: blockedId,
    })
    .select()
    .single();

  if (error) throw error;

  // Archive any matches between these users
  await supabase
    .from('matches')
    .update({ state: 'blocked' })
    .or(`and(user_a_id.eq.${userId},user_b_id.eq.${blockedId}),and(user_a_id.eq.${blockedId},user_b_id.eq.${userId})`);

  return toBlock(data);
};

export const getBlocks = async (): Promise<Block[]> => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('blocker_id', userId);

  if (error) throw error;
  return data.map(toBlock);
};

// ============ Report Operations ============

export const createReport = async (
  reportedId: string,
  category: Report['category'],
  notes?: string
): Promise<Report> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: userId,
      reported_id: reportedId,
      category,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toReport(data);
};

// ============ Photo Storage Operations ============

/**
 * Upload a profile photo to Supabase Storage
 * @param uri - Local file URI from image picker
 * @returns Public URL of the uploaded photo
 */
export const uploadProfilePhoto = async (uri: string): Promise<string> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${timestamp}.${fileExtension}`;

  // Fetch the image as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Determine content type
  let contentType = 'image/jpeg';
  if (fileExtension === 'png') contentType = 'image/png';
  else if (fileExtension === 'webp') contentType = 'image/webp';

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, blob, {
      contentType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName);

  return publicUrl;
};

/**
 * Delete a profile photo from Supabase Storage
 * @param url - Public URL of the photo to delete
 */
export const deleteProfilePhoto = async (url: string): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Extract file path from URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/profile-photos/userId/timestamp.jpg
  const urlParts = url.split('/profile-photos/');
  if (urlParts.length !== 2) {
    console.warn('Invalid photo URL format, skipping deletion:', url);
    return;
  }

  const filePath = urlParts[1];

  // Verify the file belongs to this user
  if (!filePath.startsWith(userId)) {
    throw new Error('Cannot delete another user\'s photo');
  }

  const { error } = await supabase.storage
    .from('profile-photos')
    .remove([filePath]);

  if (error) throw error;
};

/**
 * Check if a URL is a Supabase Storage URL (vs external placeholder)
 */
export const isStorageUrl = (url: string): boolean => {
  return url.includes('supabase') && url.includes('/profile-photos/');
};