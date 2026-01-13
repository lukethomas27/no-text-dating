# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

No Text Dating is a premium React Native/Expo dating app where post-match interaction is limited to scheduling audio/video calls only - no text messaging. The app features a sophisticated dark theme with gradient effects, animations, and haptic feedback designed to maximize user engagement.

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
- `auth.tsx` - Phone auth with animated 3-step OTP flow
- `discovery.tsx` - Immersive swipe interface with full-screen cards
- `match/[matchId].tsx` - Match celebration with confetti animation
- `schedule/[threadId].tsx` - Call scheduling with time slot selection
- `call/lobby/[callEventId].tsx` - Pre-call lobby with countdown
- `call/in/[callEventId].tsx` - Active call with sound wave animations
- `feedback/[callEventId].tsx` - Post-call rating with report flow
- `settings.tsx` - Profile card, matches list, app settings
- `profile/edit.tsx` - Premium profile editor
- `profile/[id].tsx` - Full-screen profile viewer

### State Management

Zustand store in `src/store/index.ts` manages all app state. Access via `useAppStore` hook.

### Services Layer (`src/services/`)

Interface-based services with Supabase backend:
- `AuthService` - Phone auth with OTP (Supabase Auth + Twilio)
- `ProfilesService` - User profiles and candidate discovery
- `MatchingService` - Swipes and match detection
- `SchedulingService` - Call proposals and confirmation
- `SafetyService` - Block/report functionality

`supabaseRepo.ts` contains the Supabase implementation with snake_case to camelCase converters.

### Data Models

Core types in `src/types/index.ts`: `UserProfile`, `Swipe`, `Match`, `CallThread`, `CallProposal`, `CallEvent`, `Feedback`, `Block`, `Report`.

Database types in `src/types/database.ts` mirror Supabase schema.

## Design System

### Theme (`src/constants/theme.ts`)

Premium dark theme with psychological engagement principles:

```typescript
import {
  colors,        // Includes gradientPrimary, gradientSuccess, etc.
  spacing,       // xs(4) to xxxl(64)
  borderRadius,  // xs(4) to full(9999)
  typography,    // sizes, weights, letterSpacing
  shadows,       // sm, md, lg, cardFloat, glow(color)
  animation,     // fast(150ms), normal(300ms), slow(500ms), spring configs
} from '../src/constants/theme';
```

### Color Philosophy
- **Primary (coral/rose)** - `#FF6B6B` - Triggers attraction
- **Secondary (violet)** - `#8B5CF6` - Special moments
- **Background** - `#09090B` - Deep, intimate dark
- **Success (green)** - `#10B981` - Positive actions
- **Glass effects** - `glassBg`, `glassStroke` for premium feel

### Animation Patterns

All screens use consistent animation patterns:
- Entrance: `fadeAnim` + `slideAnim` with `Animated.parallel`
- Pulse: Looping scale animations for avatars/indicators
- Floating orbs: Decorative background elements
- Haptics: `expo-haptics` on all user interactions

### UI Components Pattern

```tsx
// Premium button with gradient
<TouchableOpacity activeOpacity={0.8}>
  <LinearGradient
    colors={colors.gradientPrimary as [string, string, ...string[]]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.buttonGradient}
  >
    <Text style={styles.buttonText}>Action</Text>
  </LinearGradient>
</TouchableOpacity>

// Glass-morphism card
<View style={[styles.card, { borderColor: colors.glassStroke }]}>
  <LinearGradient
    colors={colors.gradientCard as [string, string]}
    style={styles.cardGradient}
  >
    {/* content */}
  </LinearGradient>
</View>
```

## Key Patterns

### Call Duration
- 30 seconds in dev (`__DEV__`)
- 15 minutes in production

### No Messaging
The app intentionally has NO text chat. Only scheduled voice/video calls.

### Test Credentials
- Phone: `+1 555 555 1234`
- OTP: `123456`

### Dev Panel
In Settings screen - allows: auto-match next like, reseed profiles, reset data.

## Dependencies to Know

- `expo-linear-gradient` - All gradient backgrounds
- `expo-haptics` - Tactile feedback on interactions
- `expo-image-picker` - Photo selection
- `date-fns` - Date formatting and calculations
- `react-hook-form` + `zod` - Form handling and validation

## Database (Supabase)

- Row Level Security enabled on all tables
- Photo storage in Supabase Storage `profile-photos` bucket
- Real-time subscriptions available but not yet implemented
- Schema in `supabase/schema.sql`

## File Naming Conventions

- Screens: `kebab-case.tsx` or `[param].tsx` for dynamic routes
- Components: `PascalCase.tsx` (when created)
- Services: `camelCase.ts`
- Types: `index.ts` exports all types

## Common Tasks

### Adding a new screen
1. Create file in `app/` directory
2. Import theme from `../src/constants/theme`
3. Add entrance animations (fadeAnim, slideAnim)
4. Add haptic feedback on interactions
5. Use LinearGradient for backgrounds and buttons

### Modifying theme
Edit `src/constants/theme.ts` - all colors, spacing, and effects are centralized.

### Adding database table
1. Add migration in `supabase/migrations/`
2. Add types to `src/types/database.ts`
3. Add app types to `src/types/index.ts`
4. Add converter functions in `src/services/supabaseRepo.ts`
5. Create service methods in `src/services/index.ts`
