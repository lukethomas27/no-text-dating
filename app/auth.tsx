import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Animated,
  Dimensions,
  InputAccessoryView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { colors, spacing, borderRadius, typography, shadows } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

type AuthStep = 'phone' | 'otp' | 'profile';

export default function AuthScreen() {
  const { sendOtp, verifyOtp, completeProfile } = useAppStore();

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Progress animation based on step
    const progress = step === 'phone' ? 0 : step === 'otp' ? 0.5 : 1;
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();

    // Animate content change
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Handle Android back button - prevent GO_BACK error on auth screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If on OTP step, go back to phone step
      if (step === 'otp') {
        handleBack();
        return true;
      }
      // On phone step, minimize app instead of crashing
      return false;
    });

    return () => backHandler.remove();
  }, [step]);

  // Input accessory view ID for keyboard toolbar
  const inputAccessoryViewID = 'auth-keyboard-toolbar';

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const getFullPhoneNumber = () => `+1${phone}`;

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      await sendOtp(getFullPhoneNumber());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('otp');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send verification code';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      const result = await verifyOtp(getFullPhoneNumber(), otp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.needsProfile) {
        setStep('profile');
      } else {
        router.replace('/discovery');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim() || !age.trim()) {
      setError('Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setError('Please enter a valid age (18+)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      await completeProfile(name.trim(), ageNum);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/profile/edit');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderPhoneStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.stepTitle}>What's your number?</Text>
      <Text style={styles.stepSubtitle}>
        We'll text you a code to verify it's really you
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.phoneInputWrapper}>
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
          inputAccessoryViewID={inputAccessoryViewID}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradientPrimary as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.termsLink}>Terms</Text> and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Enter the code</Text>
      <Text style={styles.stepSubtitle}>
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
        inputAccessoryViewID={inputAccessoryViewID}
        autoFocus
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradientPrimary as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        <Text style={styles.resendText}>Didn't get the code? Resend</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.stepTitle}>Let's meet you</Text>
      <Text style={styles.stepSubtitle}>
        Tell us a little about yourself
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your first name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
          blurOnSubmit={false}
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your age</Text>
        <TextInput
          style={styles.textInput}
          placeholder="18+"
          placeholderTextColor={colors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          inputAccessoryViewID={inputAccessoryViewID}
          maxLength={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleCompleteProfile}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradientPrimary as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Get the appropriate button action based on current step
  const handleKeyboardAction = useCallback(() => {
    Keyboard.dismiss();
    if (step === 'phone') {
      handleSendOtp();
    } else if (step === 'otp') {
      handleVerifyOtp();
    } else if (step === 'profile') {
      handleCompleteProfile();
    }
  }, [step, handleSendOtp, handleVerifyOtp, handleCompleteProfile]);

  const getKeyboardButtonText = () => {
    if (step === 'phone') return 'Continue';
    if (step === 'otp') return 'Verify';
    return 'Continue';
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Keyboard accessory toolbar for iOS number-pad */}
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <View style={styles.keyboardToolbar}>
              <TouchableOpacity 
                style={styles.keyboardDismissButton}
                onPress={Keyboard.dismiss}
              >
                <Text style={styles.keyboardDismissText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.keyboardActionButton}
                onPress={handleKeyboardAction}
                disabled={isLoading}
              >
                <Text style={styles.keyboardActionText}>{getKeyboardButtonText()}</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
        {/* Background gradient */}
        <LinearGradient
          colors={[colors.background, colors.backgroundElevated, colors.background]}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative gradient orbs */}
        <View style={styles.orbContainer}>
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.15)', 'transparent']}
            style={[styles.orb, styles.orbTopRight]}
          />
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
            style={[styles.orb, styles.orbBottomLeft]}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header with logo */}
          <Animated.View
            style={[
              styles.header,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.gradientPrimary as [string, string, string]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoIcon}>💬</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>No Text Dating</Text>
            <Text style={styles.tagline}>Skip the chat. Start talking.</Text>
          </Animated.View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
            </View>
            <View style={styles.progressDots}>
              <View style={[styles.dot, step !== 'phone' && styles.dotInactive]} />
              <View style={[styles.dot, step === 'phone' && styles.dotInactive]} />
              <View style={[styles.dot, step !== 'profile' && styles.dotInactive]} />
            </View>
          </View>

          {/* Step content */}
          <View style={styles.content}>
            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'profile' && renderProfileStep()}
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  orbTopRight: {
    top: -100,
    right: -100,
  },
  orbBottomLeft: {
    bottom: -150,
    left: -150,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.tight,
  },
  tagline: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.surfaceLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: colors.errorMuted,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.errorLight,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  countryCode: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  countryCodeText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.xl,
    color: colors.text,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    fontSize: typography.sizes.hero,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    fontWeight: typography.weights.semibold,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.sizes.lg,
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
  termsLink: {
    color: colors.primary,
  },
  backButton: {
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  resendText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  keyboardDismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keyboardDismissText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  keyboardActionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  keyboardActionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
