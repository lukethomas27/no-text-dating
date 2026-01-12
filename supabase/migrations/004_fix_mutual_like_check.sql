-- Fix mutual like check - the swipes RLS policy prevents users from seeing
-- if someone else has liked them, so we need a SECURITY DEFINER function

-- ============================================
-- FUNCTION TO CHECK FOR MUTUAL LIKE
-- ============================================
-- This function bypasses RLS to check if there's a mutual like
-- Returns true if the other user has already liked the current user

CREATE OR REPLACE FUNCTION check_mutual_like(current_user_id UUID, other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM swipes
        WHERE from_id = other_user_id
        AND to_id = current_user_id
        AND action = 'like'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO CREATE MATCH ON MUTUAL LIKE
-- ============================================
-- This function handles the entire match creation process
-- It's called after a like is created and handles the mutual like check + match creation

CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    match_id UUID;
    first_user UUID;
    second_user UUID;
BEGIN
    -- Only process likes, not passes
    IF NEW.action != 'like' THEN
        RETURN NEW;
    END IF;

    -- Check if the other user has already liked this user
    IF check_mutual_like(NEW.from_id, NEW.to_id) THEN
        -- Ensure consistent ordering for user_a_id and user_b_id
        IF NEW.from_id < NEW.to_id THEN
            first_user := NEW.from_id;
            second_user := NEW.to_id;
        ELSE
            first_user := NEW.to_id;
            second_user := NEW.from_id;
        END IF;

        -- Check if match already exists
        IF NOT EXISTS (
            SELECT 1 FROM matches 
            WHERE user_a_id = first_user AND user_b_id = second_user
        ) THEN
            -- Create the match
            INSERT INTO matches (user_a_id, user_b_id, state)
            VALUES (first_user, second_user, 'active')
            RETURNING id INTO match_id;

            -- Create the call thread for this match
            INSERT INTO call_threads (match_id, scheduling_state)
            VALUES (match_id, 'pending');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER FOR AUTO-MATCHING
-- ============================================
-- Drop trigger if it exists (in case of re-run)
DROP TRIGGER IF EXISTS on_like_check_match ON swipes;

-- Create trigger to automatically create matches on mutual likes
CREATE TRIGGER on_like_check_match
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_like();
