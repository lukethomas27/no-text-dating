import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { addMinutes, addHours, format, setHours, setMinutes, startOfDay } from 'date-fns';
import { SchedulingService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { CallThread, CallProposal, CallEvent } from '../../src/types';

type CallType = 'audio' | 'video';
type SlotOption = { label: string; sublabel: string; getDate: () => Date; icon: string };

const SLOT_OPTIONS: SlotOption[] = [
  { label: 'Now', sublabel: 'Start immediately', getDate: () => new Date(), icon: '⚡' },
  { label: 'In 30 minutes', sublabel: 'Quick break first', getDate: () => addMinutes(new Date(), 30), icon: '☕' },
  { label: 'In 1 hour', sublabel: 'Time to prepare', getDate: () => addHours(new Date(), 1), icon: '⏰' },
  { label: 'Tonight 8pm', sublabel: 'Evening chat', getDate: () => setMinutes(setHours(startOfDay(new Date()), 20), 0), icon: '🌙' },
  { label: 'Tomorrow 12pm', sublabel: 'Lunch time', getDate: () => setMinutes(setHours(addHours(startOfDay(new Date()), 36), 12), 0), icon: '☀️' },
  { label: 'Tomorrow 6pm', sublabel: 'After work', getDate: () => setMinutes(setHours(addHours(startOfDay(new Date()), 42), 18), 0), icon: '🌆' },
];

export default function ScheduleScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { session } = useAppStore();

  const [thread, setThread] = useState<CallThread | undefined>();
  const [latestProposal, setLatestProposal] = useState<CallProposal | undefined>();
  const [upcomingCall, setUpcomingCall] = useState<CallEvent | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [callType, setCallType] = useState<CallType>('video');
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadData = async () => {
      if (!threadId) return;

      const [threadData, proposalData, callData] = await Promise.all([
        SchedulingService.getThread(threadId),
        SchedulingService.getLatestProposal(threadId),
        SchedulingService.getUpcomingCall(threadId),
      ]);

      setThread(threadData);
      setLatestProposal(proposalData);
      setUpcomingCall(callData);
      setIsLoading(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    };

    loadData();
  }, [threadId]);

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

  // If there's already an upcoming call, redirect to lobby
  if (upcomingCall) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated, colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.confirmedContainer}>
            <View style={styles.confirmedIconContainer}>
              <LinearGradient
                colors={colors.gradientSuccess as [string, string, ...string[]]}
                style={styles.confirmedIconGradient}
              >
                <Text style={styles.confirmedIcon}>🎉</Text>
              </LinearGradient>
            </View>
            <Text style={styles.confirmedTitle}>Call Confirmed!</Text>
            <View style={styles.confirmedTimeCard}>
              <LinearGradient
                colors={colors.gradientCard as [string, string, ...string[]]}
                style={styles.confirmedTimeGradient}
              >
                <Text style={styles.confirmedTimeLabel}>Scheduled for</Text>
                <Text style={styles.confirmedTime}>
                  {format(new Date(upcomingCall.scheduledStartISO), "EEEE, MMM d")}
                </Text>
                <Text style={styles.confirmedTimeHour}>
                  {format(new Date(upcomingCall.scheduledStartISO), "h:mm a")}
                </Text>
              </LinearGradient>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace(`/call/lobby/${upcomingCall.id}`);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonIcon}>📞</Text>
                <Text style={styles.primaryButtonText}>Go to Lobby</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // If there's a proposal from the other user, show confirmation UI
  if (latestProposal && latestProposal.proposedBy !== session?.userId) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated, colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Pick a Time</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.proposalBanner}>
              <LinearGradient
                colors={colors.gradientSecondary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proposalBannerGradient}
              >
                <Text style={styles.proposalIcon}>
                  {latestProposal.callType === 'video' ? '📹' : '🎙️'}
                </Text>
                <Text style={styles.proposalText}>
                  They want a {latestProposal.callType} call!
                </Text>
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Choose a time that works</Text>

            <View style={styles.slotsContainer}>
              {latestProposal.slots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.confirmSlot}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsSubmitting(true);
                    try {
                      const event = await SchedulingService.confirmSlot(threadId!, slot);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      router.replace(`/call/lobby/${event.id}`);
                    } catch (error) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Alert.alert('Error', 'Failed to confirm slot');
                    }
                    setIsSubmitting(false);
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={colors.gradientCard as [string, string, ...string[]]}
                    style={styles.confirmSlotGradient}
                  >
                    <View style={styles.confirmSlotContent}>
                      <Text style={styles.confirmSlotDate}>
                        {format(new Date(slot), "EEEE, MMM d")}
                      </Text>
                      <Text style={styles.confirmSlotTime}>
                        {format(new Date(slot), "h:mm a")}
                      </Text>
                    </View>
                    <View style={styles.confirmSlotArrow}>
                      <Text style={styles.confirmSlotArrowText}>→</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // If there's a proposal from current user, show waiting state
  if (latestProposal && latestProposal.proposedBy === session?.userId) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated, colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.waitingContainer}>
            <View style={styles.waitingIconContainer}>
              <LinearGradient
                colors={colors.gradientWarm as [string, string, ...string[]]}
                style={styles.waitingIconGradient}
              >
                <Text style={styles.waitingIcon}>⏳</Text>
              </LinearGradient>
            </View>
            <Text style={styles.waitingTitle}>Waiting for response</Text>
            <Text style={styles.waitingSubtitle}>
              You proposed a {latestProposal.callType} call. We'll notify you when they pick a time!
            </Text>

            <View style={styles.proposedTimesCard}>
              <LinearGradient
                colors={colors.gradientCard as [string, string, ...string[]]}
                style={styles.proposedTimesGradient}
              >
                <Text style={styles.proposedTimesLabel}>Your proposed times</Text>
                {latestProposal.slots.map((slot, index) => (
                  <View key={index} style={styles.proposedTimeItem}>
                    <Text style={styles.proposedTimeBullet}>•</Text>
                    <Text style={styles.proposedTimeText}>
                      {format(new Date(slot), "EEEE, MMM d 'at' h:mm a")}
                    </Text>
                  </View>
                ))}
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/discovery');
              }}
            >
              <Text style={styles.secondaryButtonText}>Back to Discovery</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const toggleSlot = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedSlots.includes(index)) {
      setSelectedSlots(selectedSlots.filter((i) => i !== index));
    } else if (selectedSlots.length < 3) {
      setSelectedSlots([...selectedSlots, index]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select Times', 'Please select at least one time slot');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    try {
      const slots = selectedSlots.map((i) => SLOT_OPTIONS[i].getDate().toISOString());
      await SchedulingService.createProposal(threadId!, callType, slots);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const proposalData = await SchedulingService.getLatestProposal(threadId!);
      setLatestProposal(proposalData);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create proposal');
    }
    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Schedule Call</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.subtitle}>
              Pick up to 3 times that work for you
            </Text>

            {/* Call Type Selection */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📞</Text>
              <Text style={styles.sectionTitle}>Call Type</Text>
            </View>
            <View style={styles.callTypeContainer}>
              <TouchableOpacity
                style={[styles.callTypeButton, callType === 'audio' && styles.callTypeButtonSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCallType('audio');
                }}
                activeOpacity={0.9}
              >
                {callType === 'audio' ? (
                  <LinearGradient
                    colors={colors.gradientSecondary as [string, string, ...string[]]}
                    style={styles.callTypeGradient}
                  >
                    <Text style={styles.callTypeIcon}>🎙️</Text>
                    <Text style={styles.callTypeTextSelected}>Audio</Text>
                    <Text style={styles.callTypeSubtext}>Voice only</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.callTypeInner}>
                    <Text style={styles.callTypeIcon}>🎙️</Text>
                    <Text style={styles.callTypeText}>Audio</Text>
                    <Text style={styles.callTypeSubtext}>Voice only</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callTypeButton, callType === 'video' && styles.callTypeButtonSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCallType('video');
                }}
                activeOpacity={0.9}
              >
                {callType === 'video' ? (
                  <LinearGradient
                    colors={colors.gradientPrimary as [string, string, ...string[]]}
                    style={styles.callTypeGradient}
                  >
                    <Text style={styles.callTypeIcon}>📹</Text>
                    <Text style={styles.callTypeTextSelected}>Video</Text>
                    <Text style={styles.callTypeSubtext}>Face to face</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.callTypeInner}>
                    <Text style={styles.callTypeIcon}>📹</Text>
                    <Text style={styles.callTypeText}>Video</Text>
                    <Text style={styles.callTypeSubtext}>Face to face</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Time Slots */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🕐</Text>
              <Text style={styles.sectionTitle}>When works for you?</Text>
              <View style={styles.slotCountBadge}>
                <LinearGradient
                  colors={selectedSlots.length > 0 ? colors.gradientPrimary as [string, string, ...string[]] : [colors.surface, colors.surfaceLight]}
                  style={styles.slotCountGradient}
                >
                  <Text style={styles.slotCountText}>{selectedSlots.length}/3</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.slotsContainer}>
              {SLOT_OPTIONS.map((option, index) => {
                const isSelected = selectedSlots.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.slotOption, isSelected && styles.slotOptionSelected]}
                    onPress={() => toggleSlot(index)}
                    activeOpacity={0.9}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={colors.gradientCard as [string, string, ...string[]]}
                        style={styles.slotGradient}
                      >
                        <Text style={styles.slotIcon}>{option.icon}</Text>
                        <View style={styles.slotContent}>
                          <Text style={styles.slotLabelSelected}>{option.label}</Text>
                          <Text style={styles.slotSublabel}>{option.sublabel}</Text>
                        </View>
                        <View style={styles.slotCheckmark}>
                          <LinearGradient
                            colors={colors.gradientSuccess as [string, string, ...string[]]}
                            style={styles.slotCheckmarkGradient}
                          >
                            <Text style={styles.slotCheckmarkText}>✓</Text>
                          </LinearGradient>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.slotInner}>
                        <Text style={styles.slotIcon}>{option.icon}</Text>
                        <View style={styles.slotContent}>
                          <Text style={styles.slotLabel}>{option.label}</Text>
                          <Text style={styles.slotSublabel}>{option.sublabel}</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (selectedSlots.length === 0 || isSubmitting) && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={selectedSlots.length === 0 || isSubmitting}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={selectedSlots.length === 0 || isSubmitting ? [colors.surfaceLight, colors.surface] : colors.gradientPrimary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonIcon}>✨</Text>
                    <Text style={styles.primaryButtonText}>Send Proposal</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: spacing.xxl }} />
        </Animated.ScrollView>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
  },
  slotCountBadge: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  slotCountGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  slotCountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  callTypeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  callTypeButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  callTypeButtonSelected: {
    borderColor: 'transparent',
  },
  callTypeGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  callTypeInner: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  callTypeIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  callTypeText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  callTypeTextSelected: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  callTypeSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  slotsContainer: {
    gap: spacing.sm,
  },
  slotOption: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  slotOptionSelected: {
    borderColor: colors.success,
    ...shadows.sm,
  },
  slotGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  slotInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  slotIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  slotContent: {
    flex: 1,
  },
  slotLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  slotLabelSelected: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  slotSublabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  slotCheckmark: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  slotCheckmarkGradient: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCheckmarkText: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.xl,
    ...shadows.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  primaryButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  // Waiting state
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  waitingIconContainer: {
    marginBottom: spacing.lg,
  },
  waitingIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow(colors.accent),
  },
  waitingIcon: {
    fontSize: 50,
  },
  waitingTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  proposedTimesCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  proposedTimesGradient: {
    padding: spacing.lg,
  },
  proposedTimesLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  proposedTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  proposedTimeBullet: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  proposedTimeText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  // Confirmed state
  confirmedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmedIconContainer: {
    marginBottom: spacing.lg,
  },
  confirmedIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow(colors.success),
  },
  confirmedIcon: {
    fontSize: 50,
  },
  confirmedTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.success,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  confirmedTimeCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
    marginBottom: spacing.xl,
  },
  confirmedTimeGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  confirmedTimeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  confirmedTime: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  confirmedTimeHour: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  // Proposal banner
  proposalBanner: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  proposalBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  proposalIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  proposalText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  // Confirm slot
  confirmSlot: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    ...shadows.sm,
  },
  confirmSlotGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  confirmSlotContent: {
    flex: 1,
  },
  confirmSlotDate: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  confirmSlotTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  confirmSlotArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmSlotArrowText: {
    fontSize: 18,
    color: colors.primary,
  },
});
