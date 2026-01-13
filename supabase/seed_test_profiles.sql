-- Seed 20 test profiles for No Text Dating
-- Run this in Supabase SQL Editor with service_role access
-- These create fake auth users and corresponding profiles

-- Generate consistent UUIDs for test users (using md5 hash of names for reproducibility)
DO $$
DECLARE
    test_users TEXT[] := ARRAY[
        'Emma', 'Liam', 'Olivia', 'Noah', 'Ava',
        'Ethan', 'Sophia', 'Mason', 'Isabella', 'Logan',
        'Mia', 'Lucas', 'Charlotte', 'Aiden', 'Amelia',
        'Jackson', 'Harper', 'Sebastian', 'Evelyn', 'Mateo'
    ];
    -- Birthdays (ages 22-33)
    birthdays DATE[] := ARRAY[
        '2002-03-15'::DATE, '1998-07-22'::DATE, '2000-01-10'::DATE, '1995-11-30'::DATE, '2003-05-18'::DATE,
        '1997-09-05'::DATE, '1999-12-25'::DATE, '1994-04-12'::DATE, '2001-08-08'::DATE, '1996-02-28'::DATE,
        '1998-06-14'::DATE, '2000-10-03'::DATE, '1997-03-21'::DATE, '2002-07-07'::DATE, '1995-09-16'::DATE,
        '1999-01-29'::DATE, '2001-11-11'::DATE, '1993-05-25'::DATE, '2004-02-14'::DATE, '1998-08-19'::DATE
    ];
    genders gender[] := ARRAY[
        'woman'::gender, 'man'::gender, 'woman'::gender, 'man'::gender, 'woman'::gender,
        'man'::gender, 'woman'::gender, 'man'::gender, 'woman'::gender, 'man'::gender,
        'woman'::gender, 'man'::gender, 'woman'::gender, 'man'::gender, 'non_binary'::gender,
        'man'::gender, 'woman'::gender, 'man'::gender, 'woman'::gender, 'man'::gender
    ];
    sexualities sexuality[] := ARRAY[
        'straight'::sexuality, 'straight'::sexuality, 'bisexual'::sexuality, 'straight'::sexuality, 'lesbian'::sexuality,
        'gay'::sexuality, 'straight'::sexuality, 'bisexual'::sexuality, 'straight'::sexuality, 'straight'::sexuality,
        'pansexual'::sexuality, 'straight'::sexuality, 'straight'::sexuality, 'gay'::sexuality, 'queer'::sexuality,
        'straight'::sexuality, 'bisexual'::sexuality, 'straight'::sexuality, 'straight'::sexuality, 'straight'::sexuality
    ];
    show_me_prefs show_me_preference[] := ARRAY[
        'men'::show_me_preference, 'women'::show_me_preference, 'everyone'::show_me_preference, 'women'::show_me_preference, 'women'::show_me_preference,
        'men'::show_me_preference, 'men'::show_me_preference, 'everyone'::show_me_preference, 'men'::show_me_preference, 'women'::show_me_preference,
        'everyone'::show_me_preference, 'women'::show_me_preference, 'men'::show_me_preference, 'men'::show_me_preference, 'everyone'::show_me_preference,
        'women'::show_me_preference, 'everyone'::show_me_preference, 'women'::show_me_preference, 'men'::show_me_preference, 'women'::show_me_preference
    ];
    bios TEXT[] := ARRAY[
        'Adventure seeker who loves spontaneous road trips 🚗',
        'Software engineer by day, amateur chef by night',
        'Yoga enthusiast looking for my zen partner',
        'Dog dad to the cutest golden retriever 🐕',
        'Bookworm with a passion for coffee shops',
        'Music producer creating beats and memories',
        'Travel addict with 25 countries under my belt',
        'Fitness coach who believes in balance (pizza counts)',
        'Artist painting my way through life 🎨',
        'Startup founder running on coffee and dreams',
        'Food blogger always hunting the best tacos',
        'Film buff with strong opinions on cinema',
        'Nurse with a heart of gold and nerves of steel',
        'DJ spinning tracks and good vibes only',
        'Marine biologist saving the oceans one day at a time',
        'Architect designing spaces and connections',
        'Teacher shaping minds and loving every minute',
        'Photographer capturing life one frame at a time',
        'Dancer who moves to the rhythm of life',
        'Pilot with stories from 30,000 feet ✈️'
    ];
    prompts1 TEXT[] := ARRAY[
        'My idea of a perfect weekend: hiking then brunch',
        'I geek out about clean code and good coffee',
        'You''ll find me at sunrise doing sun salutations',
        'My dog is my best wingman, just saying',
        'Currently reading: something with 500+ pages',
        'Best thing I can make: beats that slap 🎵',
        'My passport is my most prized possession',
        'Leg day is every day (okay maybe not every day)',
        'I see colors where others see blank walls',
        'Building the future one startup at a time',
        'I never say no to trying a new restaurant',
        'Hot take: the book is always better',
        'Healthcare heroes unite! 💪',
        'The dance floor is my second home',
        'Saving the planet one research paper at a time',
        'I design buildings but I''m building connections',
        'Making a difference, one student at a time',
        'Golden hour is the best hour 📸',
        'Life is better when you''re dancing',
        'Ask me about the view from above the clouds'
    ];
    prompts2 TEXT[] := ARRAY[
        'Looking for someone to share trail mix with',
        'I''ll debug your code and your bad day',
        'Seeking someone who values mindfulness',
        'Must love dogs - non-negotiable! 🐾',
        'Let''s have deep conversations over lattes',
        'I''ll write a song about our first date',
        'Next destination: wherever you want to go',
        'I''ll be your gym buddy and pizza partner',
        'Let me paint your portrait someday',
        'Looking for my co-founder in life',
        'I''ll share my secret food spots with you',
        'Movie marathons are my love language',
        'I''ll take care of you when you''re sick',
        'I''ll teach you my best dance moves',
        'Beach cleanups count as dates, right?',
        'I''ll design our dream home together',
        'Learning together is the best adventure',
        'I''ll capture all our memories forever',
        'Dance with me under the stars ✨',
        'First date idea: sunset flight'
    ];
    prompts3 TEXT[] := ARRAY[
        'Green flags: loves nature and bad puns',
        'Warning: I talk about tech too much',
        'I believe in good energy and good people',
        'My idea of romance: walks in the park together',
        'I fall in love with minds, not just faces',
        'Frequency check: how often do you dance?',
        'Spontaneous trips are the best trips',
        'Looking for someone who celebrates small wins',
        'Creativity is the ultimate love language',
        'I want a partner, not just a plus one',
        'The way to my heart is through my stomach',
        'I have strong opinions, loosely held',
        'Compassion is my superpower',
        'Good vibes only - seriously',
        'Looking for someone who cares about our planet',
        'Details matter - in buildings and relationships',
        'Patience is my greatest virtue',
        'I notice the little things ❤️',
        'Movement is medicine',
        'Adventure awaits!'
    ];
    user_id UUID;
    i INT;
BEGIN
    FOR i IN 1..20 LOOP
        -- Generate a consistent UUID for each test user
        user_id := md5(test_users[i] || '-test-user')::uuid;
        
        -- Insert into auth.users (requires service_role)
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            user_id,
            '00000000-0000-0000-0000-000000000000',
            lower(test_users[i]) || '@test.notextdating.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            FALSE,
            'authenticated'
        ) ON CONFLICT (id) DO NOTHING;

        -- Insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            user_id,
            jsonb_build_object('sub', user_id::text, 'email', lower(test_users[i]) || '@test.notextdating.com'),
            'email',
            user_id::text,
            NOW(),
            NOW()
        ) ON CONFLICT (provider, provider_id) DO NOTHING;

        -- Insert profile with new fields
        INSERT INTO profiles (id, name, birthday, gender, sexuality, show_me, prompts, photos, bio, created_at)
        VALUES (
            user_id,
            test_users[i],
            birthdays[i],
            genders[i],
            sexualities[i],
            show_me_prefs[i],
            ARRAY[prompts1[i], prompts2[i], prompts3[i]],
            ARRAY[
                'https://i.pravatar.cc/400?u=' || test_users[i] || '1',
                'https://i.pravatar.cc/400?u=' || test_users[i] || '2'
            ],
            bios[i],
            NOW() - (i || ' days')::interval
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            birthday = EXCLUDED.birthday,
            gender = EXCLUDED.gender,
            sexuality = EXCLUDED.sexuality,
            show_me = EXCLUDED.show_me,
            prompts = EXCLUDED.prompts,
            photos = EXCLUDED.photos,
            bio = EXCLUDED.bio;
    END LOOP;
    
    RAISE NOTICE 'Created 20 test profiles successfully!';
END $$;

-- Show the created profiles
SELECT id, name, birthday, gender, sexuality, show_me, bio 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 20;
