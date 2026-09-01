import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quiztube.app',
  appName: 'QuizTube AI',
  webDir: 'out',
  server: {
    // If you want the APK to load your live hosted Vercel backend directly with real-time updates:
    url: 'https://quiztube.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
  },
};

export default config;
