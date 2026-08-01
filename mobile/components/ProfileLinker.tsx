import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useAppStore } from '../lib/app-store';
import { UserCheck, UserPlus, AlertCircle } from 'lucide-react-native';

export default function ProfileLinker() {
  const { user, members, linkProfile, addMember, loading } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState(user.name || '');
  const [newRole, setNewRole] = useState('Member');
  const [newAge, setNewAge] = useState('');
  const [processing, setProcessing] = useState(false);

  const hasLinkedProfile = members.some((m) => m.uid === user.uid);
  const needsProfile = !loading && !!user.uid && members.length > 0 && !hasLinkedProfile;

  if (!needsProfile) return null;

  const availableMembers = members.filter((m) => !m.uid);

  const handleClaim = async (memberId: string) => {
    setProcessing(true);
    try {
      await linkProfile(memberId);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to claim profile: ' + e.message);
      setProcessing(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    setProcessing(true);
    try {
      await addMember({
        name: newName,
        role: newRole,
        age: newAge || 'Not specified',
        gender: 'Unspecified',
        healthNotes: [],
        knownAllergies: 'None known',
        accessLevel: 'Standard',
        uid: user.uid,
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to create profile: ' + e.message);
      setProcessing(false);
    }
  };

  return (
    <Modal visible={needsProfile} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <AlertCircle size={28} color="#0d9488" />
            <Text style={styles.title}>Welcome to the Household!</Text>
          </View>
          
          <Text style={styles.subtitle}>
            You've successfully joined, but we need to know who you are in this household. 
            Please select your profile from the existing family members, or create a new one.
          </Text>

          {!isCreating ? (
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Claim an existing profile:</Text>
              
              {availableMembers.length === 0 ? (
                <Text style={styles.emptyText}>No unclaimed profiles available.</Text>
              ) : (
                <ScrollView style={styles.memberList} contentContainerStyle={{ paddingBottom: 10 }}>
                  {availableMembers.map(member => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        {member.image ? (
                          <Image source={{ uri: member.image }} style={styles.avatar} />
                        ) : (
                          <View style={styles.avatarPlaceholder} />
                        )}
                        <View>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberRole}>{member.role} • Age {member.age}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.claimButton}
                        onPress={() => handleClaim(member.id)}
                        disabled={processing}
                      >
                        <UserCheck size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.claimButtonText}>It's me</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setIsCreating(true)}
                disabled={processing}
              >
                <UserPlus size={20} color="#475569" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Create a New Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>Create your profile</Text>
              
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your full name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Role in family</Text>
              <TextInput
                style={styles.input}
                value={newRole}
                onChangeText={setNewRole}
                placeholder="e.g. Host, Parent, Child"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Age (optional)</Text>
              <TextInput
                style={styles.input}
                value={newAge}
                onChangeText={setNewAge}
                placeholder="e.g. 45"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setIsCreating(false)}
                  disabled={processing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleCreate}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 20,
  },
  content: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memberList: {
    maxHeight: 240,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#cbd5e1',
  },
  memberName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  memberRole: {
    fontSize: 12,
    color: '#64748b',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
