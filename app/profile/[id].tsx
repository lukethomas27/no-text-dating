import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ProfilesService } from '../../src/services';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = ProfilesService.getProfile(id);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Photo Gallery */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.photoGallery}
      >
        {profile.photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.photo}
          />
        ))}
        {profile.photos.length === 0 && (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>No photos</Text>
          </View>
        )}
      </ScrollView>

      {/* Photo indicators */}
      {profile.photos.length > 1 && (
        <View style={styles.photoIndicators}>
          {profile.photos.map((_, index) => (
            <View key={index} style={styles.indicator} />
          ))}
        </View>
      )}

      {/* Profile Info */}
      <View style={styles.content}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Prompts */}
        <View style={styles.promptsContainer}>
          {profile.prompts.map((prompt, index) => (
            prompt ? (
              <View key={index} style={styles.promptCard}>
                <Text style={styles.promptLabel}>Prompt {index + 1}</Text>
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ) : null
          ))}
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to Discovery</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoGallery: {
    height: width * 1.2,
  },
  photo: {
    width: width,
    height: width * 1.2,
    resizeMode: 'cover',
  },
  noPhoto: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.xl,
    marginBottom: spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.text,
    opacity: 0.6,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  promptsContainer: {
    gap: spacing.md,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  promptLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  backButton: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
