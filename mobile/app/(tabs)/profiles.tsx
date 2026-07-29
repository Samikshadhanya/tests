import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { useAppStore } from '../../lib/app-store';
import { User, AlertCircle, Heart } from 'lucide-react-native';

export default function ProfilesScreen() {
  const { members } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Family Profiles" subtitle="Manage members, access levels & health notes" />

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
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
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
});
