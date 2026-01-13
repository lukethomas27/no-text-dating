import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { MatchingService, SchedulingService } from '../src/services';
import { colors, spacing, borderRadius, typography, shadows } from '../src/constants/theme';
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

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const navigateToThread = async (matchId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const getStatusBadge = (detail: MatchWithDetails) => {
    if (detail.upcomingCall) {
      return {
        text: 'Call Scheduled',
        colors: colors.gradientSuccess as [string, string, ...string[]],
        icon: '📞',
      };
    } else if (detail.thread?.schedulingState === 'proposed') {
      return {
        text: 'Pending',
        colors: colors.gradientWarm as [string, string, ...string[]],
        icon: '⏳',
      };
    }
    return {
      text: 'Schedule Call',
      colors: colors.gradientSecondary as [string, string, ...string[]],
      icon: '💬',
    };
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>Your Profile</Text>
            </View>
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/edit');
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.gradientCard as [string, string, ...string[]]}
                style={styles.profileCardGradient}
              >
                <View style={styles.profileAvatarContainer}>
                  {currentUser?.photos?.[0] ? (
                    <Image
                      source={{ uri: currentUser.photos[0] }}
                      style={styles.profileAvatarImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      style={styles.profileAvatar}
                    >
                      <Text style={styles.profileAvatarText}>
                        {currentUser?.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </LinearGradient>
                  )}
                  <View style={styles.editBadge}>
                    <Text style={styles.editBadgeText}>✎</Text>
                  </View>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {currentUser?.name || 'Unknown'}, {currentUser?.age || '?'}
                  </Text>
                  <View style={styles.profileEditRow}>
                    <Text style={styles.profileEdit}>Tap to edit profile</Text>
                    <Text style={styles.profileArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Matches Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>❤️</Text>
              <Text style={styles.sectionTitle}>Your Matches</Text>
              <View style={styles.matchCountBadge}>
                <LinearGradient
                  colors={matches.length > 0 ? colors.gradientPrimary as [string, string, ...string[]] : [colors.surface, colors.surfaceLight]}
                  style={styles.matchCountGradient}
                >
                  <Text style={styles.matchCountText}>{matches.length}</Text>
                </LinearGradient>
              </View>
            </View>

            {matches.length === 0 ? (
              <View style={styles.emptyMatches}>
                <LinearGradient
                  colors={colors.gradientCard as [string, string, ...string[]]}
                  style={styles.emptyMatchesGradient}
                >
                  <Text style={styles.emptyIcon}>💫</Text>
                  <Text style={styles.emptyMatchesTitle}>No matches yet</Text>
                  <Text style={styles.emptyMatchesText}>
                    Keep swiping to find your first match!
                  </Text>
                  <TouchableOpacity
                    style={styles.discoverButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/discovery');
                    }}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary as [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.discoverButtonGradient}
                    >
                      <Text style={styles.discoverButtonText}>Start Discovering</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.matchesList}>
                {matchDetails.map((detail, index) => {
                  if (!detail.otherUser) return null;
                  const status = getStatusBadge(detail);

                  return (
                    <TouchableOpacity
                      key={detail.matchId}
                      style={styles.matchItem}
                      onPress={() => navigateToThread(detail.matchId)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={colors.gradientCard as [string, string, ...string[]]}
                        style={styles.matchItemGradient}
                      >
                        <View style={styles.matchAvatarContainer}>
                          <Image
                            source={{
                              uri: detail.otherUser.photos[0] || 'https://picsum.photos/100/100',
                            }}
                            style={styles.matchAvatar}
                          />
                          <View style={styles.onlineIndicator} />
                        </View>
                        <View style={styles.matchInfo}>
                          <Text style={styles.matchName}>{detail.otherUser.name}</Text>
                          <View style={styles.statusBadge}>
                            <LinearGradient
                              colors={status.colors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.statusBadgeGradient}
                            >
                              <Text style={styles.statusIcon}>{status.icon}</Text>
                              <Text style={styles.statusText}>{status.text}</Text>
                            </LinearGradient>
                          </View>
                        </View>
                        <Text style={styles.matchArrow}>→</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚙️</Text>
              <Text style={styles.sectionTitle}>Account</Text>
            </View>

            <View style={styles.settingsGroup}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Coming Soon', 'Notifications settings will be available in a future update.');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconBg, { backgroundColor: colors.secondaryMuted }]}>
                    <Text style={styles.settingsIcon}>🔔</Text>
                  </View>
                  <Text style={styles.settingsItemText}>Notifications</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconBg, { backgroundColor: colors.successMuted }]}>
                    <Text style={styles.settingsIcon}>🔒</Text>
                  </View>
                  <Text style={styles.settingsItemText}>Privacy</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Coming Soon', 'Help & Support will be available in a future update.');
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconBg, { backgroundColor: colors.accentMuted }]}>
                    <Text style={styles.settingsIcon}>❓</Text>
                  </View>
                  <Text style={styles.settingsItemText}>Help & Support</Text>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.9}
            >
              <View style={styles.logoutButtonInner}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <LinearGradient
              colors={colors.gradientPrimary as [string, string, ...string[]]}
              style={styles.appLogoGradient}
            >
              <Text style={styles.appLogoText}>NT</Text>
            </LinearGradient>
            <Text style={styles.appName}>No Text Dating</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appTagline}>Skip the chat. Start talking.</Text>
          </View>

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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  matchCountBadge: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  matchCountGradient: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  profileCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: borderRadius.xl,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profileAvatarText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  editBadgeText: {
    fontSize: 12,
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEdit: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  profileArrow: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  emptyMatches: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  emptyMatchesGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: borderRadius.xl,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: spacing.md,
  },
  emptyMatchesTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyMatchesText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  discoverButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  discoverButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  discoverButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  matchesList: {
    gap: spacing.sm,
  },
  matchItem: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  matchItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: borderRadius.lg,
  },
  matchAvatarContainer: {
    position: 'relative',
  },
  matchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  matchInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  matchName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  statusBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusIcon: {
    fontSize: 10,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  matchArrow: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  settingsGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconBg: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingsIcon: {
    fontSize: 18,
  },
  settingsItemText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  settingsArrow: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.errorMuted,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  logoutButtonText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  appLogoGradient: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.glow(colors.primary),
  },
  appLogoText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  appName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
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
