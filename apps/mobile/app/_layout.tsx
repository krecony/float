import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/providers/AuthProvider';
import { SupabaseProvider } from '../src/providers/SupabaseProvider';
import { colors } from '../src/theme';

export default function RootLayout() {
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
