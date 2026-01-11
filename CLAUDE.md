# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

No Text Dating is a React Native/Expo dating app where post-match interaction is limited to scheduling audio/video calls only - no text messaging. The app uses TypeScript with strict mode enabled.

## Development Commands

```bash
npm install           # Install dependencies
npx expo start        # Start Expo dev server
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web
```

## Architecture

### Routing (Expo Router)
File-based routing in `app/` directory. Dynamic routes use bracket notation (e.g., `[matchId].tsx`).

Key screens:
- `auth.tsx` - Demo profile selection or new user creation
- `discovery.tsx` - Swipe interface for matching
- `match/[matchId].tsx` - Match celebration, prompts scheduling
- `schedule/[threadId].tsx` - Propose call times
- `call/lobby/[callEventId].tsx` - Pre-call waiting room
- `call/in/[callEventId].tsx` - Active call screen
- `feedback/[callEventId].tsx` - Post-call rating

### State Management
Zustand store in `src/store/index.ts` manages all app state. Access via `useAppStore` hook.

### Services Layer (`src/services/`)
Interface-based services designed to be swapped from local storage to Supabase:
- `AuthService` - Session management
- `ProfilesService` - User profiles and candidate discovery
- `MatchingService` - Swipes and match detection
- `SchedulingService` - Call proposals and confirmation
- `SafetyService` - Block/report functionality
- `CallProvider` - Mock video service (for future real implementation)

`localRepo.ts` contains the in-memory data store. To migrate to Supabase, implement the same interfaces with Supabase client calls.

### Data Models
Core types in `src/types/index.ts`: `UserProfile`, `Swipe`, `Match`, `CallThread`, `CallProposal`, `CallEvent`, `Feedback`, `Block`, `Report`.

### Theme
Colors, spacing, and typography constants in `src/constants/theme.ts`.

## Key Patterns

- Call duration: 30 seconds in dev (`__DEV__`), 15 minutes in production
- No messaging features - only scheduled voice/video calls
- Dev panel in Settings allows: auto-match next like, reseed profiles, reset data
