-- No Text Dating - Supabase Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE swipe_action AS ENUM ('like', 'pass');
CREATE TYPE match_state AS ENUM ('active', 'archived', 'blocked');
CREATE TYPE scheduling_state AS ENUM ('pending', 'proposed', 'confirmed');
CREATE TYPE call_type AS ENUM ('audio', 'video');
CREATE TYPE call_state AS ENUM ('scheduled', 'live', 'completed', 'missed', 'canceled');
CREATE TYPE feedback_rating AS ENUM ('interested', 'not_interested');
CREATE TYPE report_category AS ENUM ('inappropriate', 'fake', 'harassment', 'spam', 'other');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
    prompts TEXT[] NOT NULL DEFAULT '{"", "", ""}' CHECK (array_length(prompts, 1) = 3),
    photos TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Swipes table
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action swipe_action NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_id, to_id)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    state match_state NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id)
);

-- Call threads table
CREATE TABLE call_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
    scheduling_state scheduling_state NOT NULL DEFAULT 'pending',
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call proposals table
CREATE TABLE call_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES call_threads(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    call_type call_type NOT NULL,
    slots TIMESTAMPTZ[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call events table
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES call_threads(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 900,
    call_type call_type NOT NULL,
    state call_state NOT NULL DEFAULT 'scheduled',
    provider_join_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedbacks table
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_event_id UUID NOT NULL REFERENCES call_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating feedback_rating NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(call_event_id, user_id)
);

-- Blocks table
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category report_category NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_swipes_from_id ON swipes(from_id);
CREATE INDEX idx_swipes_to_id ON swipes(to_id);
CREATE INDEX idx_swipes_action ON swipes(action) WHERE action = 'like';

CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);
CREATE INDEX idx_matches_state ON matches(state);

CREATE INDEX idx_call_threads_match ON call_threads(match_id);

CREATE INDEX idx_call_proposals_thread ON call_proposals(thread_id);
CREATE INDEX idx_call_proposals_proposed_by ON call_proposals(proposed_by);

CREATE INDEX idx_call_events_thread ON call_events(thread_id);
CREATE INDEX idx_call_events_state ON call_events(state);
CREATE INDEX idx_call_events_scheduled ON call_events(scheduled_start);

CREATE INDEX idx_feedbacks_call_event ON feedbacks(call_event_id);
CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to check if user is participant in a match
CREATE OR REPLACE FUNCTION is_match_participant(match_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND (user_a_id = user_id OR user_b_id = user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are blocked
CREATE OR REPLACE FUNCTION are_users_blocked(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = user1 AND blocked_id = user2)
           OR (blocker_id = user2 AND blocked_id = user1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view non-blocked profiles"
    ON profiles FOR SELECT
    USING (
        NOT are_users_blocked(auth.uid(), id)
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Swipes policies
CREATE POLICY "Users can view own swipes"
    ON swipes FOR SELECT
    USING (auth.uid() = from_id);

CREATE POLICY "Users can create swipes"
    ON swipes FOR INSERT
    WITH CHECK (
        auth.uid() = from_id
        AND NOT are_users_blocked(from_id, to_id)
    );

-- Matches policies
CREATE POLICY "Users can view own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can create matches they participate in"
    ON matches FOR INSERT
    WITH CHECK (
        auth.uid() = user_a_id OR auth.uid() = user_b_id
    );

-- Call threads policies
CREATE POLICY "Match participants can view call threads"
    ON call_threads FOR SELECT
    USING (is_match_participant(match_id, auth.uid()));

CREATE POLICY "Match participants can create call threads"
    ON call_threads FOR INSERT
    WITH CHECK (is_match_participant(match_id, auth.uid()));

CREATE POLICY "Match participants can update call threads"
    ON call_threads FOR UPDATE
    USING (is_match_participant(match_id, auth.uid()));

-- Call proposals policies
CREATE POLICY "Match participants can view proposals"
    ON call_proposals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );

CREATE POLICY "Match participants can create proposals"
    ON call_proposals FOR INSERT
    WITH CHECK (
        auth.uid() = proposed_by
        AND EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );

-- Call events policies
CREATE POLICY "Match participants can view call events"
    ON call_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );

CREATE POLICY "Match participants can create call events"
    ON call_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );

CREATE POLICY "Match participants can update call events"
    ON call_events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );

-- Feedbacks policies
CREATE POLICY "Users can view own feedback"
    ON feedbacks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
    ON feedbacks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Blocks policies
CREATE POLICY "Users can view own blocks"
    ON blocks FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
    ON blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks"
    ON blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- Reports policies
CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS (optional)
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE call_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE call_events;
