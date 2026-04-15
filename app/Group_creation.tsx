// app/Group_creation.tsx
import { useGroupStore } from '@/src/store/groupStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

export default function GroupCreationScreen() {
  const { addGroup } = useGroupStore();
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>(['You']);
  const [isLoading, setIsLoading] = useState(false);

  const addMember = () => {
    if (!memberName.trim()) {
      Alert.alert('Error', 'Please enter member name');
      return;
    }
    setMembers([...members, memberName.trim()]);
    setMemberName('');
  };

  const removeMember = (index: number) => {
    if (index === 0) {
      Alert.alert('Cannot Remove', 'You cannot remove yourself');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const formatMembersString = () => {
    if (members.length <= 3) return members.join(', ');
    return `${members.slice(0, 3).join(', ')} +${members.length - 3}`;
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (members.length < 2) {
      Alert.alert('Error', 'Please add at least one more member');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newGroup = {
        id: uuidv4(),
        name: groupName.trim(),
        members: formatMembersString(),
        balance: 0,
        settled: false,
        progress: 0,
      };
      
      addGroup(newGroup);
      
      Alert.alert(
        'Success',
        `Group "${groupName}" created successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
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
            placeholder="e.g., Pokhara Trip"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.label}>Members</Text>
          {members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <Text style={styles.memberName}>{member}</Text>
              {index !== 0 && (
                <TouchableOpacity onPress={() => removeMember(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <View style={styles.addMemberRow}>
            <TextInput
              style={[styles.input, styles.memberInput]}
              placeholder="Add member name"
              value={memberName}
              onChangeText={setMemberName}
            />
            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (!groupName.trim() || members.length < 2) && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || members.length < 2 || isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create Group'}
          </Text>
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
    color: '#7C6FFF',
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
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    backgroundColor: '#7C6FFF',
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
    backgroundColor: '#7C6FFF',
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