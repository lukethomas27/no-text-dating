import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { format, differenceInSeconds, isPast } from 'date-fns';
import { SchedulingService, MatchingService } from '../../../src/services';
import { useAppStore } from '../../../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../../src/constants/theme';
import { CallEvent, UserProfile } from '../../../src/types';

const { width, height } = Dimensions.get('window');

export default function CallLobbyScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { setActiveCallEvent } = useAppStore();

  const [callEvent, setCallEvent] = useState<CallEvent | undefined>();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [countdown, setCountdown] = useState('');
  const [canJoin, setCanJoin] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Content entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Avatar pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Anim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Anim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!callEventId) return;

      const eventData = await SchedulingService.getCallEvent(callEventId);
      setCallEvent(eventData);

      if (eventData) {
        const threadData = await SchedulingService.getThread(eventData.threadId);
        if (threadData) {
          const matchData = await MatchingService.getMatch(threadData.matchId);
          if (matchData) {
            const other = await MatchingService.getOtherUser(matchData);
            setOtherUser(other);
          }
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [callEventId]);

  useEffect(() => {
    if (!callEvent) return;

    const updateCountdown = () => {
      const now = new Date();
      const scheduledTime = new Date(callEvent.scheduledStartISO);
      const diff = differenceInSeconds(scheduledTime, now);

      if (diff <= 0 || isPast(scheduledTime)) {
        if (!canJoin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setCanJoin(true);
        setCountdown('Ready!');
      } else if (diff < 60) {
        setCountdown(`${diff}s`);
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setCountdown(`${hours}h ${mins}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [callEvent, canJoin]);

  const handleJoin = async () => {
    if (!callEvent) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await SchedulingService.updateCallState(callEvent.id, 'live');
    setActiveCallEvent(callEvent);

    router.replace(`/call/in/${callEvent.id}`);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/discovery');
  };

  const orb1TranslateY = orb1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const orb2TranslateX = orb2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!callEvent || !otherUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorIcon}>404</Text>
          <Text style={styles.errorText}>Call not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/discovery');
            }}
          >
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorButtonGradient}
            >
              <Text style={styles.errorButtonText}>Go to Discovery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const isVideo = callEvent.callType === 'video';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { transform: [{ translateY: orb1TranslateY }] },
        ]}
      >
        <LinearGradient
          colors={[colors.secondary + '40', colors.secondary + '10']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          { transform: [{ translateX: orb2TranslateX }] },
        ]}
      >
        <LinearGradient
          colors={[colors.primary + '30', colors.primary + '05']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.callTypeContainer}>
              <LinearGradient
                colors={isVideo ? colors.gradientSecondary as [string, string] : colors.gradientSuccess as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.callTypeBadge}
              >
                <Text style={styles.callTypeIcon}>{isVideo ? '📹' : '🎙️'}</Text>
                <Text style={styles.callTypeText}>{isVideo ? 'Video Call' : 'Audio Call'}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Call Lobby</Text>
            <Text style={styles.subtitle}>Get ready for your conversation</Text>
          </View>

          {/* User Card */}
          <View style={styles.userCardContainer}>
            <Animated.View style={[styles.avatarGlow, { opacity: glowAnim }]}>
              <LinearGradient
                colors={[colors.primary + '60', colors.secondary + '40', 'transparent']}
                style={styles.avatarGlowGradient}
              />
            </Animated.View>
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                style={styles.avatarBorder}
              >
                <Image
                  source={{ uri: otherUser.photos[0] || 'https://picsum.photos/200/200' }}
                  style={styles.avatar}
                />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.userName}>{otherUser.name}</Text>
            <Text style={styles.userAge}>{otherUser.age} years old</Text>
          </View>

          {/* Schedule Info Card */}
          <View style={styles.scheduleCard}>
            <LinearGradient
              colors={colors.gradientCard as [string, string]}
              style={styles.scheduleCardGradient}
            >
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>Scheduled for</Text>
                <Text style={styles.scheduleTime}>
                  {format(new Date(callEvent.scheduledStartISO), "MMM d 'at' h:mm a")}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.countdownSection}>
                <Text style={styles.countdownLabel}>
                  {canJoin ? 'Your call is ready' : 'Starting in'}
                </Text>
                <View style={styles.countdownValueContainer}>
                  {canJoin ? (
                    <LinearGradient
                      colors={colors.gradientSuccess as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.readyBadge}
                    >
                      <Text style={styles.readyIcon}>✓</Text>
                      <Text style={styles.readyText}>Ready!</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.countdownValue}>{countdown}</Text>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <LinearGradient
              colors={[colors.surface + 'CC', colors.backgroundCard + 'AA']}
              style={styles.tipsCardGradient}
            >
              <Text style={styles.tipsTitle}>Quick Tips</Text>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}><Text>💡</Text></View>
                <Text style={styles.tipText}>Find a quiet, well-lit space</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}><Text>💬</Text></View>
                <Text style={styles.tipText}>Have some fun topics ready</Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}><Text>✨</Text></View>
                <Text style={styles.tipText}>Be yourself!</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            disabled={!canJoin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canJoin
                ? colors.gradientSuccess as [string, string]
                : [colors.surfaceLight, colors.surfaceLighter]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.joinButtonGradient, canJoin && styles.joinButtonGlow]}
            >
              <Text style={styles.joinIcon}>{isVideo ? '📹' : '📞'}</Text>
              <Text style={[styles.joinButtonText, !canJoin && styles.joinButtonTextDisabled]}>
                {canJoin ? 'Join Call' : 'Waiting...'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },

  // Decorative Orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  orb1: {
    top: height * 0.1,
    right: -50,
    width: 200,
    height: 200,
  },
  orb2: {
    bottom: height * 0.2,
    left: -80,
    width: 250,
    height: 250,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  callTypeContainer: {
    marginBottom: spacing.md,
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  callTypeIcon: {
    fontSize: 16,
  },
  callTypeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },

  // User Card
  userCardContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -10,
  },
  avatarGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  avatarWrapper: {
    marginBottom: spacing.md,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: borderRadius.full,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: colors.background,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userAge: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },

  // Schedule Card
  scheduleCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    ...shadows.md,
  },
  scheduleCardGradient: {
    padding: spacing.lg,
  },
  scheduleRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scheduleLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  scheduleTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassStroke,
    marginVertical: spacing.md,
  },
  countdownSection: {
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  countdownValueContainer: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  readyIcon: {
    fontSize: 20,
    color: colors.text,
  },
  readyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },

  // Tips Card
  tipsCard: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  tipsCardGradient: {
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  // Actions
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  joinButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  joinButtonGlow: {
    ...shadows.glow(colors.success),
  },
  joinIcon: {
    fontSize: 20,
  },
  joinButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  joinButtonTextDisabled: {
    color: colors.textMuted,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  errorButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
