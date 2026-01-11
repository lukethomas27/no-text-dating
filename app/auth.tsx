import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { ProfilesService } from '../src/services';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';

export default function AuthScreen() {
  const { loginAs, createAndLogin } = useAppStore();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const demoProfiles = ProfilesService.getAllProfiles();

  const handleSelectUser = async (userId: string) => {
    await loginAs(userId);
    router.replace('/discovery');
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !age.trim()) return;
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) return;
    
    await createAndLogin(name.trim(), ageNum);
    router.replace('/profile/edit');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>No Text Dating</Text>
        <Text style={styles.subtitle}>Skip the chat. Start talking.</Text>
      </View>

      {mode === 'select' ? (
        <>
          <Text style={styles.sectionTitle}>Choose a Demo Profile</Text>
          <ScrollView style={styles.profileList} showsVerticalScrollIndicator={false}>
            {demoProfiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.profileItem}
                onPress={() => handleSelectUser(profile.id)}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.avatarText}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                  <Text style={styles.profileBio} numberOfLines={1}>
                    {profile.bio || profile.prompts[0]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setMode('create')}
          >
            <Text style={styles.switchButtonText}>Or create your own profile</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.createForm}>
          <Text style={styles.sectionTitle}>Create Your Profile</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Your age (18+)"
            placeholderTextColor={colors.textMuted}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
          />
          
          <TouchableOpacity
            style={[
              styles.createButton,
              (!name.trim() || !age.trim()) && styles.createButtonDisabled,
            ]}
            onPress={handleCreateUser}
            disabled={!name.trim() || !age.trim()}
          >
            <Text style={styles.createButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setMode('select')}
          >
            <Text style={styles.switchButtonText}>Back to demo profiles</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileList: {
    flex: 1,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  profileBio: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  switchButtonText: {
    fontSize: typography.sizes.md,
    color: colors.secondary,
    fontWeight: typography.weights.medium,
  },
  createForm: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
