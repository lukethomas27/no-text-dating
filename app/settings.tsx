import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { MatchingService, SchedulingService } from '../src/services';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';

export default function SettingsScreen() {
  const {
    currentUser,
    matches,
    logout,
    resetAllData,
    reseedProfiles,
    toggleAutoMatch,
    autoMatchNextLike,
    getOtherUser,
  } = useAppStore();

  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all matches, swipes, and calls. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await resetAllData();
            setIsResetting(false);
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleReseed = async () => {
    await reseedProfiles();
    Alert.alert('Done', 'Demo profiles have been reseeded!');
  };

  const navigateToThread = (matchId: string) => {
    const thread = MatchingService.getThread(matchId);
    if (thread) {
      const upcomingCall = SchedulingService.getUpcomingCall(thread.id);
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
              <Text style={styles.profileEdit}>Tap to edit profile →</Text>
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
              {matches.map((match) => {
                const otherUser = getOtherUser(match);
                if (!otherUser) return null;
                
                const thread = MatchingService.getThread(match.id);
                const hasUpcomingCall = thread
                  ? SchedulingService.getUpcomingCall(thread.id)
                  : null;

                return (
                  <TouchableOpacity
                    key={match.id}
                    style={styles.matchItem}
                    onPress={() => navigateToThread(match.id)}
                  >
                    <Image
                      source={{ uri: otherUser.photos[0] || 'https://picsum.photos/100/100' }}
                      style={styles.matchAvatar}
                    />
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>{otherUser.name}</Text>
                      <Text style={styles.matchStatus}>
                        {hasUpcomingCall
                          ? '📞 Call scheduled'
                          : thread?.schedulingState === 'proposed'
                          ? '⏳ Waiting for confirmation'
                          : '💬 Schedule a call'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Dev Panel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Dev Panel</Text>
          <View style={styles.devCard}>
            <View style={styles.devOption}>
              <View>
                <Text style={styles.devOptionLabel}>Auto-match next like</Text>
                <Text style={styles.devOptionDescription}>
                  Instantly match with the next person you like
                </Text>
              </View>
              <Switch
                value={autoMatchNextLike}
                onValueChange={toggleAutoMatch}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>

            <TouchableOpacity style={styles.devButton} onPress={handleReseed}>
              <Text style={styles.devButtonText}>🔄 Reseed Demo Profiles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devButton, styles.devButtonDanger]}
              onPress={handleResetData}
              disabled={isResetting}
            >
              <Text style={styles.devButtonText}>
                {isResetting ? 'Resetting...' : '🗑️ Reset All Data'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>No Text Dating</Text>
          <Text style={styles.appVersion}>MVP v1.0.0</Text>
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
  devCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderStyle: 'dashed',
  },
  devOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  devOptionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  devOptionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    maxWidth: 200,
  },
  devButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  devButtonDanger: {
    backgroundColor: colors.error,
  },
  devButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
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
