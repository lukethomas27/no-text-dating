import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { SchedulingService, MatchingService } from '../../../src/services';
import { useAppStore } from '../../../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../../src/constants/theme';
import { CallEvent, UserProfile } from '../../../src/types';

const { width, height } = Dimensions.get('window');

export default function InCallScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { setActiveCallEvent } = useAppStore();

  const [callEvent, setCallEvent] = useState<CallEvent | undefined>();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const liveGlowAnim = useRef(new Animated.Value(0.5)).current;
  const avatarPulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Live indicator pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Live glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveGlowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(liveGlowAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Avatar breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulseAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Audio wave animations (staggered)
    const startWaveAnimation = (anim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    };

    startWaveAnimation(waveAnim1, 0);
    startWaveAnimation(waveAnim2, 200);
    startWaveAnimation(waveAnim3, 400);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!callEventId) return;

      const eventData = await SchedulingService.getCallEvent(callEventId);
      setCallEvent(eventData);

      if (eventData) {
        setTimeRemaining(eventData.durationSeconds || 30);

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

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleEndCall();
      return;
    }

    // Haptic feedback at critical moments
    if (timeRemaining === 60) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (timeRemaining === 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (callEvent) {
      await SchedulingService.updateCallState(callEvent.id, 'completed');
      setActiveCallEvent(null);
      router.replace(`/feedback/${callEvent.id}`);
    }
  };

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVideoOff(!isVideoOff);
  };

  const wave1Scale = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const wave1Opacity = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });
  const wave2Scale = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const wave2Opacity = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });
  const wave3Scale = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const wave3Opacity = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0],
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
          <Text style={styles.errorText}>Call not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const isVideo = callEvent.callType === 'video';
  const isLowTime = timeRemaining < 60;

  return (
    <View style={styles.container}>
      {/* Video Background */}
      {isVideo && (
        <Image
          source={{ uri: otherUser.photos[0] || 'https://picsum.photos/400/600' }}
          style={styles.videoBackground}
          blurRadius={isVideoOff ? 30 : 0}
        />
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={isVideo
          ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']
          : [colors.background, colors.backgroundElevated, colors.background]
        }
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.liveIndicator,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#FF3B3B', '#EF4444']}
              style={styles.liveIndicatorBg}
            >
              <Animated.View style={[styles.liveDot, { opacity: liveGlowAnim }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.timerContainer}>
            <LinearGradient
              colors={isLowTime
                ? ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              style={styles.timerBg}
            >
              <Text style={styles.timerLabel}>Time Remaining</Text>
              <Text style={[styles.timer, isLowTime && styles.timerLow]}>
                {formatTime(timeRemaining)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          {!isVideo && (
            <View style={styles.audioUserContainer}>
              {/* Sound waves */}
              <View style={styles.soundWavesContainer}>
                <Animated.View
                  style={[
                    styles.soundWave,
                    { transform: [{ scale: wave1Scale }], opacity: wave1Opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.soundWave,
                    styles.soundWave2,
                    { transform: [{ scale: wave2Scale }], opacity: wave2Opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.soundWave,
                    styles.soundWave3,
                    { transform: [{ scale: wave3Scale }], opacity: wave3Opacity },
                  ]}
                />
              </View>

              <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarPulseAnim }] }]}>
                <LinearGradient
                  colors={colors.gradientSuccess as [string, string]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={{ uri: otherUser.photos[0] || 'https://picsum.photos/200/200' }}
                    style={styles.audioAvatar}
                  />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.audioUserName}>{otherUser.name}</Text>
              <View style={styles.audioStatusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.audioStatus}>Audio call in progress</Text>
              </View>
            </View>
          )}

          {isVideo && (
            <View style={styles.videoNameContainer}>
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
                style={styles.videoNameBg}
              >
                <Text style={styles.videoUserName}>{otherUser.name}</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.controlsGradient}
          >
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleToggleMute}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isMuted
                    ? [colors.warning, colors.warningLight]
                    : [colors.surface + 'E0', colors.surfaceLight + 'E0']
                  }
                  style={styles.controlButtonGradient}
                >
                  <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
                </LinearGradient>
                <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {isVideo && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleToggleVideo}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isVideoOff
                      ? [colors.warning, colors.warningLight]
                      : [colors.surface + 'E0', colors.surfaceLight + 'E0']
                    }
                    style={styles.controlButtonGradient}
                  >
                    <Text style={styles.controlIcon}>{isVideoOff ? '📵' : '📹'}</Text>
                  </LinearGradient>
                  <Text style={styles.controlLabel}>{isVideoOff ? 'Video On' : 'Video Off'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.error, colors.errorLight]}
                  style={[styles.controlButtonGradient, styles.endCallButtonGradient]}
                >
                  <Text style={styles.controlIcon}>📞</Text>
                </LinearGradient>
                <Text style={[styles.controlLabel, styles.endCallLabel]}>End</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  liveIndicator: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.glow('#FF3B3B'),
  },
  liveIndicatorBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text,
  },
  liveText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: 1.5,
  },
  timerContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  timerBg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  timerLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    opacity: 0.8,
  },
  timer: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  timerLow: {
    color: colors.error,
  },

  // Center Content
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioUserContainer: {
    alignItems: 'center',
  },
  soundWavesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundWave: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: colors.success,
  },
  soundWave2: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  soundWave3: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },
  avatarWrapper: {
    marginBottom: spacing.lg,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: borderRadius.full,
    ...shadows.glow(colors.success),
  },
  audioAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.background,
  },
  audioUserName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  audioStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  audioStatus: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  videoNameContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  videoNameBg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  videoUserName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },

  // Controls
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsGradient: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    ...shadows.md,
  },
  endCallButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: 'transparent',
    ...shadows.glow(colors.error),
  },
  controlIcon: {
    fontSize: 28,
  },
  controlLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  endCallLabel: {
    color: colors.error,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    textAlign: 'center',
  },
});
