// app/verify-email.tsx
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { checkEmailVerification, logout, resendVerificationEmail } from '@/src/store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check verification status when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkVerificationStatus();
      }
    });

    // Initial check
    checkVerificationStatus();

    return () => {
      subscription.remove();
    };
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setCheckingVerification(true);
      await dispatch(checkEmailVerification()).unwrap();
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      await dispatch(resendVerificationEmail()).unwrap();
      Alert.alert(
        'Email Sent',
        'Verification email has been resent. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
              <Text style={styles.iconEmoji}>✉️</Text>
            </LinearGradient>
          </View>
          <Text style={styles.appName}>ExpenseTracker</Text>
        </View>
      </LinearGradient>

      {/* Light Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification email to
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>

          <View style={styles.instructionsContainer}>
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Check your email inbox and click the verification link
              </Text>
            </View>
            
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                If you don't see it, check your spam/junk folder
              </Text>
            </View>
            
            <View style={styles.instructionStep}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Come back here after verifying - we'll automatically detect it
              </Text>
            </View>
          </View>

          {/* Check Status Button */}
          <TouchableOpacity
            style={styles.checkButton}
            onPress={checkVerificationStatus}
            disabled={checkingVerification}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {checkingVerification ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>I've Verified My Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Email Button */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={resendingEmail}
          >
            {resendingEmail ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <Text style={styles.resendText}>Resend Verification Email</Text>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Didn't receive the email? Make sure to check your spam folder or try resending.
          {'\n'}Still having issues? Contact support.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1923',
  },
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  checkButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  resendText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 16,
    lineHeight: 18,
  },
});