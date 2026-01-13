-- Add gender, sexuality, birthday, and matching preferences to profiles
-- Birthday replaces age (age will be computed)

-- ============================================
-- NEW ENUMS
-- ============================================

-- Gender identity
CREATE TYPE gender AS ENUM ('man', 'woman', 'non_binary', 'other');

-- Sexual orientation  
CREATE TYPE sexuality AS ENUM (
    'straight', 
    'gay', 
    'lesbian', 
    'bisexual', 
    'pansexual', 
    'queer',
    'asexual', 
    'other'
);

-- Who the user wants to see in discovery
CREATE TYPE show_me_preference AS ENUM ('men', 'women', 'everyone');

-- ============================================
-- ALTER PROFILES TABLE
-- ============================================

-- Add new columns
ALTER TABLE profiles 
    ADD COLUMN birthday DATE,
    ADD COLUMN gender gender,
    ADD COLUMN sexuality sexuality,
    ADD COLUMN show_me show_me_preference DEFAULT 'everyone';

-- Add age constraint based on birthday (must be 18+)
ALTER TABLE profiles
    ADD CONSTRAINT profiles_birthday_adult 
    CHECK (birthday IS NULL OR birthday <= CURRENT_DATE - INTERVAL '18 years');

-- Drop the old age column constraint first, then the column
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE profiles DROP COLUMN IF EXISTS age;

-- ============================================
-- HELPER FUNCTION TO CALCULATE AGE
-- ============================================

CREATE OR REPLACE FUNCTION calculate_age(birthday DATE)
RETURNS INTEGER AS $$
BEGIN
    IF birthday IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- UPDATE RLS FOR MATCHING PREFERENCES
-- ============================================

-- Function to check if two users should see each other based on preferences
CREATE OR REPLACE FUNCTION users_match_preferences(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user1_gender gender;
    user1_show_me show_me_preference;
    user2_gender gender;
    user2_show_me show_me_preference;
BEGIN
    -- Get user preferences
    SELECT p.gender, p.show_me INTO user1_gender, user1_show_me
    FROM profiles p WHERE p.id = user1_id;
    
    SELECT p.gender, p.show_me INTO user2_gender, user2_show_me
    FROM profiles p WHERE p.id = user2_id;
    
    -- If either user hasn't set preferences, allow match
    IF user1_gender IS NULL OR user1_show_me IS NULL OR 
       user2_gender IS NULL OR user2_show_me IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user1 wants to see user2's gender
    IF user1_show_me = 'men' AND user2_gender != 'man' THEN
        RETURN FALSE;
    END IF;
    IF user1_show_me = 'women' AND user2_gender != 'woman' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user2 wants to see user1's gender
    IF user2_show_me = 'men' AND user1_gender != 'man' THEN
        RETURN FALSE;
    END IF;
    IF user2_show_me = 'women' AND user1_gender != 'woman' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
