import { withAndroidManifest, withDangerousMod, withGradleProperties } from '@expo/config-plugins';
import type { ExpoConfig } from 'expo/config';
import fs from 'fs';
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
  plugins: [
    'expo-router',
    'expo-dev-client',
    ['expo-notifications', { androidMode: 'default' }],
  ],
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
      projectId: '19c4189d-e8d0-4bd1-ac06-9334cb3ce410',
    },
  },
};

// In a Nix shell the Android SDK dir is immutable, so disable auto-SDK-install.
// On EAS (and other writable SDK environments) we leave that unset so CMake
// and other components can be downloaded normally.
let result = withGradleProperties(config, (c) => {
  if (process.env.IN_NIX_SHELL) {
    c.modResults.push({ type: 'property', key: 'android.builder.sdkDownload', value: 'false' });
  }
  return c;
});

// Add NFC permission and HCE service declaration for react-native-hce.
// These modifications mirror what is already in the committed AndroidManifest.xml,
// ensuring clean EAS prebuilds also include them.
result = withAndroidManifest(result, (c) => {
  const manifest = c.modResults.manifest;

  const existingPerms: string[] = (manifest['uses-permission'] ?? []).map(
    (p: { $: { 'android:name': string } }) => p.$['android:name'],
  );
  if (!existingPerms.includes('android.permission.NFC')) {
    manifest['uses-permission'] = [
      ...(manifest['uses-permission'] ?? []),
      { $: { 'android:name': 'android.permission.NFC' } },
    ];
  }

  const existingFeatures: string[] = (manifest['uses-feature'] ?? []).map(
    (f: { $: { 'android:name': string } }) => f.$['android:name'],
  );
  if (!existingFeatures.includes('android.hardware.nfc.hce')) {
    manifest['uses-feature'] = [
      ...(manifest['uses-feature'] ?? []),
      { $: { 'android:name': 'android.hardware.nfc.hce', 'android:required': 'true' } },
    ];
  }

  const app = manifest.application?.[0];
  if (app) {
    const services: any[] = app.service ?? [];
    const hceExists = services.some(
      (s) => s.$?.['android:name'] === 'com.reactnativehce.services.CardService',
    );
    if (!hceExists) {
      app.service = [
        ...services,
        {
          $: {
            'android:name': 'com.reactnativehce.services.CardService',
            'android:exported': 'true',
            'android:enabled': 'false',
            'android:permission': 'android.permission.BIND_NFC_SERVICE',
          },
          'intent-filter': [
            {
              action: [{ $: { 'android:name': 'android.nfc.cardemulation.action.HOST_APDU_SERVICE' } }],
              category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
            },
          ],
          'meta-data': [
            {
              $: {
                'android:name': 'android.nfc.cardemulation.host_apdu_service',
                'android:resource': '@xml/aid_list',
              },
            },
          ],
        },
      ];
    }
  }

  return c;
});

// Write aid_list.xml into the android/app/src/main/res/xml directory during prebuild.
result = withDangerousMod(result, [
  'android',
  async (c) => {
    const xmlDir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.promises.mkdir(xmlDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(xmlDir, 'aid_list.xml'),
      `<host-apdu-service
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:description="@string/app_name"
  android:requireDeviceUnlock="false">
  <aid-group
    android:category="other"
    android:description="@string/app_name">
    <aid-filter android:name="D2760000850101"/>
  </aid-group>
</host-apdu-service>\n`,
    );
    return c;
  },
]);

export default result;
