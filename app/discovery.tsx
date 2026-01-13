import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;
const CARD_HEIGHT = height * 0.65;

export default function DiscoveryScreen() {
  const {
    candidates,
    currentCandidateIndex,
    likeCurrentCandidate,
    passCurrentCandidate,
    matches,
    currentUser,
    refreshMatches,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const previousMatchCountRef = useRef(matches.length);
  const candidate = candidates[currentCandidateIndex];

  // Animation refs
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const likeOverlay = useRef(new Animated.Value(0)).current;
  const passOverlay = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Reset photo index when candidate changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentCandidateIndex]);

  // Initialize match count on mount
  useEffect(() => {
    previousMatchCountRef.current = matches.length;
  }, []);

  // Check for new matches when screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkForNewMatches = async () => {
        const previousCount = previousMatchCountRef.current;
        await refreshMatches();
        const { matches: updatedMatches } = useAppStore.getState();

        if (updatedMatches.length > previousCount && updatedMatches.length > 0) {
          const newestMatch = updatedMatches[updatedMatches.length - 1];
          previousMatchCountRef.current = updatedMatches.length;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push(`/match/${newestMatch.id}`);
        } else {
          previousMatchCountRef.current = updatedMatches.length;
        }
      };

      checkForNewMatches();
      const pollInterval = setInterval(checkForNewMatches, 5000);
      return () => clearInterval(pollInterval);
    }, [refreshMatches])
  );

  const animateCardExit = (isLike: boolean) => {
    const overlay = isLike ? likeOverlay : passOverlay;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset animations for next card
      cardScale.setValue(1);
      cardOpacity.setValue(1);
      likeOverlay.setValue(0);
      passOverlay.setValue(0);
    });
  };

  const handleLike = async () => {
    if (isProcessing || !candidate) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    animateCardExit(true);

    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = await likeCurrentCandidate();

    if (result.isMatch && result.matchId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/match/${result.matchId}`);
    }

    setIsProcessing(false);
  };

  const handlePass = async () => {
    if (isProcessing || !candidate) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);
    animateCardExit(false);

    await new Promise(resolve => setTimeout(resolve, 300));
    await passCurrentCandidate();
    setIsProcessing(false);
  };

  const handleViewProfile = () => {
    if (candidate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/profile/${candidate.id}`);
    }
  };

  const handlePhotoTap = (side: 'left' | 'right') => {
    if (!candidate) return;
    const photos = candidate.photos.filter(p => p);

    if (side === 'right' && currentPhotoIndex < photos.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPhotoIndex(prev => prev + 1);
    } else if (side === 'left' && currentPhotoIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const photos = candidate?.photos.filter(p => p) || [];
  const currentPhoto = photos[currentPhotoIndex] || 'https://picsum.photos/400/600';

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/profile/edit')}
            style={styles.avatarButton}
          >
            {currentUser?.photos?.[0] ? (
              <Image
                source={{ uri: currentUser.photos[0] }}
                style={styles.headerAvatar}
              />
            ) : (
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>
                  {currentUser?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Discover</Text>
            <View style={styles.logoAccent} />
          </View>

          <TouchableOpacity
            style={styles.matchesBadge}
            onPress={() => router.push('/settings')}
          >
            <LinearGradient
              colors={matches.length > 0 ? colors.gradientPrimary as [string, string, ...string[]] : [colors.surface, colors.surfaceLight]}
              style={styles.matchesBadgeGradient}
            >
              <Text style={styles.matchesCount}>{matches.length}</Text>
            </LinearGradient>
            <Text style={styles.matchesLabel}>matches</Text>
          </TouchableOpacity>
        </View>

        {/* Card */}
        {candidate ? (
          <View style={styles.cardContainer}>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ scale: cardScale }],
                  opacity: cardOpacity,
                },
              ]}
            >
              {/* Photo with tap zones */}
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: currentPhoto }}
                  style={styles.cardImage}
                />

                {/* Tap zones for photo navigation */}
                <View style={styles.tapZones}>
                  <TouchableOpacity
                    style={styles.tapZoneLeft}
                    onPress={() => handlePhotoTap('left')}
                    activeOpacity={1}
                  />
                  <TouchableOpacity
                    style={styles.tapZoneRight}
                    onPress={() => handlePhotoTap('right')}
                    activeOpacity={1}
                  />
                </View>

                {/* Photo indicators */}
                {photos.length > 1 && (
                  <View style={styles.photoIndicators}>
                    {photos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.photoIndicator,
                          index === currentPhotoIndex && styles.photoIndicatorActive,
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Gradient overlay */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                  locations={[0.4, 0.7, 1]}
                  style={styles.cardGradient}
                />

                {/* Like overlay */}
                <Animated.View
                  style={[
                    styles.actionOverlay,
                    styles.likeOverlay,
                    { opacity: likeOverlay }
                  ]}
                >
                  <View style={styles.overlayBadge}>
                    <Text style={styles.overlayText}>LIKE</Text>
                  </View>
                </Animated.View>

                {/* Pass overlay */}
                <Animated.View
                  style={[
                    styles.actionOverlay,
                    styles.passOverlay,
                    { opacity: passOverlay }
                  ]}
                >
                  <View style={[styles.overlayBadge, styles.passBadge]}>
                    <Text style={[styles.overlayText, styles.passText]}>NOPE</Text>
                  </View>
                </Animated.View>

                {/* Card content */}
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={handleViewProfile}
                  activeOpacity={0.9}
                >
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{candidate.name}</Text>
                    <Text style={styles.cardAge}>{candidate.age}</Text>
                  </View>

                  {candidate.prompts[0] && (
                    <View style={styles.promptContainer}>
                      <Text style={styles.cardPrompt} numberOfLines={2}>
                        "{candidate.prompts[0]}"
                      </Text>
                    </View>
                  )}

                  <Text style={styles.tapHint}>Tap for full profile</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.passButton]}
                  onPress={handlePass}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={isProcessing}
                >
                  <Text style={styles.passIcon}>✕</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.superLikeButton]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={isProcessing}
                >
                  <Text style={styles.superLikeIcon}>★</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.likeButton]}
                  onPress={handleLike}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.likeIcon}>♥</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={colors.gradientCard as [string, string, ...string[]]}
              style={styles.emptyCard}
            >
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyTitle}>You've seen everyone!</Text>
              <Text style={styles.emptySubtitle}>
                New people join every day. Check back soon to find your next connection.
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/settings');
                }}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.refreshButtonGradient}
                >
                  <Text style={styles.refreshButtonText}>View Your Matches</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Matches notification bar */}
        {matches.length > 0 && candidate && (
          <TouchableOpacity
            style={styles.matchesBar}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
          >
            <LinearGradient
              colors={colors.gradientSecondary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.matchesBarGradient}
            >
              <Text style={styles.matchesBarEmoji}>💬</Text>
              <Text style={styles.matchesBarText}>
                {matches.length} match{matches.length !== 1 ? 'es' : ''} waiting to connect!
              </Text>
              <Text style={styles.matchesBarArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatarButton: {
    ...shadows.md,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  logoAccent: {
    width: 24,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: 4,
  },
  matchesBadge: {
    alignItems: 'center',
  },
  matchesBadgeGradient: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  matchesCount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  matchesLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.cardFloat,
  },
  photoContainer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 1,
  },
  photoIndicators: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: colors.text,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeOverlay: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  passOverlay: {
    backgroundColor: 'rgba(113, 113, 122, 0.3)',
  },
  overlayBadge: {
    borderWidth: 4,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    transform: [{ rotate: '-20deg' }],
  },
  passBadge: {
    borderColor: colors.error,
  },
  overlayText: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
    color: colors.success,
    letterSpacing: typography.letterSpacing.wider,
  },
  passText: {
    color: colors.error,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  cardName: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  cardAge: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  promptContainer: {
    backgroundColor: colors.glassBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    marginBottom: spacing.sm,
  },
  cardPrompt: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tapHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  passIcon: {
    fontSize: 26,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  superLikeIcon: {
    fontSize: 22,
    color: colors.text,
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    ...shadows.glow(colors.success),
  },
  likeIcon: {
    fontSize: 32,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    width: '100%',
    padding: spacing.xxl,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  refreshButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  refreshButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  matchesBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  matchesBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  matchesBarEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  matchesBarText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  matchesBarArrow: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    opacity: 0.7,
  },
});
