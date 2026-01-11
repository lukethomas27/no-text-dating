import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { addMinutes, addHours, format, setHours, setMinutes, startOfDay } from 'date-fns';
import { SchedulingService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';
import { CallThread, CallProposal, CallEvent } from '../../src/types';

type CallType = 'audio' | 'video';
type SlotOption = { label: string; getDate: () => Date };

const SLOT_OPTIONS: SlotOption[] = [
  { label: 'Now', getDate: () => new Date() },
  { label: 'In 30 minutes', getDate: () => addMinutes(new Date(), 30) },
  { label: 'In 1 hour', getDate: () => addHours(new Date(), 1) },
  { label: 'Tonight 8pm', getDate: () => setMinutes(setHours(startOfDay(new Date()), 20), 0) },
  { label: 'Tomorrow 12pm', getDate: () => setMinutes(setHours(addHours(startOfDay(new Date()), 36), 12), 0) },
  { label: 'Tomorrow 6pm', getDate: () => setMinutes(setHours(addHours(startOfDay(new Date()), 42), 18), 0) },
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
    };

    loadData();
  }, [threadId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If there's already an upcoming call, redirect to lobby
  if (upcomingCall) {
    return (
      <View style={styles.container}>
        <View style={styles.confirmedContainer}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.confirmedTitle}>Call Confirmed!</Text>
          <Text style={styles.confirmedTime}>
            {format(new Date(upcomingCall.scheduledStartISO), "EEEE, MMM d 'at' h:mm a")}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace(`/call/lobby/${upcomingCall.id}`)}
          >
            <Text style={styles.primaryButtonText}>Go to Lobby</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If there's a proposal from the other user, show confirmation UI
  if (latestProposal && latestProposal.proposedBy !== session?.userId) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Pick a Time</Text>
          <Text style={styles.subtitle}>
            They want to have a {latestProposal.callType} call! Choose a time that works for you:
          </Text>

          <View style={styles.slotsContainer}>
            {latestProposal.slots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={styles.slotOption}
                onPress={async () => {
                  setIsSubmitting(true);
                  try {
                    const event = await SchedulingService.confirmSlot(threadId!, slot);
                    router.replace(`/call/lobby/${event.id}`);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to confirm slot');
                  }
                  setIsSubmitting(false);
                }}
              >
                <Text style={styles.slotText}>
                  {format(new Date(slot), "EEEE, MMM d 'at' h:mm a")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // If there's a proposal from current user, show waiting state
  if (latestProposal && latestProposal.proposedBy === session?.userId) {
    return (
      <View style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.waitingTitle}>Waiting for confirmation</Text>
          <Text style={styles.waitingSubtitle}>
            You proposed a {latestProposal.callType} call. We'll notify you when they pick a time!
          </Text>
          <Text style={styles.slotsLabel}>Your proposed times:</Text>
          {latestProposal.slots.map((slot, index) => (
            <Text key={index} style={styles.proposedSlot}>
              {format(new Date(slot), "EEEE, MMM d 'at' h:mm a")}
            </Text>
          ))}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/discovery')}
          >
            <Text style={styles.secondaryButtonText}>Back to Discovery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleSlot = (index: number) => {
    if (selectedSlots.includes(index)) {
      setSelectedSlots(selectedSlots.filter((i) => i !== index));
    } else if (selectedSlots.length < 3) {
      setSelectedSlots([...selectedSlots, index]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert('Select Times', 'Please select at least one time slot');
      return;
    }

    setIsSubmitting(true);
    try {
      const slots = selectedSlots.map((i) => SLOT_OPTIONS[i].getDate().toISOString());
      await SchedulingService.createProposal(threadId!, callType, slots);
      // Reload data to show waiting state
      const proposalData = await SchedulingService.getLatestProposal(threadId!);
      setLatestProposal(proposalData);
    } catch (error) {
      Alert.alert('Error', 'Failed to create proposal');
    }
    setIsSubmitting(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Schedule Your Call</Text>
        <Text style={styles.subtitle}>
          Pick up to 3 times that work for you
        </Text>

        {/* Call Type Selection */}
        <Text style={styles.sectionTitle}>Call Type</Text>
        <View style={styles.callTypeContainer}>
          <TouchableOpacity
            style={[
              styles.callTypeButton,
              callType === 'audio' && styles.callTypeButtonSelected,
            ]}
            onPress={() => setCallType('audio')}
          >
            <Text style={styles.callTypeIcon}>🎙️</Text>
            <Text
              style={[
                styles.callTypeText,
                callType === 'audio' && styles.callTypeTextSelected,
              ]}
            >
              Audio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.callTypeButton,
              callType === 'video' && styles.callTypeButtonSelected,
            ]}
            onPress={() => setCallType('video')}
          >
            <Text style={styles.callTypeIcon}>📹</Text>
            <Text
              style={[
                styles.callTypeText,
                callType === 'video' && styles.callTypeTextSelected,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        <Text style={styles.sectionTitle}>
          When works for you? ({selectedSlots.length}/3)
        </Text>
        <View style={styles.slotsContainer}>
          {SLOT_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.slotOption,
                selectedSlots.includes(index) && styles.slotOptionSelected,
              ]}
              onPress={() => toggleSlot(index)}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlots.includes(index) && styles.slotTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {selectedSlots.includes(index) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (selectedSlots.length === 0 || isSubmitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedSlots.length === 0 || isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Sending...' : 'Send Proposal'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  callTypeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  callTypeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  callTypeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  callTypeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  callTypeText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  callTypeTextSelected: {
    color: colors.primary,
  },
  slotsContainer: {
    gap: spacing.sm,
  },
  slotOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  slotText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  slotTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  primaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
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
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  slotsLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  proposedSlot: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  // Confirmed state
  confirmedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmedTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  confirmedTime: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
