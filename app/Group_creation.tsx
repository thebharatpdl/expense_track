// app/Group_creation.tsx
import { createGroup } from '@/src/services/groupService';
import { useAuthStore } from '@/src/store/authStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GroupCreationScreen() {
  const { user } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]); // Store emails or names for now
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
      
      // Show invite code to share
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Group</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Pokhara Trip, Flatmates"
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
          />
          <Text style={styles.hint}>
            You'll get an invite code to share with friends
          </Text>
        </View>

        {/* Members (Optional - for invite list) */}
        <View style={styles.section}>
          <Text style={styles.label}>Invite Members (Optional)</Text>
          <Text style={styles.sectionSubLabel}>
            Add emails or names - they'll need the invite code to join
          </Text>
          
          {members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <Text style={styles.memberName}>{member}</Text>
              <TouchableOpacity onPress={() => removeMember(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addMemberRow}>
            <TextInput
              style={[styles.input, styles.memberInput]}
              placeholder="Enter name or email"
              placeholderTextColor="#999"
              value={memberName}
              onChangeText={setMemberName}
              onSubmitEditing={addMember}
            />
            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, !groupName.trim() && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 16,
    color: '#1D9E75',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  memberName: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  removeButton: {
    color: '#FF3B30',
    fontSize: 12,
  },
  addMemberRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  memberInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    margin: 16,
    backgroundColor: '#1D9E75',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C6C6C8',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});