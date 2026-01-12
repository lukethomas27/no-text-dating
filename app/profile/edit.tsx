import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useAppStore } from '../../src/store';
import { PhotoStorageService } from '../../src/services';
import { colors, spacing, borderRadius, typography } from '../../src/constants/theme';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(18, 'Must be 18+').max(120),
  bio: z.string().optional(),
  prompt1: z.string().max(150),
  prompt2: z.string().max(150),
  prompt3: z.string().max(150),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
  const { currentUser, updateProfile } = useAppStore();
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: currentUser?.name || '',
      age: currentUser?.age || 25,
      bio: currentUser?.bio || '',
      prompt1: currentUser?.prompts?.[0] || '',
      prompt2: currentUser?.prompts?.[1] || '',
      prompt3: currentUser?.prompts?.[2] || '',
    },
  });

  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Max Photos', 'You can only have up to 3 photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    const photoToRemove = photos[index];
    // Track removed storage photos for cleanup
    if (PhotoStorageService.isStorageUrl(photoToRemove)) {
      setRemovedPhotos([...removedPhotos, photoToRemove]);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Check if a URI is a local file (needs upload) vs already a URL
  const isLocalFile = (uri: string): boolean => {
    return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      // Upload any new local photos to Supabase Storage
      const uploadedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (isLocalFile(photo)) {
          setUploadingIndex(i);
          const url = await PhotoStorageService.uploadPhoto(photo);
          uploadedPhotos.push(url);
        } else {
          uploadedPhotos.push(photo);
        }
      }
      setUploadingIndex(null);

      // Delete removed photos from storage
      for (const photoUrl of removedPhotos) {
        try {
          await PhotoStorageService.deletePhoto(photoUrl);
        } catch (err) {
          console.warn('Failed to delete photo:', err);
          // Continue anyway - photo cleanup is best effort
        }
      }

      await updateProfile({
        name: data.name,
        age: data.age,
        bio: data.bio,
        prompts: [data.prompt1, data.prompt2, data.prompt3],
        photos: uploadedPhotos,
      });
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
      setUploadingIndex(null);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Photos Section */}
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              {uploadingIndex === index && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              {isLocalFile(photo) && uploadingIndex !== index && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>New</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
                disabled={isSaving}
              >
                <Text style={styles.removePhotoText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 3 && (
            <TouchableOpacity 
              style={[styles.addPhotoButton, isSaving && styles.addPhotoButtonDisabled]} 
              onPress={pickImage}
              disabled={isSaving}
            >
              <Text style={styles.addPhotoIcon}>+</Text>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        
        <Text style={styles.label}>Name</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Text style={styles.label}>Age</Text>
        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value?.toString()}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              placeholder="Your age"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          )}
        />
        {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}

        <Text style={styles.label}>Bio (optional)</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="Tell others about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          )}
        />

        {/* Prompts */}
        <Text style={styles.sectionTitle}>Your Prompts</Text>
        <Text style={styles.sectionSubtitle}>
          Share what makes you interesting!
        </Text>

        <Text style={styles.label}>Prompt 1</Text>
        <Controller
          control={control}
          name="prompt1"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="I'm happiest when..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={150}
            />
          )}
        />

        <Text style={styles.label}>Prompt 2</Text>
        <Controller
          control={control}
          name="prompt2"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="My ideal first date..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={150}
            />
          )}
        />

        <Text style={styles.label}>Prompt 3</Text>
        <Controller
          control={control}
          name="prompt3"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="Looking for someone who..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={150}
            />
          )}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: 100,
    height: 130,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  addPhotoButton: {
    width: 100,
    height: 130,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: colors.textSecondary,
  },
  addPhotoText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  uploadingText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pendingBadgeText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
