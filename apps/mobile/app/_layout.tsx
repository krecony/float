import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '../src/providers/AuthProvider';
import { SupabaseProvider } from '../src/providers/SupabaseProvider';
import { colors } from '../src/theme';
import { requestNotificationPermissions } from '../src/utils/notifications';

export default function RootLayout() {
  useEffect(() => {
    void requestNotificationPermissions();
  }, []);

  return (
    <SupabaseProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AuthProvider>
    </SupabaseProvider>
  );
}
