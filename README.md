# No Text Dating

A dating app MVP where the only post-match interaction is scheduling audio/video calls. No messaging, no texting — just real conversations.

## 🚀 Quick Start

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

## 📱 App Flow

1. **Auth** - Choose a demo profile or create your own
2. **Discovery** - Swipe through potential matches (Like/Pass)
3. **Match** - When mutual interest occurs, you're prompted to schedule a call
4. **Scheduling** - Propose call times (audio or video)
5. **Call Lobby** - Wait for your scheduled call time
6. **In-Call** - Simulated video/audio call with countdown timer
7. **Feedback** - Rate the call: Interested / Not Interested / Report / Block

## 📁 Project Structure

```
no-text-dating/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry redirect
│   ├── auth.tsx                  # Login/profile selection
│   ├── discovery.tsx             # Main swipe screen
│   ├── settings.tsx              # Settings + dev panel
│   ├── profile/
│   │   ├── edit.tsx              # Edit your profile
│   │   └── [id].tsx              # View other profiles
│   ├── match/
│   │   └── [matchId].tsx         # Match celebration screen
│   ├── schedule/
│   │   └── [threadId].tsx        # Schedule call times
│   ├── call/
│   │   ├── lobby/[callEventId].tsx   # Pre-call waiting room
│   │   └── in/[callEventId].tsx      # Active call screen
│   └── feedback/
│       └── [callEventId].tsx     # Post-call feedback
│
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── services/
│   │   ├── index.ts              # Service interfaces (swappable)
│   │   ├── localRepo.ts          # In-memory data store
│   │   └── seedData.ts           # Demo profile data
│   ├── store/
│   │   └── index.ts              # Zustand global state
│   └── constants/
│       └── theme.ts              # Colors, spacing, typography
│
└── assets/                       # App icons and splash
```

## 🗄️ Data Models

All types are defined in `src/types/index.ts`:

- **UserProfile** - User's dating profile (name, age, prompts, photos)
- **Swipe** - Like/Pass action on another user
- **Match** - Mutual like between two users
- **CallThread** - Scheduling context for a match
- **CallProposal** - Proposed call times from one user
- **CallEvent** - Confirmed scheduled call
- **Feedback** - Post-call rating
- **Block** - Blocked user relationship
- **Report** - Safety report on a user

## 🔌 Services Architecture

Services are designed with interfaces that can be swapped for real backends:

```typescript
// Current: Local in-memory storage
import { AuthService, ProfilesService, MatchingService } from "./src/services";

// Future: Swap for Supabase
// Just implement the same interfaces with Supabase calls
```

### Service Interfaces

- **AuthService** - `getSession()`, `loginAs()`, `logout()`
- **ProfilesService** - `getMe()`, `updateMe()`, `listCandidates()`
- **MatchingService** - `like()`, `pass()`, `getMatches()`
- **SchedulingService** - `createProposal()`, `confirmSlot()`, `getUpcomingCall()`
- **CallProvider** - `createRoom()` (mock video service)
- **SafetyService** - `block()`, `report()`, `createFeedback()`

## 🔄 Swapping localRepo for Supabase

1. Create Supabase tables matching the TypeScript types
2. Implement each service interface with Supabase client calls:

```typescript
// Example: ProfilesService with Supabase
export const ProfilesService: IProfilesService = {
  getMe: async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.userId)
      .single();
    return data;
  },
  // ... implement other methods
};
```

3. Add RLS policies for security
4. Replace imports in `src/services/index.ts`

## 🛠️ Dev Panel

Access the Dev Panel in Settings to:

- **Auto-match next like** - Instantly create matches for testing
- **Reseed Demo Profiles** - Restore the 12 demo users
- **Reset All Data** - Clear everything and start fresh

## ⚙️ Configuration

### Call Duration

- **Production**: 15 minutes (900 seconds)
- **Development**: 30 seconds (for quick testing)

The duration is determined by `__DEV__` flag in `src/services/index.ts`.

## 📋 TODO Checklist

### MVP Complete ✅

- [x] Auth flow (fake/demo)
- [x] Profile editing with photo picker
- [x] Discovery swipe interface
- [x] Match detection and celebration
- [x] Call scheduling with time slots
- [x] Call lobby with countdown
- [x] Simulated in-call experience
- [x] Post-call feedback
- [x] Block/Report functionality
- [x] Dev panel for testing

### Next Steps 🚧

- [ ] Real authentication (Supabase Auth)
- [ ] Persistent database (Supabase)
- [ ] Push notifications for matches/calls
- [ ] Real video calling (Daily.co, Twilio, etc.)
- [ ] Profile photo upload to cloud storage
- [ ] Swipe animations (react-native-gesture-handler)
- [ ] Background call notifications
- [ ] Rate limiting and abuse prevention

## 🎨 Design System

Colors, spacing, and typography are centralized in `src/constants/theme.ts`:

```typescript
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../src/constants/theme";
```

The app uses a dark theme with coral/rose primary colors.

## 📦 Dependencies

| Package                                   | Purpose                 |
| ----------------------------------------- | ----------------------- |
| expo-router                               | File-based navigation   |
| zustand                                   | Global state management |
| react-hook-form                           | Form handling           |
| zod                                       | Schema validation       |
| date-fns                                  | Date/time utilities     |
| @react-native-async-storage/async-storage | Optional persistence    |
| expo-image-picker                         | Photo selection         |
| uuid                                      | Unique ID generation    |

## 🔒 No Chat Policy

This app intentionally has **no messaging features**:

- ❌ No text chat
- ❌ No message models
- ❌ No chat UI components
- ✅ Only scheduled voice/video calls

The goal is to encourage meaningful, real-time conversations over text-based small talk.

---

Built with ❤️ using Expo + React Native + TypeScript
