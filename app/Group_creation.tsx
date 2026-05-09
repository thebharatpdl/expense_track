// app/Group_creation.tsx
import { createGroup } from '@/src/services/groupService';
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
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupCreationScreen() {
  const { user } = useAppSelector(state => state.auth);
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMember = () => {
    if (!memberName.trim()) {
      Alert.alert('Error', 'Please enter member name or email');
      return;
    }
    setMembers([...members, memberName.trim()]);
    setMemberName('');
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setIsLoading(true);
    
    try {
      const newGroup = await createGroup(
        groupName.trim(),
        user.uid,
        user.displayName || 'User',
        user.email || ''
      );
      
      Alert.alert(
        'Success',
        `Group "${groupName}" created successfully!\n\nInvite Code: ${newGroup.inviteCode}\n\nShare this code with friends to join.`,
        [
          { 
            text: 'View Group', 
            onPress: () => router.push({
              pathname: '/Group_expense',
              params: { groupId: newGroup.id }
            } as any)
          },
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
              <Text style={styles.headerTitle}>Create Group</Text>
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
                  <Text style={styles.iconEmoji}>👥</Text>
                </LinearGradient>
              </View>
              <Text style={styles.iconTitle}>New Group</Text>
              <Text style={styles.iconSubtitle}>Split expenses with friends & family</Text>
            </View>
          </LinearGradient>

          {/* Light Content Section */}
          <View style={styles.contentSection}>
            {/* Group Name Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📝</Text>
                <Text style={styles.cardTitle}>Group Details</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Group Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Pokhara Trip, Flatmates"
                  placeholderTextColor="#94A3B8"
                  value={groupName}
                  onChangeText={setGroupName}
                  selectionColor="#3B82F6"
                />
                <View style={styles.hintContainer}>
                  <Text style={styles.hintIcon}>💡</Text>
                  <Text style={styles.hint}>
                    You'll get an invite code to share with friends
                  </Text>
                </View>
              </View>
            </View>

            {/* Members Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>👤</Text>
                <Text style={styles.cardTitle}>Invite Members</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Add members now or share the invite code later
              </Text>
              
              {/* Member List */}
              {members.length > 0 && (
                <View style={styles.memberList}>
                  <Text style={styles.memberListTitle}>
                    Added Members ({members.length})
                  </Text>
                  {members.map((member, index) => (
                    <View key={index} style={styles.memberRow}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {member.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.memberName}>{member}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeMember(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add Member Input */}
              <View style={styles.addMemberRow}>
                <View style={styles.memberInputWrapper}>
                  <Text style={styles.memberInputIcon}>+</Text>
                  <TextInput
                    style={styles.memberInput}
                    placeholder="Enter name or email"
                    placeholderTextColor="#94A3B8"
                    value={memberName}
                    onChangeText={setMemberName}
                    onSubmitEditing={addMember}
                    returnKeyType="done"
                    selectionColor="#3B82F6"
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addMember}>
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, !groupName.trim() && styles.createButtonDisabled]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={groupName.trim() ? ['#3B82F6', '#1D4ED8'] : ['#CBD5E1', '#CBD5E1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {groupName.trim() ? 'Create Group' : 'Enter Group Name to Continue'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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

  // Cards
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
    marginBottom: 16,
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

  // Input Group
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
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
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  // Section Subtext
  sectionSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Member List
  memberList: {
    marginBottom: 16,
  },
  memberListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },

  // Add Member
  addMemberRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  memberInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 12,
  },
  memberInputIcon: {
    fontSize: 18,
    color: '#94A3B8',
    marginRight: 8,
    fontWeight: '300',
  },
  memberInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Create Button
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});