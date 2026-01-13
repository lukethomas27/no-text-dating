# No Text Dating

A premium dating app where the only post-match interaction is scheduling audio/video calls. No messaging, no texting — just real conversations.

## Overview

No Text Dating reimagines online dating by eliminating endless text conversations. When you match with someone, you schedule a call. This encourages authentic connections through real-time conversation rather than carefully crafted messages.

### Key Features

- Phone-based authentication with OTP verification
- Swipe-based discovery with immersive profile cards
- Match celebration with confetti animations
- Audio and video call scheduling
- Pre-call lobby with countdown timer
- Simulated in-call experience
- Post-call feedback and safety features

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account with a project created

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Testing

**Test phone number:** `+1 555 555 1234`
**OTP code:** `123456`

> Only the test number above bypasses SMS. All other numbers send real SMS via Twilio.

### Running the App

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

## App Flow

1. **Auth** - Enter phone number, receive OTP via SMS, verify code
2. **Profile Setup** - New users enter name/age, then complete their profile (photos, bio, prompts)
3. **Discovery** - Swipe through potential matches (Like/Pass)
4. **Match** - When mutual interest occurs, you're prompted to schedule a call
5. **Scheduling** - Propose call times (audio or video)
6. **Call Lobby** - Wait for your scheduled call time
7. **In-Call** - Video/audio call with countdown timer
8. **Feedback** - Rate the call: Interested / Not Interested / Report / Block

## Design System

The app features a premium dark theme designed with psychological engagement principles:

### Theme Philosophy

- **Warm coral/rose primary colors** - Trigger attraction and emotional connection
- **Deep dark backgrounds** - Create intimacy and focus attention
- **Gradient accents** - Add energy and guide user actions
- **Glass-morphism effects** - Modern, premium aesthetic
- **Animated elements** - Keep users engaged and delighted
- **Haptic feedback** - Reinforce every interaction with tactile response

### Design Tokens

Located in `src/constants/theme.ts`:

```typescript
import {
  colors,        // Color palette with gradients
  spacing,       // Consistent spacing scale
  borderRadius,  // Border radius tokens
  typography,    // Font sizes and weights
  shadows,       // Shadow presets including glow effects
  animation,     // Animation timing constants
} from "../src/constants/theme";
```

### Animation Patterns

- **Entrance animations** - Fade + slide for content
- **Pulse animations** - For avatars and live indicators
- **Floating orbs** - Decorative background elements
- **Confetti system** - Match celebrations
- **Sound waves** - Audio call visualization

## Project Structure

```
no-text-dating/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry redirect (auth check)
│   ├── auth.tsx                  # Phone auth with animated OTP flow
│   ├── discovery.tsx             # Immersive swipe interface
│   ├── settings.tsx              # Settings + matches list
│   ├── profile/
│   │   ├── edit.tsx              # Premium profile editor
│   │   └── [id].tsx              # Full-screen profile viewer
│   ├── match/
│   │   └── [matchId].tsx         # Match celebration with confetti
│   ├── schedule/
│   │   └── [threadId].tsx        # Call scheduling interface
│   ├── call/
│   │   ├── lobby/[callEventId].tsx   # Pre-call waiting room
│   │   └── in/[callEventId].tsx      # Active call screen
│   └── feedback/
│       └── [callEventId].tsx     # Post-call feedback
│
├── src/
│   ├── types/
│   │   ├── index.ts              # App TypeScript types (camelCase)
│   │   └── database.ts           # Supabase database types (snake_case)
│   ├── services/
│   │   ├── index.ts              # Service layer exports
│   │   ├── supabaseRepo.ts       # Supabase repository implementation
│   │   ├── localRepo.ts          # Legacy in-memory store (unused)
│   │   └── seedData.ts           # Demo profile data
│   ├── lib/
│   │   └── supabase.ts           # Supabase client configuration
│   ├── store/
│   │   └── index.ts              # Zustand global state
│   └── constants/
│       └── theme.ts              # Design system tokens
│
├── supabase/                     # Database schema reference
│   ├── schema.sql                # Main schema with RLS policies
│   └── migrations/               # Schema migrations
│
└── assets/                       # App icons and splash
```

## Data Models

### App Types (camelCase)

Defined in `src/types/index.ts`:

- **UserProfile** - User's dating profile (name, age, prompts, photos)
- **Swipe** - Like/Pass action on another user
- **Match** - Mutual like between two users
- **CallThread** - Scheduling context for a match
- **CallProposal** - Proposed call times from one user
- **CallEvent** - Confirmed scheduled call
- **Feedback** - Post-call rating
- **Block** - Blocked user relationship
- **Report** - Safety report on a user

### Database Types (snake_case)

Defined in `src/types/database.ts` - mirrors Supabase schema for type-safe queries.

## Services Architecture

The app uses a service layer pattern with Supabase as the backend:

```typescript
import { AuthService, ProfilesService, MatchingService } from "./src/services";
```

### Service Interfaces

- **AuthService** - `getSession()`, `sendOtp()`, `verifyOtp()`, `signOut()`
- **ProfilesService** - `getMe()`, `updateMe()`, `getProfile()`, `listCandidates()`
- **MatchingService** - `like()`, `pass()`, `getMatches()`, `getMatch()`, `getOtherUser()`
- **SchedulingService** - `createProposal()`, `confirmSlot()`, `getUpcomingCall()`, `updateCallState()`
- **SafetyService** - `block()`, `report()`, `createFeedback()`

### Type Conversion

The `supabaseRepo.ts` contains converters between database snake_case and app camelCase:

- `dbProfileToUserProfile()` - Database profile → App profile
- `userProfileToDbProfile()` - App profile → Database profile
- Similar converters for all entity types

## Database Schema

The Supabase database schema is documented in `supabase/schema.sql`:

### Tables

- `profiles` - User profiles linked to auth.users
- `swipes` - Like/pass actions
- `matches` - Mutual matches
- `call_threads` - Scheduling state per match
- `call_proposals` - Proposed call times
- `call_events` - Confirmed calls
- `feedbacks` - Post-call ratings
- `blocks` - Blocked relationships
- `reports` - Safety reports

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only read/write their own data
- Blocked users are filtered from queries

## Configuration

### Call Duration

- **Production**: 15 minutes (900 seconds)
- **Development**: 30 seconds (for quick testing)

The duration is determined by `__DEV__` flag in `src/services/index.ts`.

### Environment Variables

| Variable                        | Description                   |
| ------------------------------- | ----------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## Dependencies

| Package                                    | Purpose                     |
| ------------------------------------------ | --------------------------- |
| expo-router                                | File-based navigation       |
| @supabase/supabase-js                      | Supabase client             |
| zustand                                    | Global state management     |
| react-hook-form                            | Form handling               |
| zod                                        | Schema validation           |
| date-fns                                   | Date/time utilities         |
| @react-native-async-storage/async-storage  | Session persistence         |
| expo-image-picker                          | Photo selection             |
| expo-crypto                                | UUID generation             |
| expo-linear-gradient                       | Gradient backgrounds        |
| expo-haptics                               | Haptic feedback             |

## No Chat Policy

This app intentionally has **no messaging features**:

- No text chat
- No message models
- No chat UI components
- Only scheduled voice/video calls

The goal is to encourage meaningful, real-time conversations over text-based small talk.

## Market Readiness Checklist

See `ROADMAP.md` for the complete product roadmap and launch checklist.

---

Built with Expo + React Native + TypeScript + Supabase
