'use client';

import { useState } from 'react';
import { ChevronLeft, ShieldCheck, Users, Link as LinkIcon, KeyRound, Bell } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
// Replaced Switch with a custom segmented control

export default function SettingsPage() {
  const { user, generateInviteCode, joinHousehold, toggleElderMode } = useAppStore();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const requestNotificationPermission = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          permStatus = await LocalNotifications.requestPermissions();
        }
        if (permStatus.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: 'Native Notifications Enabled!',
                body: 'You will now receive native lockscreen alerts from the MedHome App.',
                id: 1,
                schedule: { at: new Date(Date.now() + 1000 * 2) }, // 2 seconds from now
              }
            ]
          });
        } else {
          alert('Native notification permission denied.');
        }
      } else {
        if (!('Notification' in window)) {
          alert('This browser does not support desktop notifications.');
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Web Notifications Enabled!', {
            body: 'You will now receive alerts for reminders and missed pills on your lockscreen (when installed).',
            icon: '/icon-192x192.png'
          });
        } else {
          alert('Notification permission was denied.');
        }
      }
    } catch (e: any) {
      alert('Error scheduling notification: ' + e.message);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setLoadingInvite(true);
      const code = await generateInviteCode();
      setInviteCode(code);
    } catch (err: any) {
      alert(err.message || 'Failed to generate invite code.');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      setLoadingJoin(true);
      setJoinError('');
      setJoinSuccess('');
      await joinHousehold(joinCodeInput.trim());
      setJoinSuccess('Successfully joined household!');
      setJoinCodeInput('');
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join household.');
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <>
      <div className="page-panel space-y-5 p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">Settings</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">Manage account, households, and login providers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Account
            </h2>
            <div className="space-y-3 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
              <Row label="Login provider" value={user.authProvider} />
              <Row label="Active Household" value={user.household} />
            </div>

            <hr className="border-slate-100 mt-4 mb-4" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">App Interface Mode</h3>
                <p className="text-xs text-slate-500">Switch between the full app or a simplified view.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => toggleElderMode(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!user.elderMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => toggleElderMode(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${user.elderMode ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Elderly
                </button>
              </div>
            </div>

            <hr className="border-slate-100 mt-4 mb-4" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  Push Notifications
                </h3>
                <p className="text-xs text-slate-500">Enable lockscreen alerts for pills and missed doses.</p>
              </div>
              <Button onClick={requestNotificationPermission} variant="outline" size="sm">
                Enable Notifications
              </Button>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-6">
            <div>
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-teal-600" />
                Household Management
              </h2>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Invite Family Members</h3>
                <p className="text-sm text-slate-600">Generate an invite code to allow other users to join your current household.</p>
                {inviteCode ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-teal-800 mb-1">Your Invite Code:</p>
                    <p className="text-2xl font-bold tracking-widest text-teal-700">{inviteCode}</p>
                    <p className="text-xs text-teal-600 mt-2">Share this code with your family members.</p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleGenerateInvite} 
                    disabled={loadingInvite}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {loadingInvite ? 'Generating...' : 'Generate Invite Code'}
                  </Button>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Join a Household</h3>
              <form onSubmit={handleJoinHousehold} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit invite code"
                      className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 uppercase"
                    />
                  </div>
                  <Button type="submit" disabled={loadingJoin} className="bg-teal-600 hover:bg-teal-700 h-11">
                    {loadingJoin ? 'Joining...' : 'Join'}
                  </Button>
                </div>
                {joinError && <p className="text-sm font-medium text-red-600">{joinError}</p>}
                {joinSuccess && <p className="text-sm font-medium text-green-700">{joinSuccess}</p>}
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:flex-row sm:justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 capitalize">{value}</span>
    </div>
  );
}
