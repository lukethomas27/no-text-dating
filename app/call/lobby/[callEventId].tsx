import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, differenceInSeconds, isPast } from 'date-fns';
import { SchedulingService, MatchingService } from '../../../src/services';
import { useAppStore } from '../../../src/store';
import { colors, spacing, borderRadius, typography } from '../../../src/constants/theme';
import { CallEvent, CallThread, Match, UserProfile } from '../../../src/types';

export default function CallLobbyScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { setActiveCallEvent } = useAppStore();

  const [callEvent, setCallEvent] = useState<CallEvent | undefined>();
  const [otherUser, setOtherUser] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [countdown, setCountdown] = useState('');
  const [canJoin, setCanJoin] = useState(false);

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
        setCanJoin(true);
        setCountdown('Ready to join!');
      } else if (diff < 60) {
        setCountdown(`${diff} seconds`);
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        setCountdown(`${mins} minute${mins !== 1 ? 's' : ''}`);
      } else {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setCountdown(`${hours}h ${mins}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [callEvent]);

  const handleJoin = async () => {
    if (!callEvent) return;
    
    // Update call state to live
    await SchedulingService.updateCallState(callEvent.id, 'live');
    setActiveCallEvent(callEvent);
    
    router.replace(`/call/in/${callEvent.id}`);
  };

  const handleCancel = () => {
    router.replace('/discovery');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!callEvent || !otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Call not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Call Lobby</Text>
        <Text style={styles.callType}>
          {callEvent.callType === 'video' ? '📹 Video' : '🎙️ Audio'} Call
        </Text>

        {/* Other User */}
        <View style={styles.userCard}>
          <Image
            source={{ uri: otherUser.photos[0] || 'https://picsum.photos/200/200' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{otherUser.name}</Text>
          <Text style={styles.userAge}>{otherUser.age} years old</Text>
        </View>

        {/* Schedule Info */}
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduledLabel}>Scheduled for</Text>
          <Text style={styles.scheduledTime}>
            {format(new Date(callEvent.scheduledStartISO), "EEEE, MMM d 'at' h:mm a")}
          </Text>
          
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>
              {canJoin ? 'Ready!' : 'Starting in'}
            </Text>
            <Text style={[styles.countdownValue, canJoin && styles.countdownReady]}>
              {countdown}
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <Text style={styles.tip}>• Find a quiet, well-lit space</Text>
          <Text style={styles.tip}>• Have some fun topics ready</Text>
          <Text style={styles.tip}>• Be yourself!</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            !canJoin && styles.joinButtonDisabled,
          ]}
          onPress={handleJoin}
          disabled={!canJoin}
        >
          <Text style={styles.joinButtonText}>
            {canJoin ? 'Join Call' : 'Waiting...'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  callType: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  userCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userAge: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scheduleInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  scheduledLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scheduledTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  countdownLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  countdownValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  countdownReady: {
    color: colors.success,
  },
  tipsContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  tipsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tip: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  joinButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  joinButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  joinButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    color: colors.error,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  button: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});
