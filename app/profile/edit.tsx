import { useState, useRef } from 'react';
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
  Modal,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../../src/store';
import { PhotoStorageService } from '../../src/services';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/constants/theme';
import type { Gender, Sexuality, ShowMePreference } from '../../src/types';
import { calculateAge } from '../../src/types';

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'man', label: 'Man', emoji: '👨' },
  { value: 'woman', label: 'Woman', emoji: '👩' },
  { value: 'non_binary', label: 'Non-binary', emoji: '🧑' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const SEXUALITY_OPTIONS: { value: Sexuality; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'gay', label: 'Gay' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'queer', label: 'Queer' },
  { value: 'asexual', label: 'Asexual' },
  { value: 'other', label: 'Other' },
];

const SHOW_ME_OPTIONS: { value: ShowMePreference; label: string; emoji: string }[] = [
  { value: 'men', label: 'Men', emoji: '👨' },
  { value: 'women', label: 'Women', emoji: '👩' },
  { value: 'everyone', label: 'Everyone', emoji: '💫' },
];

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  birthday: z.string().min(1, 'Birthday is required'),
  gender: z.enum(['man', 'woman', 'non_binary', 'other']),
  sexuality: z.enum(['straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'queer', 'asexual', 'other']),
  showMe: z.enum(['men', 'women', 'everyone']),
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  // Default birthday is 25 years ago
  const defaultBirthday = new Date();
  defaultBirthday.setFullYear(defaultBirthday.getFullYear() - 25);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileForm>({
    defaultValues: {
      name: currentUser?.name || '',
      birthday: currentUser?.birthday || defaultBirthday.toISOString().split('T')[0],
      gender: currentUser?.gender || 'other',
      sexuality: currentUser?.sexuality || 'other',
      showMe: currentUser?.showMe || 'everyone',
      bio: currentUser?.bio || '',
      prompt1: currentUser?.prompts?.[0] || '',
      prompt2: currentUser?.prompts?.[1] || '',
      prompt3: currentUser?.prompts?.[2] || '',
    },
  });

  const watchedBirthday = watch('birthday');

  const pickImage = async () => {
    if (photos.length >= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Max Photos', 'You can only have up to 3 photos');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photoToRemove = photos[index];
    if (PhotoStorageService.isStorageUrl(photoToRemove)) {
      setRemovedPhotos([...removedPhotos, photoToRemove]);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const isLocalFile = (uri: string): boolean => {
    return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
  };

  const handleSavePress = () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(saveButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const onSubmit = async (data: ProfileForm) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
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

      for (const photoUrl of removedPhotos) {
        try {
          await PhotoStorageService.deletePhoto(photoUrl);
        } catch (err) {
          console.warn('Failed to delete photo:', err);
        }
      }

      await updateProfile({
        name: data.name,
        birthday: data.birthday,
        gender: data.gender,
        sexuality: data.sexuality,
        showMe: data.showMe,
        bio: data.bio,
        prompts: [data.prompt1, data.prompt2, data.prompt3],
        photos: uploadedPhotos,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
      setUploadingIndex(null);
    }
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={colors.gradientPrimary as [string, string, ...string[]]}
        style={styles.sectionIconBg}
      >
        <Text style={styles.sectionIcon}>{icon}</Text>
      </LinearGradient>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Photos Section */}
          {renderSectionHeader('Photos', '📸')}
          <Text style={styles.sectionSubtitle}>Add up to 3 photos to show your best self</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.photoGradient}
                />
                {uploadingIndex === index && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
                {isLocalFile(photo) && uploadingIndex !== index && (
                  <View style={styles.pendingBadge}>
                    <LinearGradient
                      colors={colors.gradientSecondary as [string, string, ...string[]]}
                      style={styles.pendingBadgeGradient}
                    >
                      <Text style={styles.pendingBadgeText}>New</Text>
                    </LinearGradient>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[colors.error, colors.errorLight]}
                    style={styles.removePhotoGradient}
                  >
                    <Text style={styles.removePhotoText}>×</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.photoNumber}>
                  <Text style={styles.photoNumberText}>{index + 1}</Text>
                </View>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity
                style={[styles.addPhotoButton, isSaving && styles.addPhotoButtonDisabled]}
                onPress={pickImage}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[colors.surface, colors.surfaceLight]}
                  style={styles.addPhotoGradient}
                >
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Info */}
          {renderSectionHeader('Basic Info', '✨')}

          <Text style={styles.label}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

          <Text style={styles.label}>Birthday</Text>
          <Controller
            control={control}
            name="birthday"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.inputText}>
                    {value ? `${new Date(value).toLocaleDateString()} (${calculateAge(value)} years old)` : 'Select your birthday'}
                  </Text>
                  <Text style={styles.inputIcon}>📅</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <LinearGradient
                            colors={[colors.surface, colors.backgroundElevated]}
                            style={styles.modalGradient}
                          >
                            <View style={styles.modalHeader}>
                              <Text style={styles.modalTitle}>Select Birthday</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setShowDatePicker(false);
                                }}
                              >
                                <Text style={styles.modalDone}>Done</Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={value ? new Date(value) : new Date()}
                              mode="date"
                              display="spinner"
                              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                              minimumDate={new Date(1900, 0, 1)}
                              onChange={(_, date) => {
                                if (date) onChange(date.toISOString().split('T')[0]);
                              }}
                            />
                          </LinearGradient>
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={value ? new Date(value) : new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={(_, date) => {
                        setShowDatePicker(false);
                        if (date) onChange(date.toISOString().split('T')[0]);
                      }}
                    />
                  )
                )}
              </>
            )}
          />

          <Text style={styles.label}>I am a...</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsRow}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionButton, value === option.value && styles.optionButtonSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange(option.value);
                    }}
                  >
                    {value === option.value ? (
                      <LinearGradient
                        colors={colors.gradientPrimary as [string, string, ...string[]]}
                        style={styles.optionButtonGradient}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={styles.optionButtonTextSelected}>{option.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionButtonInner}>
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={styles.optionButtonText}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Text style={styles.label}>Sexual orientation</Text>
          <Controller
            control={control}
            name="sexuality"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {SEXUALITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionButtonWide, value === option.value && styles.optionButtonSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange(option.value);
                    }}
                  >
                    {value === option.value ? (
                      <LinearGradient
                        colors={colors.gradientSecondary as [string, string, ...string[]]}
                        style={styles.optionButtonGradient}
                      >
                        <Text style={styles.optionButtonTextSelected}>{option.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionButtonInner}>
                        <Text style={styles.optionButtonText}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Text style={styles.label}>Show me</Text>
          <Controller
            control={control}
            name="showMe"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsRow}>
                {SHOW_ME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionButton, value === option.value && styles.optionButtonSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange(option.value);
                    }}
                  >
                    {value === option.value ? (
                      <LinearGradient
                        colors={colors.gradientWarm as [string, string, ...string[]]}
                        style={styles.optionButtonGradient}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={styles.optionButtonTextSelected}>{option.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.optionButtonInner}>
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={styles.optionButtonText}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Text style={styles.label}>Bio (optional)</Text>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          />

          {/* Prompts */}
          {renderSectionHeader('Your Prompts', '💬')}
          <Text style={styles.sectionSubtitle}>Share what makes you interesting!</Text>

          {[
            { name: 'prompt1' as const, placeholder: "I'm happiest when...", number: 1 },
            { name: 'prompt2' as const, placeholder: 'My ideal first date...', number: 2 },
            { name: 'prompt3' as const, placeholder: 'Looking for someone who...', number: 3 },
          ].map((prompt) => (
            <View key={prompt.name}>
              <View style={styles.promptLabel}>
                <View style={styles.promptNumberBadge}>
                  <LinearGradient
                    colors={
                      prompt.number === 1
                        ? (colors.gradientPrimary as [string, string, ...string[]])
                        : prompt.number === 2
                        ? (colors.gradientSecondary as [string, string, ...string[]])
                        : (colors.gradientWarm as [string, string, ...string[]])
                    }
                    style={styles.promptNumberGradient}
                  >
                    <Text style={styles.promptNumberText}>{prompt.number}</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.label}>Prompt {prompt.number}</Text>
              </View>
              <Controller
                control={control}
                name={prompt.name}
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={value}
                      onChangeText={onChange}
                      placeholder={prompt.placeholder}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      maxLength={150}
                    />
                    <Text style={styles.charCount}>{value?.length || 0}/150</Text>
                  </View>
                )}
              />
            </View>
          ))}

          {/* Save Button */}
          <Animated.View style={[styles.saveButtonContainer, { transform: [{ scale: saveButtonScale }] }]}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={() => {
                handleSavePress();
                handleSubmit(onSubmit)();
              }}
              disabled={isSaving}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isSaving ? [colors.surfaceLight, colors.surface] : colors.gradientPrimary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Text style={styles.saveButtonIcon}>✓</Text>
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
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
    height: '30%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  removePhotoGradient: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  photoNumber: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassStroke,
  },
  photoNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  addPhotoButton: {
    width: 100,
    height: 130,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: colors.textMuted,
  },
  addPhotoText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  pendingBadgeGradient: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
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
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputText: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  textAreaContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  charCount: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  optionButtonWide: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    minWidth: 90,
  },
  optionButtonSelected: {
    borderColor: 'transparent',
  },
  optionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionEmoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  optionButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  optionButtonTextSelected: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  promptLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  promptNumberBadge: {
    marginRight: spacing.sm,
  },
  promptNumberGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  modalDone: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  saveButtonContainer: {
    marginTop: spacing.xl,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  saveButtonIcon: {
    fontSize: 18,
    color: colors.text,
    marginRight: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
