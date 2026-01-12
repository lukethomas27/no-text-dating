-- Migration: Switch from Email to Phone Authentication
--
-- IMPORTANT: Before running this migration, you must enable Phone Auth in Supabase:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Providers
-- 3. Enable "Phone" provider
-- 4. Configure your SMS provider (Twilio, MessageBird, or Vonage)
--    - For testing, you can use Supabase's built-in test phone numbers
--
-- Supabase Test Phone Numbers (for development):
-- - Use any phone starting with +1 555 555 followed by 4 digits
-- - Example: +15555550123
-- - OTP code is always: 123456
--

-- ============================================
-- STEP 1: Add phone column to profiles table
-- ============================================
-- This is optional but useful for querying/displaying phone numbers
-- The canonical phone is stored in auth.users.phone

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ============================================
-- STEP 2: Create function to sync phone from auth.users
-- ============================================
-- This automatically copies the phone number from auth.users to profiles

CREATE OR REPLACE FUNCTION public.sync_phone_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET phone = NEW.phone
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create trigger to sync phone on auth user update
-- ============================================
-- Note: This trigger runs on auth.users which requires special permissions
-- You may need to run this as a superuser or via Supabase dashboard

DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_phone_update ON auth.users;

  -- Create new trigger
  CREATE TRIGGER on_auth_user_phone_update
    AFTER UPDATE OF phone ON auth.users
    FOR EACH ROW
    WHEN (OLD.phone IS DISTINCT FROM NEW.phone)
    EXECUTE FUNCTION public.sync_phone_from_auth();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create trigger on auth.users - please run via Supabase Dashboard SQL Editor';
END $$;

-- ============================================
-- STEP 4: Update RLS policies (if needed)
-- ============================================
-- The existing RLS policies should work fine with phone auth
-- since they use auth.uid() which works with any auth method

-- Optional: Add policy to prevent users from updating their phone directly
-- (phone should only be set by the auth system)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users cannot update phone directly'
  ) THEN
    CREATE POLICY "Users cannot update phone directly"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (
        auth.uid() = id
        AND (phone IS NOT DISTINCT FROM (SELECT phone FROM public.profiles WHERE id = auth.uid()))
      );
  END IF;
END $$;

-- ============================================
-- STEP 5: Backfill existing users' phone numbers (if any)
-- ============================================
-- This updates profiles with phone numbers from auth.users

UPDATE public.profiles p
SET phone = u.phone
FROM auth.users u
WHERE p.id = u.id
AND u.phone IS NOT NULL
AND p.phone IS NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the migration was successful:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone';
