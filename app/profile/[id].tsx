import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { ProfilesService } from '../../src/services';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import { UserProfile } from '../../src/types';

const { width, height } = Dimensions.get('window');
const PHOTO_HEIGHT = height * 0.55;

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      const data = await ProfilesService.getProfile(id);
      setProfile(data);
      setIsLoading(false);

      // Animate content in
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    };
    loadProfile();
  }, [id]);

  const handlePhotoScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== activePhotoIndex) {
      setActivePhotoIndex(newIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

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

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.errorIcon}>🔍</Text>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = profile.photos.filter(p => p);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Photo Gallery */}
        <View style={styles.photoGalleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePhotoScroll}
            style={styles.photoGallery}
          >
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    locations={[0.5, 0.7, 1]}
                    style={styles.photoGradient}
                  />
                </View>
              ))
            ) : (
              <View style={[styles.photoWrapper, styles.noPhoto]}>
                <LinearGradient
                  colors={[colors.surface, colors.surfaceLight]}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.noPhotoIcon}>📷</Text>
                <Text style={styles.noPhotoText}>No photos yet</Text>
              </View>
            )}
          </ScrollView>

          {/* Photo indicators */}
          {photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === activePhotoIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Name overlay on photo */}
          <View style={styles.nameOverlay}>
            <Text style={styles.name}>{profile.name}</Text>
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{profile.age}</Text>
            </View>
          </View>
        </View>

        {/* Profile Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          {/* Bio Section */}
          {profile.bio && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>✨</Text>
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            </View>
          )}

          {/* Prompts Section */}
          {profile.prompts.some(p => p) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💬</Text>
                <Text style={styles.sectionTitle}>Get to Know Them</Text>
              </View>
              <View style={styles.promptsContainer}>
                {profile.prompts.map((prompt, index) =>
                  prompt ? (
                    <View key={index} style={styles.promptCard}>
                      <LinearGradient
                        colors={colors.gradientCard as [string, string, ...string[]]}
                        style={styles.promptGradient}
                      >
                        <View style={styles.promptNumber}>
                          <LinearGradient
                            colors={
                              index === 0
                                ? (colors.gradientPrimary as [string, string, ...string[]])
                                : index === 1
                                ? (colors.gradientSecondary as [string, string, ...string[]])
                                : (colors.gradientWarm as [string, string, ...string[]])
                            }
                            style={styles.promptNumberGradient}
                          >
                            <Text style={styles.promptNumberText}>{index + 1}</Text>
                          </LinearGradient>
                        </View>
                        <Text style={styles.promptText}>"{prompt}"</Text>
                      </LinearGradient>
                    </View>
                  ) : null
                )}
              </View>
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.surface, colors.surfaceLight]}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonIcon}>←</Text>
              <Text style={styles.backButtonText}>Back to Discovery</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={{ height: spacing.xxl }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating back button */}
      <TouchableOpacity
        style={styles.floatingBackButton}
        onPress={handleBack}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
          style={styles.floatingBackGradient}
        >
          <Text style={styles.floatingBackIcon}>←</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  errorButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  photoGalleryContainer: {
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photoGallery: {
    flex: 1,
  },
  photoWrapper: {
    width: width,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  noPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoIcon: {
    fontSize: 50,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  noPhotoText: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  photoIndicators: {
    position: 'absolute',
    top: spacing.xl + 30, // Below status bar
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: colors.text,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ageBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.glassBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  ageText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  },
  bioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  bioText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  promptsContainer: {
    gap: spacing.md,
  },
  promptCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  promptGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptNumber: {
    marginRight: spacing.md,
  },
  promptNumberGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  promptText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  backButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backButtonIcon: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    marginRight: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  floatingBackButton: {
    position: 'absolute',
    top: spacing.xl + 30,
    left: spacing.lg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.md,
  },
  floatingBackGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBackIcon: {
    fontSize: 20,
    color: colors.text,
  },
});
