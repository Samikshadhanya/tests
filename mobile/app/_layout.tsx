import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppStore } from '../lib/app-store';
import * as Notifications from 'expo-notifications';
import ProfileLinker from '../components/ProfileLinker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login';
    const isAuthenticated = !!user.uid;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user.uid, segments, navigationState?.key]);

  return (
    <>
      {children}
      <ProfileLinker />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="ai-assistant" options={{ presentation: 'modal', title: 'AI Health Assistant' }} />
          </Stack>
        </AuthGuard>
      </AppProvider>
    </SafeAreaProvider>
  );
}
