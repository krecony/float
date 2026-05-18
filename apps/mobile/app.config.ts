import type { ExpoConfig } from 'expo/config';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Monorepo: load Supabase keys from repo root .env
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const config: ExpoConfig = {
  name: 'GroupPay',
  slug: 'grouppay',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'grouppay',
  userInterfaceStyle: 'dark',
  updates: {
    enabled: false,
    fallbackToCacheTimeout: 0,
  },
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0f',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.grouppay.demo',
  },
  android: {
    package: 'com.grouppay.demo',
    adaptiveIcon: {
      backgroundColor: '#0a0a0f',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
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
  },
};

export default config;
