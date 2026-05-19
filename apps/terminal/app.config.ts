import type { ExpoConfig } from 'expo/config';
import path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '../../.env') });

const config: ExpoConfig = {
  name: 'GroupPay Terminal',
  slug: 'grouppay-terminal',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'grouppay-terminal',
  userInterfaceStyle: 'dark',
  updates: {
    enabled: false,
    fallbackToCacheTimeout: 0,
  },
  android: {
    package: 'com.grouppay.terminal',
    permissions: ['android.permission.NFC', 'android.permission.VIBRATE'],
    adaptiveIcon: {
      backgroundColor: '#0a0a0f',
    },
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: {
      origin: false,
    },
    eas: {
      projectId: '28cc1c5d-1b51-4099-8e69-aca10e8b74dd',
    },
  },
};

export default config;
