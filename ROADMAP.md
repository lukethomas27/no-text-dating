# No Text Dating - Product Roadmap

A structured checklist for taking the app from MVP to market launch.

---

## Phase 1: Core Infrastructure (Critical)

### Real-Time Video/Audio Calling
- [ ] Integrate video calling provider (Daily.co, Twilio Video, or Agora)
- [ ] Implement WebRTC connection handling
- [ ] Add camera/microphone permission flows
- [ ] Build connection quality indicator
- [ ] Handle call reconnection on network drops
- [ ] Add call recording consent flow (if required by region)
- [ ] Test cross-platform compatibility (iOS/Android)

### Push Notifications
- [ ] Set up Expo Push Notifications service
- [ ] Implement notification tokens storage in Supabase
- [ ] Create notification types:
  - [ ] New match notification
  - [ ] Call proposal received
  - [ ] Call starting soon (15 min, 5 min reminders)
  - [ ] Call starting now
  - [ ] Mutual interest after call
- [ ] Add notification preferences in settings
- [ ] Handle notification deep linking to correct screens
- [ ] Test background/foreground notification handling

### Authentication Hardening
- [ ] Add phone number validation (libphonenumber)
- [ ] Implement international phone number support
- [ ] Add rate limiting on OTP requests
- [ ] Implement account recovery flow
- [ ] Add session refresh handling
- [ ] Implement logout from all devices option

---

## Phase 2: User Experience Polish

### Discovery Enhancements
- [ ] Add swipe gesture animations (react-native-gesture-handler + Reanimated)
- [ ] Implement card stack with peek at next card
- [ ] Add "Undo" last swipe feature
- [ ] Implement distance-based filtering
- [ ] Add age range preferences
- [ ] Build "Daily Picks" or curated matches feature
- [ ] Add profile boost/spotlight feature
- [ ] Implement smart matching algorithm

### Profile Improvements
- [ ] Add photo reordering (drag and drop)
- [ ] Implement photo verification (selfie match)
- [ ] Add more prompt options
- [ ] Support video profile intro (15-30 sec)
- [ ] Add interests/tags for better matching
- [ ] Implement profile completion percentage
- [ ] Add "About Me" audio recording option

### Call Experience
- [ ] Add virtual backgrounds for video calls
- [ ] Implement beauty/filter mode
- [ ] Add conversation starter prompts during call
- [ ] Build icebreaker games feature
- [ ] Add call extension request (if both agree)
- [ ] Implement "schedule another call" from feedback screen

---

## Phase 3: Safety & Trust

### User Verification
- [ ] Phone number verification (already done)
- [ ] Photo verification with AI/manual review
- [ ] Optional ID verification for verified badge
- [ ] Social media linking (optional trust signals)

### Safety Features
- [ ] Implement AI content moderation for photos
- [ ] Add inappropriate content detection in video calls
- [ ] Build emergency "End Call" with report
- [ ] Create safety tips/guidelines screens
- [ ] Implement shadow banning for reported users
- [ ] Add trusted contacts feature (share date details)
- [ ] Build in-app safety resources

### Moderation System
- [ ] Create admin dashboard for reports
- [ ] Implement report review workflow
- [ ] Add automated action triggers (X reports = review)
- [ ] Build appeal process for banned users
- [ ] Create moderation guidelines documentation

---

## Phase 4: Monetization

### Subscription Tiers
- [ ] Design subscription plans:
  - [ ] Free: Limited likes/day, basic features
  - [ ] Premium: Unlimited likes, see who liked you, priority matching
  - [ ] VIP: All premium + video profiles, read receipts, etc.
- [ ] Integrate payment provider:
  - [ ] iOS: StoreKit / RevenueCat
  - [ ] Android: Google Play Billing / RevenueCat
- [ ] Implement subscription status checking
- [ ] Add subscription management screen
- [ ] Handle subscription expiration gracefully
- [ ] Implement restore purchases

### In-App Purchases
- [ ] Super Likes (limited quantity)
- [ ] Profile Boosts
- [ ] Rewind/Undo swipes
- [ ] See who liked you
- [ ] Read receipts for call proposals

### Revenue Analytics
- [ ] Integrate analytics for conversion tracking
- [ ] Build revenue dashboard
- [ ] Implement A/B testing for pricing
- [ ] Add promotional/discount code system

---

## Phase 5: Growth & Engagement

### Onboarding Optimization
- [ ] Add app tour/walkthrough for new users
- [ ] Implement progressive profile completion prompts
- [ ] Add "Complete your profile" incentives
- [ ] Create welcome sequence notifications

### Engagement Features
- [ ] Daily login rewards/streaks
- [ ] "New users near you" notifications
- [ ] Activity status (recently active)
- [ ] Weekly match recap emails
- [ ] Re-engagement campaigns for inactive users

### Social Features
- [ ] Friend referral program
- [ ] Share match milestones (optional)
- [ ] Success stories section
- [ ] Community guidelines and values page

### Analytics & Metrics
- [ ] Implement user analytics (Mixpanel/Amplitude)
- [ ] Track key metrics:
  - [ ] DAU/MAU
  - [ ] Swipe to match rate
  - [ ] Match to call rate
  - [ ] Call completion rate
  - [ ] Mutual interest rate
  - [ ] Retention cohorts
- [ ] Build internal analytics dashboard
- [ ] Set up crash reporting (Sentry/Bugsnag)

---

## Phase 6: App Store Preparation

### iOS App Store
- [ ] Create Apple Developer account ($99/year)
- [ ] Generate app icons (all required sizes)
- [ ] Create App Store screenshots (6.7", 6.5", 5.5")
- [ ] Write compelling app description
- [ ] Prepare keywords for ASO
- [ ] Create promotional text
- [ ] Record app preview video
- [ ] Complete App Store Connect listing
- [ ] Configure in-app purchases
- [ ] Submit for App Review
- [ ] Prepare responses for common rejections:
  - [ ] Dating app age verification
  - [ ] Safety features documentation
  - [ ] Content moderation explanation

### Google Play Store
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Generate feature graphic (1024x500)
- [ ] Create Play Store screenshots
- [ ] Write app description
- [ ] Complete store listing
- [ ] Configure in-app products
- [ ] Set up Play Console
- [ ] Submit for review
- [ ] Complete Data Safety section

### Legal & Compliance
- [ ] Write Terms of Service
- [ ] Create Privacy Policy (GDPR, CCPA compliant)
- [ ] Add age verification (18+ requirement)
- [ ] Implement data export feature (GDPR)
- [ ] Add account deletion feature (required by stores)
- [ ] Review content policies for each platform
- [ ] Consult legal for dating app requirements

---

## Phase 7: Launch Preparation

### Testing
- [ ] Complete end-to-end testing on iOS
- [ ] Complete end-to-end testing on Android
- [ ] Load testing for backend
- [ ] Security audit
- [ ] Accessibility review (VoiceOver, TalkBack)
- [ ] Beta testing with TestFlight/Play Console

### Infrastructure
- [ ] Set up production Supabase instance
- [ ] Configure CDN for images
- [ ] Set up database backups
- [ ] Implement database monitoring
- [ ] Configure auto-scaling (if needed)
- [ ] Set up error alerting

### Marketing Prep
- [ ] Create landing page / website
- [ ] Set up social media accounts
- [ ] Prepare launch press kit
- [ ] Create demo video
- [ ] Plan launch marketing campaign
- [ ] Set up App Store Optimization (ASO)
- [ ] Plan influencer outreach

---

## Phase 8: Post-Launch

### Monitoring
- [ ] Monitor crash-free rate
- [ ] Track app store ratings and reviews
- [ ] Respond to user reviews
- [ ] Monitor server performance
- [ ] Track user feedback channels

### Iteration
- [ ] Analyze user behavior data
- [ ] Prioritize feature requests
- [ ] A/B test new features
- [ ] Regular app updates (bug fixes, improvements)
- [ ] Seasonal features/promotions

### Scaling
- [ ] Geographic expansion planning
- [ ] Localization for new markets
- [ ] Server scaling strategy
- [ ] Customer support scaling

---

## Current Status Summary

### Completed
- [x] Phone authentication with OTP
- [x] User profile creation and editing
- [x] Photo upload to cloud storage
- [x] Discovery/swipe interface
- [x] Match detection
- [x] Call scheduling system
- [x] Call lobby with countdown
- [x] Simulated in-call experience
- [x] Post-call feedback
- [x] Block and report functionality
- [x] Row Level Security policies
- [x] Premium UI/UX design system
- [x] Animations and haptic feedback

### In Progress
- [ ] Real video calling integration
- [ ] Push notifications

### Priority for MVP Launch
1. Real video/audio calling (Phase 1)
2. Push notifications (Phase 1)
3. App Store preparation (Phase 6)
4. Legal compliance (Phase 6)
5. Basic monetization (Phase 4)

---

## Technical Debt & Improvements

- [ ] Add comprehensive error handling
- [ ] Implement offline mode / data caching
- [ ] Add loading skeletons throughout app
- [ ] Optimize image loading and caching
- [ ] Add pull-to-refresh on all lists
- [ ] Implement proper TypeScript strict mode
- [ ] Add unit tests for services
- [ ] Add E2E tests with Detox
- [ ] Set up CI/CD pipeline
- [ ] Code splitting / lazy loading for performance

---

**Last Updated:** January 2026
