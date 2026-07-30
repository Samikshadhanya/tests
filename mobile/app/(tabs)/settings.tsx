import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { useAppStore } from '../../lib/app-store';
import { ShieldCheck, Users, Trash2, LogOut, Link as LinkIcon, KeyRound, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { user, toggleElderMode, deleteHousehold, generateInviteCode, joinHousehold, signOut } = useAppStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  
  const requestNotificationPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Failed to get push token for push notification!');
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Native Notifications Enabled! 🔔",
          body: "You will now receive native lockscreen alerts from the MedHome App.",
        },
        trigger: { seconds: 2 },
      });
      Alert.alert("Success", "Notifications enabled. You will receive a test alert in 2 seconds.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setLoadingInvite(true);
      const code = await generateInviteCode();
      setInviteCode(code);
    } catch (err: any) {
      Alert.alert("Error", err.message || 'Failed to generate invite code.');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCodeInput.trim()) return;
    try {
      setLoadingJoin(true);
      await joinHousehold(joinCodeInput.trim());
      Alert.alert("Success", "Successfully joined household!");
      setJoinCodeInput('');
    } catch (err: any) {
      Alert.alert("Error", err.message || 'Failed to join household.');
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleDeleteHousehold = (hid: string) => {
    Alert.alert(
      'Delete Household',
      'Are you sure you want to delete this household? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(hid);
            try {
              await deleteHousehold(hid);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete household');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" subtitle="Account, household management & mode toggle" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Info Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <ShieldCheck size={20} color="#0f766e" />
            <Text style={styles.cardTitle}>Account Details</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.val}>{user.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.val}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Household:</Text>
            <Text style={styles.val}>{user.household}</Text>
          </View>
        </View>

        {/* Mode Toggle Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Interface Mode</Text>
          <Text style={styles.cardSub}>Switch between standard mode and large-font Elderly mode.</Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, !user.elderMode ? styles.modeActive : null]}
              onPress={() => toggleElderMode(false)}
            >
              <Text style={[styles.modeText, !user.elderMode ? styles.modeTextActive : null]}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, user.elderMode ? styles.modeActive : null]}
              onPress={() => toggleElderMode(true)}
            >
              <Text style={[styles.modeText, user.elderMode ? styles.modeTextActive : null]}>Elderly Mode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Push Notifications Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Bell size={20} color="#64748b" />
            <Text style={styles.cardTitle}>Push Notifications</Text>
          </View>
          <Text style={styles.cardSub}>Enable lockscreen alerts for pills and missed doses.</Text>
          <TouchableOpacity style={styles.primaryOutlineBtn} onPress={requestNotificationPermission}>
            <Text style={styles.primaryOutlineText}>Enable Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Household Management */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Users size={20} color="#0f766e" />
            <Text style={styles.cardTitle}>Household Management</Text>
          </View>
          
          <Text style={styles.sectionHeading}>Invite Family Members</Text>
          <Text style={styles.cardSub}>Generate an invite code to allow other users to join your current household.</Text>
          
          {inviteCode ? (
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeLabel}>Your Invite Code:</Text>
              <Text style={styles.inviteCodeText}>{inviteCode}</Text>
              <Text style={styles.inviteCodeDesc}>Share this code with your family members.</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerateInvite} disabled={loadingInvite}>
              <LinkIcon size={16} color="#ffffff" />
              <Text style={styles.primaryBtnText}>{loadingInvite ? 'Generating...' : 'Generate Invite Code'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>Join a Household</Text>
          <View style={styles.joinRow}>
            <View style={styles.joinInputBox}>
              <KeyRound size={16} color="#94a3b8" style={styles.joinIcon} />
              <TextInput
                style={styles.joinInput}
                placeholder="Enter 6-digit invite code"
                value={joinCodeInput}
                onChangeText={(text) => setJoinCodeInput(text.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoinHousehold} disabled={loadingJoin}>
              <Text style={styles.joinBtnText}>{loadingJoin ? '...' : 'Join'}</Text>
            </TouchableOpacity>
          </View>

          {user.householdIds && user.householdIds.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.cardTitleRow}>
                <Trash2 size={18} color="#ef4444" />
                <Text style={styles.sectionHeading}>Delete a Household</Text>
              </View>
              <Text style={styles.cardSub}>Only the owner can delete a household. This action cannot be undone.</Text>

              {user.householdIds.map((hid, index) => {
                const name = user.households?.[index] || hid;
                return (
                  <View key={hid} style={styles.hhRow}>
                    <Text style={styles.hhName}>{name}</Text>
                    <TouchableOpacity
                      style={styles.deleteHhBtn}
                      onPress={() => handleDeleteHousehold(hid)}
                      disabled={deletingId === hid}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text style={styles.deleteHhText}>{deletingId === hid ? 'Deleting...' : 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  label: {
    fontSize: 13,
    color: '#64748b',
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeActive: {
    backgroundColor: '#0f766e',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  hhRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  hhName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  deleteHhBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteHhText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  primaryOutlineBtn: {
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryOutlineText: {
    color: '#0f766e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 4,
  },
  inviteCodeBox: {
    backgroundColor: '#f0fdfa',
    borderColor: '#ccfbf1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#115e59',
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
    letterSpacing: 4,
    marginVertical: 4,
  },
  inviteCodeDesc: {
    fontSize: 11,
    color: '#0d9488',
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  joinInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  joinIcon: {
    marginRight: 8,
  },
  joinInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  joinBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});
