-- Fix missing INSERT policies for matches, call_threads, and call_events
-- These tables had RLS enabled but no INSERT policies, preventing match creation

-- ============================================
-- MATCHES INSERT POLICY
-- ============================================
-- Allow users to create a match when they are one of the participants
-- This happens when there's a mutual like

CREATE POLICY "Users can create matches they participate in"
    ON matches FOR INSERT
    WITH CHECK (
        auth.uid() = user_a_id OR auth.uid() = user_b_id
    );

-- ============================================
-- CALL THREADS INSERT POLICY
-- ============================================
-- Allow match participants to create call threads for their matches

CREATE POLICY "Match participants can create call threads"
    ON call_threads FOR INSERT
    WITH CHECK (
        is_match_participant(match_id, auth.uid())
    );

-- ============================================
-- CALL EVENTS INSERT POLICY
-- ============================================
-- Allow match participants to create call events

CREATE POLICY "Match participants can create call events"
    ON call_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM call_threads ct
            WHERE ct.id = thread_id
            AND is_match_participant(ct.match_id, auth.uid())
        )
    );
