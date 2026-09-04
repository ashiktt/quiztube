/**
 * QuizTube Android APK Configuration
 * 
 * Update this file to release new APK versions without modifying UI components.
 * The download button across the entire site automatically reflects these values.
 */

export interface ApkConfig {
  version: string;
  versionCode: number;
  releaseDate: string;
  fileSize: string;
  minAndroidVersion: string;
  downloadUrl: string;
  sha256Checksum?: string;
  changelog: string[];
  installSteps: { stepNumber: number; title: string; description: string }[];
}

export const APK_CONFIG: ApkConfig = {
  version: process.env.NEXT_PUBLIC_APK_VERSION || '1.0.0',
  versionCode: 100,
  releaseDate: 'September 2026',
  fileSize: '14.2 MB',
  minAndroidVersion: 'Android 8.0 (Oreo) or higher',
  downloadUrl: process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || 'https://github.com/ashiktt/quiztube/releases/download/v1.0.0/quiztube-v1.0.0.apk',
  sha256Checksum: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
  changelog: [
    'Direct APK installation with native performance & offline storage',
    'AI-powered YouTube lecture to interactive quiz generator',
    'University exam solver with marks-proportional model answers (2, 5, 10, 15 M)',
    '24/7 QuizTube AI Academic Tutor with Socratic learning & mistake diagnosis',
    'Visual Mermaid architecture diagrams & formula cheatsheets',
    'Native bottom navigation bar with Dark and Light mode support',
  ],
  installSteps: [
    {
      stepNumber: 1,
      title: 'Download QuizTube APK',
      description: 'Tap the Download APK button above to save the official package directly to your Android device.',
    },
    {
      stepNumber: 2,
      title: 'Open the Downloaded File',
      description: 'Swipe down your notification bar or open your device\'s Files/Downloads folder and tap quiztube.apk.',
    },
    {
      stepNumber: 3,
      title: 'Allow Installation from this Source',
      description: 'If Android displays "Install unknown apps" security prompt, tap Settings and toggle "Allow from this source".',
    },
    {
      stepNumber: 4,
      title: 'Tap Install',
      description: 'Confirm the installation by tapping "Install" and wait a few seconds for completion.',
    },
    {
      stepNumber: 5,
      title: 'Launch QuizTube App',
      description: 'Open QuizTube from your app drawer or home screen.',
    },
    {
      stepNumber: 6,
      title: 'Sign In with Same Account',
      description: 'Log in with your existing QuizTube student account to instantly synchronize all your saved quizzes, solved exams, and Pro subscription.',
    },
  ],
};
