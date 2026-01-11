import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SchedulingService, MatchingService } from '../../../src/services';
import { useAppStore } from '../../../src/store';
import { colors, spacing, borderRadius, typography } from '../../../src/constants/theme';

export default function InCallScreen() {
  const { callEventId } = useLocalSearchParams<{ callEventId: string }>();
  const { setActiveCallEvent } = useAppStore();
  
  const callEvent = SchedulingService.getCallEvent(callEventId);
  const thread = callEvent ? SchedulingService.getThread(callEvent.threadId) : null;
  const match = thread ? MatchingService.getMatch(thread.matchId) : null;
  const otherUser = match ? MatchingService.getOtherUser(match) : null;

  const [timeRemaining, setTimeRemaining] = useState(callEvent?.durationSeconds || 30);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the call indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleEndCall();
      return;
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
    if (callEvent) {
      await SchedulingService.updateCallState(callEvent.id, 'completed');
      setActiveCallEvent(null);
      router.replace(`/feedback/${callEvent.id}`);
    }
  };

  if (!callEvent || !otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Call not found</Text>
      </SafeAreaView>
    );
  }

  const isVideo = callEvent.callType === 'video';

  return (
    <View style={styles.container}>
      {/* Simulated Video Background */}
      {isVideo && (
        <Image
          source={{ uri: otherUser.photos[0] || 'https://picsum.photos/400/600' }}
          style={styles.videoBackground}
          blurRadius={isVideoOff ? 20 : 0}
        />
      )}

      {/* Overlay */}
      <View style={[styles.overlay, !isVideo && styles.audioOverlay]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.liveIndicator,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </Animated.View>
            
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Time Remaining</Text>
              <Text style={[styles.timer, timeRemaining < 60 && styles.timerLow]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>

          {/* Center Content */}
          <View style={styles.centerContent}>
            {!isVideo && (
              <View style={styles.audioUserContainer}>
                <Image
                  source={{ uri: otherUser.photos[0] || 'https://picsum.photos/200/200' }}
                  style={styles.audioAvatar}
                />
                <Text style={styles.audioUserName}>{otherUser.name}</Text>
                <Text style={styles.audioStatus}>Audio call in progress...</Text>
              </View>
            )}
            
            {isVideo && (
              <View style={styles.videoNameContainer}>
                <Text style={styles.videoUserName}>{otherUser.name}</Text>
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            {isVideo && (
              <TouchableOpacity
                style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                onPress={() => setIsVideoOff(!isVideoOff)}
              >
                <Text style={styles.controlIcon}>{isVideoOff ? '📵' : '📹'}</Text>
                <Text style={styles.controlLabel}>{isVideoOff ? 'Video On' : 'Video Off'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleEndCall}
            >
              <Text style={styles.controlIcon}>📞</Text>
              <Text style={styles.controlLabel}>End</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  audioOverlay: {
    backgroundColor: colors.backgroundSecondary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.text,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    opacity: 0.7,
  },
  timer: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  timerLow: {
    color: colors.error,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioUserContainer: {
    alignItems: 'center',
  },
  audioAvatar: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.full,
    borderWidth: 4,
    borderColor: colors.success,
    marginBottom: spacing.lg,
  },
  audioUserName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  audioStatus: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  videoNameContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  videoUserName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: colors.warning,
  },
  endCallButton: {
    backgroundColor: colors.error,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
