import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SchedulingService, MatchingService, SafetyService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';

type ReportCategory = 'inappropriate' | 'fake' | 'harassment' | 'spam' | 'other';

export default function FeedbackScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { blockUser, refreshMatches, refreshCandidates } = useAppStore();
  
  const callEvent = SchedulingService.getCallEvent(callEventId);
  const thread = callEvent ? SchedulingService.getThread(callEvent.threadId) : null;
  const match = thread ? MatchingService.getMatch(thread.matchId) : null;
  const otherUser = match ? MatchingService.getOtherUser(match) : null;

  const [showReport, setShowReport] = useState(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (rating: 'interested' | 'not_interested') => {
    if (!callEvent) return;
    
    setIsSubmitting(true);
    try {
      await SafetyService.createFeedback(callEvent.id, rating);
      
      if (rating === 'interested') {
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
    
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser.name}? They won't be able to see you or contact you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
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
    
    setIsSubmitting(true);
    try {
      await SafetyService.report(otherUser.id, reportCategory, reportNotes);
      await blockUser(otherUser.id);
      
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

  if (!callEvent || !otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Call not found</Text>
      </SafeAreaView>
    );
  }

  if (showReport) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Report {otherUser.name}</Text>
          <Text style={styles.subtitle}>
            Help us understand what happened. Your report is confidential.
          </Text>

          <Text style={styles.label}>What's the issue?</Text>
          {(['inappropriate', 'fake', 'harassment', 'spam', 'other'] as ReportCategory[]).map(
            (category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  reportCategory === category && styles.categoryOptionSelected,
                ]}
                onPress={() => setReportCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    reportCategory === category && styles.categoryTextSelected,
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {reportCategory === category && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )
          )}

          <Text style={styles.label}>Additional details (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us more about what happened..."
            placeholderTextColor={colors.textMuted}
            value={reportNotes}
            onChangeText={setReportNotes}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!reportCategory || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleReport}
            disabled={!reportCategory || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowReport(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📞</Text>
        <Text style={styles.title}>Call Ended</Text>
        <Text style={styles.subtitle}>
          How was your call with {otherUser.name}?
        </Text>

        {/* Main Feedback Options */}
        <View style={styles.feedbackOptions}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.interestedButton]}
            onPress={() => handleFeedback('interested')}
            disabled={isSubmitting}
          >
            <Text style={styles.feedbackEmoji}>💚</Text>
            <Text style={styles.feedbackText}>Interested</Text>
            <Text style={styles.feedbackSubtext}>I'd like to talk again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.feedbackButton, styles.notInterestedButton]}
            onPress={() => handleFeedback('not_interested')}
            disabled={isSubmitting}
          >
            <Text style={styles.feedbackEmoji}>👋</Text>
            <Text style={styles.feedbackText}>Not Interested</Text>
            <Text style={styles.feedbackSubtext}>Not the right fit</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Options */}
        <View style={styles.safetySection}>
          <Text style={styles.safetyTitle}>Something wrong?</Text>
          <View style={styles.safetyButtons}>
            <TouchableOpacity
              style={styles.safetyButton}
              onPress={() => setShowReport(true)}
            >
              <Text style={styles.safetyButtonText}>🚩 Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.safetyButton} onPress={handleBlock}>
              <Text style={styles.safetyButtonText}>🚫 Block</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/discovery')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  feedbackOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  feedbackButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  interestedButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.success,
  },
  notInterestedButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceLight,
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
  safetySection: {
    width: '100%',
    marginTop: spacing.lg,
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
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  safetyButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  skipButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  skipButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  // Report screen styles
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  categoryText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  submitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
