import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { SchedulingService, MatchingService, SafetyService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { CallEvent, UserProfile } from '../../src/types';

const { width, height } = Dimensions.get('window');

type ReportCategory = 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other';

const REPORT_CATEGORIES: { id: ReportCategory; label: string; icon: string }[] = [
  { id: 'inappropriate', label: 'Inappropriate content', icon: '⚠️' },
  { id: 'fake', label: 'Fake profile', icon: '🎭' },
  { id: 'harassment', label: 'Harassment', icon: '😤' },
  { id: 'spam', label: 'Spam', icon: '📧' },
  { id: 'other', label: 'Other', icon: '📝' },
];

export default function FeedbackScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { blockUser, refreshMatches, refreshCandidates } = useAppStore();

  const [callEvent, setCallEvent] = useState<CallEvent | undefined>();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Content entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Anim, {
          toValue: 0,
          duration: 8000,
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

  const handleFeedback = async (rating: 'interested' | 'not_interested') => {
    if (!callEvent) return;

    Haptics.impactAsync(
      rating === 'interested'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium
    );

    setIsSubmitting(true);
    try {
      await SafetyService.createFeedback(callEvent.id, rating);

      if (rating === 'interested') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Great!',
          "We'll let them know you're interested in connecting again.",
          [{ text: 'Continue', onPress: () => router.replace('/discovery') }]
        );
      } else {
        router.replace('/discovery');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
    setIsSubmitting(false);
  };

  const handleBlock = async () => {
    if (!otherUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser.name}? They won't be able to see you or contact you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await blockUser(otherUser.id);
            refreshMatches();
            refreshCandidates();
            router.replace('/discovery');
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    if (!otherUser || !reportCategory) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsSubmitting(true);
    try {
      await SafetyService.report(otherUser.id, reportCategory, reportNotes);
      await blockUser(otherUser.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Report Submitted',
        "Thank you for helping keep our community safe. We've also blocked this user for you.",
        [{ text: 'Continue', onPress: () => router.replace('/discovery') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    }
    setIsSubmitting(false);
  };

  const orb1TranslateY = orb1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const orb2TranslateX = orb2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
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

  if (showReport) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated, colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.reportContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowReport(false);
                }}
              >
                <View style={styles.backButtonInner}>
                  <Text style={styles.backButtonText}>{'<'} Back</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.reportHeader}>
                <View style={styles.reportIconContainer}>
                  <LinearGradient
                    colors={[colors.error + '20', colors.error + '10']}
                    style={styles.reportIconBg}
                  >
                    <Text style={styles.reportIcon}>🚩</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.reportTitle}>Report {otherUser.name}</Text>
                <Text style={styles.reportSubtitle}>
                  Help us understand what happened. Your report is confidential.
                </Text>
              </View>

              {/* Categories */}
              <Text style={styles.label}>What's the issue?</Text>
              <View style={styles.categoriesContainer}>
                {REPORT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryOption}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReportCategory(category.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={reportCategory === category.id
                        ? [colors.error + '30', colors.error + '20']
                        : [colors.surface, colors.backgroundCard]
                      }
                      style={[
                        styles.categoryGradient,
                        reportCategory === category.id && styles.categorySelected,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text
                        style={[
                          styles.categoryText,
                          reportCategory === category.id && styles.categoryTextSelected,
                        ]}
                      >
                        {category.label}
                      </Text>
                      {reportCategory === category.id && (
                        <View style={styles.checkmarkContainer}>
                          <LinearGradient
                            colors={[colors.error, colors.errorLight]}
                            style={styles.checkmarkBg}
                          >
                            <Text style={styles.checkmark}>✓</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.label}>Additional details (optional)</Text>
              <View style={styles.textAreaContainer}>
                <LinearGradient
                  colors={[colors.surface, colors.backgroundCard]}
                  style={styles.textAreaGradient}
                >
                  <TextInput
                    style={styles.textArea}
                    placeholder="Tell us more about what happened..."
                    placeholderTextColor={colors.textMuted}
                    value={reportNotes}
                    onChangeText={setReportNotes}
                    multiline
                    numberOfLines={4}
                  />
                </LinearGradient>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReport}
                disabled={!reportCategory || isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(!reportCategory || isSubmitting)
                    ? [colors.surfaceLight, colors.surfaceLighter]
                    : [colors.error, colors.errorLight]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={[
                    styles.submitButtonText,
                    (!reportCategory || isSubmitting) && styles.submitButtonTextDisabled,
                  ]}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

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
          colors={[colors.success + '30', colors.success + '10']}
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
          colors={[colors.secondary + '25', colors.secondary + '05']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.emojiContainer}>
              <LinearGradient
                colors={[colors.surface + 'CC', colors.backgroundCard + 'AA']}
                style={styles.emojiBg}
              >
                <Text style={styles.emoji}>📞</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Call Ended</Text>
            <Text style={styles.subtitle}>
              How was your call with {otherUser.name}?
            </Text>
          </View>

          {/* Feedback Options */}
          <View style={styles.feedbackOptions}>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback('interested')}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientSuccess as [string, string]}
                style={styles.feedbackButtonGradient}
              >
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackEmoji}>💚</Text>
                  <Text style={styles.feedbackText}>Interested</Text>
                  <Text style={styles.feedbackSubtext}>I'd like to talk again</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback('not_interested')}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.surface, colors.backgroundCard]}
                style={[styles.feedbackButtonGradient, styles.feedbackButtonOutline]}
              >
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackEmoji}>👋</Text>
                  <Text style={styles.feedbackText}>Not Interested</Text>
                  <Text style={styles.feedbackSubtext}>Not the right fit</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Safety Options */}
          <View style={styles.safetySection}>
            <Text style={styles.safetyTitle}>Something wrong?</Text>
            <View style={styles.safetyButtons}>
              <TouchableOpacity
                style={styles.safetyButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowReport(true);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.surface + 'E0', colors.backgroundCard + 'E0']}
                  style={styles.safetyButtonGradient}
                >
                  <Text style={styles.safetyButtonIcon}>🚩</Text>
                  <Text style={styles.safetyButtonText}>Report</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyButton}
                onPress={handleBlock}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.surface + 'E0', colors.backgroundCard + 'E0']}
                  style={styles.safetyButtonGradient}
                >
                  <Text style={styles.safetyButtonIcon}>🚫</Text>
                  <Text style={styles.safetyButtonText}>Block</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Skip */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/discovery');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Decorative Orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  orb1: {
    top: height * 0.15,
    right: -40,
    width: 160,
    height: 160,
  },
  orb2: {
    bottom: height * 0.15,
    left: -60,
    width: 200,
    height: 200,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emojiContainer: {
    marginBottom: spacing.lg,
  },
  emojiBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Feedback Options
  feedbackOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  feedbackButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  feedbackButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  feedbackButtonOutline: {
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  feedbackContent: {
    alignItems: 'center',
  },
  feedbackEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  feedbackText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  feedbackSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Safety Section
  safetySection: {
    width: '100%',
    marginTop: spacing.md,
  },
  safetyTitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  safetyButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  safetyButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  safetyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: borderRadius.lg,
  },
  safetyButtonIcon: {
    fontSize: 16,
  },
  safetyButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  // Skip Button
  skipButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  skipButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },

  // Report Screen
  reportContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  backButtonInner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  reportIconContainer: {
    marginBottom: spacing.md,
  },
  reportIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportIcon: {
    fontSize: 36,
  },
  reportTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  reportSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryOption: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  categorySelected: {
    borderColor: colors.error,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
  checkmarkContainer: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  checkmarkBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  textAreaContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  textAreaGradient: {
    borderRadius: borderRadius.lg,
  },
  textArea: {
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  submitButtonGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  submitButtonTextDisabled: {
    color: colors.textMuted,
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
