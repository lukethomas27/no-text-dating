import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { MatchingService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { Match, UserProfile, CallThread } from '../../src/types';

const { width, height } = Dimensions.get('window');

// Confetti particle component
const Particle = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const particleColors = [colors.primary, colors.secondary, colors.accent, colors.success];
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const xOffset = (Math.random() - 0.5) * 100;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height * 0.8,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: xOffset,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fade out
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, delay + 2500);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { scale },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { currentUser } = useAppStore();

  const [match, setMatch] = useState<Match | undefined>();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>();
  const [thread, setThread] = useState<CallThread | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [particles, setParticles] = useState<{ id: number; delay: number; x: number }[]>([]);

  // Animations
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0)).current;
  const photo1Anim = useRef(new Animated.Value(-100)).current;
  const photo2Anim = useRef(new Animated.Value(100)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loadData = async () => {
      if (!matchId) return;

      const matchData = await MatchingService.getMatch(matchId);
      setMatch(matchData);

      if (matchData) {
        const [other, threadData] = await Promise.all([
          MatchingService.getOtherUser(matchData),
          MatchingService.getThread(matchData.id),
        ]);
        setOtherUser(other);
        setThread(threadData);
      }

      setIsLoading(false);
    };

    loadData();
  }, [matchId]);

  useEffect(() => {
    if (!isLoading && match && otherUser) {
      // Trigger haptic celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: i * 100,
        x: Math.random() * width,
      }));
      setParticles(newParticles);

      // Start animations sequence
      Animated.sequence([
        // Container entrance
        Animated.parallel([
          Animated.spring(containerScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(containerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Title pop
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        // Photos slide in
        Animated.parallel([
          Animated.spring(photo1Anim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(photo2Anim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Heart appears
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
        // Text fades in
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Button slides up
        Animated.parallel([
          Animated.spring(buttonSlide, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous heart pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading, match, otherUser]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!match || !otherUser || !thread) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.replace('/discovery')}
        >
          <Text style={styles.errorButtonText}>Go to Discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScheduleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(`/schedule/${thread.id}`);
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/discovery');
  };

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={[colors.background, '#1a0a1a', colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated glow orbs */}
      <Animated.View style={[styles.glowOrb, styles.glowOrb1, { opacity: glowPulse }]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb2, { opacity: glowPulse }]} />

      {/* Confetti particles */}
      {particles.map((particle) => (
        <Particle key={particle.id} delay={particle.delay} startX={particle.x} />
      ))}

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          },
        ]}
      >
        {/* Title */}
        <Animated.View style={{ transform: [{ scale: titleScale }] }}>
          <Text style={styles.matchTitle}>It's a Match!</Text>
          <View style={styles.titleUnderline}>
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underlineGradient}
            />
          </View>
        </Animated.View>

        {/* Profile photos */}
        <View style={styles.photosContainer}>
          <Animated.View
            style={[
              styles.photoWrapper,
              { transform: [{ translateX: photo1Anim }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.photoBorder}
            >
              <View style={styles.photoInner}>
                <Image
                  source={{ uri: currentUser?.photos?.[0] || 'https://picsum.photos/seed/you/200/200' }}
                  style={styles.photo}
                />
              </View>
            </LinearGradient>
            <Text style={styles.photoLabel}>You</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.heartContainer,
              {
                transform: [
                  { scale: Animated.multiply(heartScale, heartPulse) },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={colors.gradientWarm as [string, string, ...string[]]}
              style={styles.heartBg}
            >
              <Text style={styles.heart}>❤️</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.photoWrapper,
              { transform: [{ translateX: photo2Anim }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradientSecondary as [string, string, ...string[]]}
              style={styles.photoBorder}
            >
              <View style={styles.photoInner}>
                <Image
                  source={{ uri: otherUser.photos[0] || 'https://picsum.photos/seed/them/200/200' }}
                  style={styles.photo}
                />
              </View>
            </LinearGradient>
            <Text style={styles.photoLabel}>{otherUser.name}</Text>
          </Animated.View>
        </View>

        {/* Text content */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.matchSubtitle}>
            You and {otherUser.name} liked each other!
          </Text>

          <View style={styles.noTextBadge}>
            <LinearGradient
              colors={[colors.glassBg, 'transparent']}
              style={styles.noTextBadgeGradient}
            >
              <Text style={styles.noTextIcon}>🎙️</Text>
              <Text style={styles.noTextMessage}>
                Skip the texting — let's get you talking!
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View
        style={[
          styles.actionContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={handleScheduleCall}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors.gradientPrimary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scheduleButtonGradient}
          >
            <Text style={styles.scheduleButtonIcon}>📞</Text>
            <Text style={styles.scheduleButtonText}>Schedule a Call</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
          <Text style={styles.laterButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  errorButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  errorButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrb1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primary,
    top: height * 0.1,
    left: -100,
    opacity: 0.15,
  },
  glowOrb2: {
    width: 250,
    height: 250,
    backgroundColor: colors.secondary,
    bottom: height * 0.15,
    right: -80,
    opacity: 0.15,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  matchTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    textAlign: 'center',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    height: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    alignSelf: 'center',
    width: 120,
    borderRadius: 2,
    overflow: 'hidden',
  },
  underlineGradient: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoWrapper: {
    alignItems: 'center',
  },
  photoBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    ...shadows.glow(colors.primary),
  },
  photoInner: {
    flex: 1,
    borderRadius: 63,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  heartContainer: {
    marginHorizontal: -spacing.lg,
    zIndex: 1,
  },
  heartBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow(colors.primary),
  },
  heart: {
    fontSize: 30,
  },
  textContainer: {
    alignItems: 'center',
  },
  matchSubtitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  noTextBadge: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  noTextBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  noTextIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  noTextMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  scheduleButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  scheduleButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  scheduleButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  laterButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
