// app/register.tsx
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { register } from '@/src/store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const passwordStrength = (): { label: string; color: string; flex: number } => {
    if (password.length === 0) return { label: '', color: 'transparent', flex: 0 };
    if (password.length < 6) return { label: 'Too short', color: '#EF4444', flex: 0.25 };
    if (password.length < 8) return { label: 'Weak', color: '#F97316', flex: 0.5 };
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return { label: 'Strong', color: '#10B981', flex: 1 };
    return { label: 'Good', color: '#3B82F6', flex: 0.75 };
  };

  const strength = passwordStrength();

  const scrollToInput = (yPosition: number) => {
    scrollViewRef.current?.scrollTo({
      y: yPosition,
      animated: true,
    });
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      await dispatch(register({ email, password, name })).unwrap();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dark Header Section */}
          <LinearGradient
            colors={['#0F1923', '#1A2432']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerSection}
          >
            <View style={styles.logoContainer}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconEmoji}>📝</Text>
                </LinearGradient>
              </View>
              <Text style={styles.appName}>FinTrack</Text>
              <Text style={styles.appTagline}>Smart money management</Text>
            </View>
          </LinearGradient>

          {/* Light Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join thousands managing their finances</Text>

              <View style={styles.form}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      selectionColor="#3B82F6"
                      onFocus={() => scrollToInput(0)}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      ref={emailRef}
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      selectionColor="#3B82F6"
                      onFocus={() => scrollToInput(100)}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      ref={passwordRef}
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      selectionColor="#3B82F6"
                      onFocus={() => scrollToInput(250)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthTrack}>
                        <View style={[styles.strengthFill, { flex: strength.flex, backgroundColor: strength.color }]} />
                      </View>
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    confirmPassword.length > 0 && password !== confirmPassword && styles.inputError
                  ]}>
                    <Text style={styles.inputIcon}>🔐</Text>
                    <TextInput
                      ref={confirmPasswordRef}
                      style={styles.input}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirm}
                      returnKeyType="done"
                      selectionColor="#3B82F6"
                      onFocus={() => scrollToInput(400)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(!showConfirm)}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <Text style={styles.errorText}>Passwords don't match</Text>
                  )}
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                Already have an account?{' '}
                <Text style={styles.linkHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1923',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Dark Header Section
  headerSection: {
    paddingTop: 20,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 32,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F0F4FF',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    color: '#8BA3C7',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Light Content Section
  contentSection: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 28,
  },

  // Form
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 13,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'right',
  },

  // Error
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  },

  // Register Button
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Login Link
  linkButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#64748B',
  },
  linkHighlight: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Terms
  termsText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 16,
  },
  termsLink: {
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});