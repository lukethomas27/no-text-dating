import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MatchingService } from '../../src/services';
import { useAppStore } from '../../src/store';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { currentUser } = useAppStore();
  
  const match = MatchingService.getMatch(matchId);
  const otherUser = match ? MatchingService.getOtherUser(match) : undefined;
  const thread = match ? MatchingService.getThread(match.id) : undefined;

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!match || !otherUser || !thread) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScheduleCall = () => {
    router.replace(`/schedule/${thread.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Celebration Background */}
      <View style={styles.celebrationBg}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.emoji2}>✨</Text>
        <Text style={styles.emoji3}>💫</Text>
      </View>

      {/* Match Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.matchTitle}>It's a Match!</Text>
        
        {/* Profile Photos */}
        <View style={styles.photosContainer}>
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: currentUser?.photos?.[0] || 'https://picsum.photos/seed/you/200/200' }}
              style={styles.photo}
            />
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heart}>❤️</Text>
          </View>
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: otherUser.photos[0] || 'https://picsum.photos/seed/them/200/200' }}
              style={styles.photo}
            />
          </View>
        </View>

        <Text style={styles.matchSubtitle}>
          You and {otherUser.name} liked each other!
        </Text>
        
        <Text style={styles.noTextMessage}>
          Skip the texting — let's get you talking!
        </Text>
      </Animated.View>

      {/* Action Button */}
      <Animated.View style={[styles.actionContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleCall}>
          <Text style={styles.scheduleButtonText}>Schedule a Call 📞</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.laterButton}
          onPress={() => router.replace('/discovery')}
        >
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  celebrationBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emoji: {
    position: 'absolute',
    fontSize: 60,
    top: '10%',
    left: '10%',
    opacity: 0.3,
  },
  emoji2: {
    position: 'absolute',
    fontSize: 40,
    top: '20%',
    right: '15%',
    opacity: 0.3,
  },
  emoji3: {
    position: 'absolute',
    fontSize: 50,
    bottom: '25%',
    left: '20%',
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoWrapper: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartContainer: {
    marginHorizontal: -spacing.md,
    zIndex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  heart: {
    fontSize: 40,
  },
  matchSubtitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  noTextMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
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
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
});
