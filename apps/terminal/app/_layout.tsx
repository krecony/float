import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initNfc } from '../src/services/nfc';
import { SupabaseProvider } from '../src/providers/SupabaseProvider';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    initNfc().then((supported) => {
      if (!supported) {
        console.warn('[NFC] Not supported on this device');
      }
    });
  }, []);

  return (
    <SupabaseProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'fade',
        }}
      />
    </SupabaseProvider>
  );
}
