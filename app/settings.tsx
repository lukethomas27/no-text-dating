import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { MatchingService, SchedulingService } from '../src/services';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';
import { UserProfile, CallThread, CallEvent } from '../src/types';

interface MatchWithDetails {
  matchId: string;
  otherUser: UserProfile | undefined;
  thread: CallThread | undefined;
  upcomingCall: CallEvent | undefined;
}

export default function SettingsScreen() {
  const { currentUser, matches, signOut, getOtherUser } = useAppStore();
  const [matchDetails, setMatchDetails] = useState<MatchWithDetails[]>([]);

  // Load match details asynchronously
  useEffect(() => {
    const loadMatchDetails = async () => {
      const details = await Promise.all(
        matches.map(async (match) => {
          const otherUser = await getOtherUser(match);
          const thread = await MatchingService.getThread(match.id);
          const upcomingCall = thread
            ? await SchedulingService.getUpcomingCall(thread.id)
            : undefined;
          return {
            matchId: match.id,
            otherUser,
            thread,
            upcomingCall,
          };
        })
      );
      setMatchDetails(details);
    };
    loadMatchDetails();
  }, [matches]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const navigateToThread = async (matchId: string) => {
    const thread = await MatchingService.getThread(matchId);
    if (thread) {
      const upcomingCall = await SchedulingService.getUpcomingCall(thread.id);
      if (upcomingCall) {
        router.push(`/call/lobby/${upcomingCall.id}`);
      } else {
        router.push(`/schedule/${thread.id}`);
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/profile/edit')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {currentUser?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {currentUser?.name || 'Unknown'}, {currentUser?.age || '?'}
              </Text>
              <Text style={styles.profileEdit}>Tap to edit profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Matches Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Matches ({matches.length})</Text>
          {matches.length === 0 ? (
            <View style={styles.emptyMatches}>
              <Text style={styles.emptyMatchesText}>
                No matches yet! Keep swiping to find your first match.
              </Text>
            </View>
          ) : (
            <View style={styles.matchesList}>
              {matchDetails.map((detail) => {
                if (!detail.otherUser) return null;

                return (
                  <TouchableOpacity
                    key={detail.matchId}
                    style={styles.matchItem}
                    onPress={() => navigateToThread(detail.matchId)}
                  >
                    <Image
                      source={{
                        uri: detail.otherUser.photos[0] || 'https://picsum.photos/100/100',
                      }}
                      style={styles.matchAvatar}
                    />
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>{detail.otherUser.name}</Text>
                      <Text style={styles.matchStatus}>
                        {detail.upcomingCall
                          ? 'Call scheduled'
                          : detail.thread?.schedulingState === 'proposed'
                          ? 'Waiting for confirmation'
                          : 'Schedule a call'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>No Text Dating</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <Text style={styles.appTagline}>Skip the chat. Start talking.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  profileEdit: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  emptyMatches: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  emptyMatchesText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  matchesList: {
    gap: spacing.sm,
  },
  matchItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  matchStatus: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  appName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  appVersion: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  appTagline: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
