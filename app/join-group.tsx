// app/join-group.tsx
import { joinGroup } from '@/src/services/groupService';
import { useAppSelector } from '@/src/store/hooks';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function JoinGroupScreen() {
  const { user } = useAppSelector(state => state.auth);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    setIsLoading(true);
    try {
      const group = await joinGroup(
        inviteCode.trim().toUpperCase(),
        user.uid,
        user.displayName || 'User',
        user.email || ''
      );
      Alert.alert(
        'Success! 🎉',
        `You joined "${group?.name}"!`,
        [
          {
            text: 'View Group',
            onPress: () => router.push({
              pathname: '/Group_expense',
              params: { groupId: group?.id },
            } as any),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterPills = () => {
    const pills = [];
    for (let i = 0; i < 6; i++) {
      const char = inviteCode[i] || '';
      const isActive = i === inviteCode.length;
      pills.push(
        <View
          key={i}
          style={[
            styles.pill,
            char ? styles.pillFilled : null,
            isActive && isFocused ? styles.pillActive : null,
          ]}
        >
          <Text style={[styles.pillText, char ? styles.pillTextFilled : null]}>
            {char || ''}
          </Text>
        </View>
      );
    }
    return pills;
  };

  const isReady = inviteCode.trim().length === 6;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
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
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Join Group</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconEmoji}>🔗</Text>
                </LinearGradient>
              </View>
              <Text style={styles.iconTitle}>Join Group</Text>
              <Text style={styles.iconSubtitle}>Enter invite code to split expenses</Text>
            </View>
          </LinearGradient>

          {/* Light Content Section */}
          <View style={styles.contentSection}>
            {/* Code Input Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎫</Text>
                <Text style={styles.cardTitle}>Invite Code</Text>
              </View>
              
              <Text style={styles.cardSubtitle}>
                Ask a group member to share their 6-character code
              </Text>

              <Text style={styles.inputLabel}>Enter Code</Text>
              <View style={[styles.codeInputWrap, isFocused && styles.codeInputWrapFocused]}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="ABC123"
                  placeholderTextColor="#94A3B8"
                  value={inviteCode}
                  onChangeText={(t) => setInviteCode(t.toUpperCase().slice(0, 6))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoCapitalize="characters"
                  maxLength={6}
                  textAlign="center"
                  selectionColor="#3B82F6"
                />
              </View>

              {/* Character Pills */}
             

              <View style={styles.hintContainer}>
                <Text style={styles.hintIcon}>💡</Text>
                <Text style={styles.hint}>
                  Codes are case-insensitive · Ask your friend for the code
                </Text>
              </View>
            </View>

            {/* Join Button */}
            <TouchableOpacity
              style={[styles.joinButton, !isReady && styles.joinButtonDisabled]}
              onPress={handleJoinGroup}
              disabled={!isReady || isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isReady ? ['#3B82F6', '#1D4ED8'] : ['#CBD5E1', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[
                    styles.joinButtonText,
                    !isReady && styles.joinButtonTextDisabled
                  ]}>
                    {isReady ? 'Join Group' : `Enter ${6 - inviteCode.length} more character${6 - inviteCode.length !== 1 ? 's' : ''}`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Where to find the code?</Text>
                <Text style={styles.infoText}>
                  The group creator can find the invite code in their group settings. 
                  Ask them to share it with you!
                </Text>
              </View>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F4FF',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  iconContainer: {
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
  iconTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0F4FF',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  iconSubtitle: {
    fontSize: 13,
    color: '#8BA3C7',
    letterSpacing: 0.3,
  },

  // Light Content Section
  contentSection: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    marginTop: -16,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Input
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  codeInputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  codeInputWrapFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  codeInput: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 8,
    height: 60,
    textAlign: 'center',
  },

  // Character Pills
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  pillActive: {
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  pillText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  pillTextFilled: {
    color: '#2563EB',
  },

  // Hint
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  hintIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  hint: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // Join Button
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  joinButtonTextDisabled: {
    color: '#94A3B8',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});