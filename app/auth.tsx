import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';

type AuthStep = 'phone' | 'otp' | 'profile';

export default function AuthScreen() {
  const { sendOtp, verifyOtp, completeProfile } = useAppStore();

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneDisplay = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    // Store only digits
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const getFullPhoneNumber = () => {
    // Add US country code
    return `+1${phone}`;
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      console.log('Sending OTP to:', getFullPhoneNumber());
      const result = await sendOtp(getFullPhoneNumber());
      console.log('OTP sent successfully:', result);
      setIsNewUser(result.isNewUser);
      setStep('otp');
    } catch (err: any) {
      console.error('OTP send error:', err);
      const errorMessage = err?.message || err?.error_description || 'Failed to send verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      const result = await verifyOtp(getFullPhoneNumber(), otp);

      if (result.needsProfile) {
        setStep('profile');
      } else {
        router.replace('/discovery');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim() || !age.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setError('Please enter a valid age (18+)');
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      await completeProfile(name.trim(), ageNum);
      router.replace('/profile/edit');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    }
  };

  const renderPhoneStep = () => (
    <>
      <Text style={styles.sectionTitle}>Enter your phone number</Text>
      <Text style={styles.sectionSubtitle}>
        We'll send you a verification code
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+1</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="(555) 555-5555"
          placeholderTextColor={colors.textMuted}
          value={formatPhoneDisplay(phone)}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitButtonText}>Send Code</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </>
  );

  const renderOtpStep = () => (
    <>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Enter verification code</Text>
      <Text style={styles.sectionSubtitle}>
        Sent to {formatPhoneDisplay(phone)}
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.otpInput}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoFocus
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        <Text style={styles.resendButtonText}>Resend code</Text>
      </TouchableOpacity>
    </>
  );

  const renderProfileStep = () => (
    <>
      <Text style={styles.sectionTitle}>Create your profile</Text>
      <Text style={styles.sectionSubtitle}>
        Tell us a bit about yourself
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoFocus
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
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleCompleteProfile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>No Text Dating</Text>
            <Text style={styles.subtitle}>Skip the chat. Start talking.</Text>
          </View>

          <View style={styles.form}>
            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'profile' && renderProfileStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollContent: {
    flexGrow: 1,
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
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  countryCode: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text,
    letterSpacing: 1,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: typography.sizes.xxl,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  submitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  termsText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.secondary,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  resendButtonText: {
    fontSize: typography.sizes.md,
    color: colors.secondary,
    fontWeight: typography.weights.medium,
  },
});
