import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SupabaseProvider } from '../src/providers/SupabaseProvider';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </SupabaseProvider>
  );
}
