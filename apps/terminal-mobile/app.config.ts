import { withAndroidManifest } from '@expo/config-plugins';
import type { ExpoConfig } from 'expo/config';
import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '../../.env') });

const config: ExpoConfig = {
  name: 'Float Terminal',
  slug: 'grouppay-terminal',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'grouppay-terminal',
  userInterfaceStyle: 'dark',
  updates: { enabled: false, fallbackToCacheTimeout: 0 },
  android: {
    package: 'com.grouppay.terminal',
    predictiveBackGestureEnabled: false,
  },
  plugins: ['expo-router', 'expo-dev-client'],
  experiments: { typedRoutes: true },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: { origin: false },
  },
};

// Add NFC read permission to the Android manifest so react-native-nfc-manager
// can register foreground dispatch for NDEF tag reading.
export default withAndroidManifest(config, (c) => {
  const manifest = c.modResults.manifest;

  const permissions: string[] = (manifest['uses-permission'] ?? []).map(
    (p: { $: { 'android:name': string } }) => p.$['android:name'],
  );

  if (!permissions.includes('android.permission.NFC')) {
    manifest['uses-permission'] = [
      ...(manifest['uses-permission'] ?? []),
      { $: { 'android:name': 'android.permission.NFC' } },
    ];
  }

  if (!(manifest['uses-feature'] ?? []).find(
    (f: { $: { 'android:name': string } }) => f.$['android:name'] === 'android.hardware.nfc'
  )) {
    manifest['uses-feature'] = [
      ...(manifest['uses-feature'] ?? []),
      {
        $: {
          'android:name': 'android.hardware.nfc',
          'android:required': 'true',
        },
      },
    ];
  }

  return c;
});
