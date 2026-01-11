import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

export default function DiscoveryScreen() {
  const {
    candidates,
    currentCandidateIndex,
    likeCurrentCandidate,
    passCurrentCandidate,
    matches,
    currentUser,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const candidate = candidates[currentCandidateIndex];

  const handleLike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const result = await likeCurrentCandidate();
    
    if (result.isMatch && result.matchId) {
      router.push(`/match/${result.matchId}`);
    }
    
    setIsProcessing(false);
  };

  const handlePass = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await passCurrentCandidate();
    setIsProcessing(false);
  };

  const handleViewProfile = () => {
    if (candidate) {
      router.push(`/profile/${candidate.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile/edit')}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {currentUser?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Discover</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.matchesBadge}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.matchesCount}>{matches.length}</Text>
            <Text style={styles.matchesLabel}>Matches</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card */}
      {candidate ? (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.95}
            onPress={handleViewProfile}
          >
            <Image
              source={{ uri: candidate.photos[0] || 'https://picsum.photos/400/600' }}
              style={styles.cardImage}
            />
            <View style={styles.cardGradient} />
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>
                {candidate.name}, {candidate.age}
              </Text>
              <Text style={styles.cardPrompt} numberOfLines={2}>
                {candidate.prompts[0]}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.passButton]}
              onPress={handlePass}
              disabled={isProcessing}
            >
              <Text style={styles.actionIcon}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={handleLike}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.actionIcon}>♥</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new people to meet!
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.refreshButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Matches Access */}
      {matches.length > 0 && (
        <TouchableOpacity
          style={styles.matchesBar}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.matchesBarText}>
            You have {matches.length} match{matches.length !== 1 ? 'es' : ''} waiting!
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  matchesBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  matchesCount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  matchesLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    // Using a pseudo-gradient effect
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardPrompt: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  passButton: {
    backgroundColor: colors.surface,
  },
  likeButton: {
    backgroundColor: colors.primary,
  },
  actionIcon: {
    fontSize: 30,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  refreshButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  matchesBar: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  matchesBarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
