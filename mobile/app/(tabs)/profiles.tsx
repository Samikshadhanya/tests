import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { useAppStore } from '../../lib/app-store';
import { User, AlertCircle, Heart, Plus } from 'lucide-react-native';
import { AddProfileModal } from '../../components/AddProfileModal';

export default function ProfilesScreen() {
  const { members, user, linkProfile } = useAppStore();
  const [modalVisible, setModalVisible] = React.useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Family Profiles" subtitle="Manage members, access levels & health notes" />
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {members.map((member) => (
          <View key={member.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Image source={{ uri: member.image }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.roleText}>{member.role} • Age: {member.age}</Text>
              </View>
              <View style={[styles.badge, member.accessLevel === 'Elderly' ? styles.elderlyBadge : styles.leaderBadge]}>
                <Text style={[styles.badgeText, member.accessLevel === 'Elderly' ? styles.elderlyBadgeText : styles.leaderBadgeText]}>
                  {member.accessLevel || 'Standard'}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <AlertCircle size={14} color="#ef4444" />
                <Text style={styles.detailText}>Allergies: {member.knownAllergies || 'None known'}</Text>
              </View>
              {member.healthNotes && member.healthNotes.length > 0 ? (
                <View style={styles.detailItem}>
                  <Heart size={14} color="#0f766e" />
                  <Text style={styles.detailText}>Notes: {member.healthNotes.join(', ')}</Text>
                </View>
              ) : null}
            </View>

            {(!member.uid && user.linkedMemberId !== member.id) && (
              <TouchableOpacity 
                style={styles.linkBtn}
                onPress={() => linkProfile(member.id)}
              >
                <Text style={styles.linkBtnText}>Link to my Google Account</Text>
              </TouchableOpacity>
            )}
            {user.linkedMemberId === member.id && (
              <View style={styles.linkedBadge}>
                <Text style={styles.linkedBadgeText}>✓ This is you</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <AddProfileModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaderBadge: {
    backgroundColor: '#ccfbf1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  leaderBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  elderlyBadge: {
    backgroundColor: '#ffedd5',
  },
  elderlyBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#c2410c',
  },
  detailsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  linkBtn: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  linkedBadge: {
    marginTop: 12,
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  linkedBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
  },
});
