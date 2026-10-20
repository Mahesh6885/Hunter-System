import { Platform } from 'react-native';

export const FONTS = {
  // Sci-fi Display Font (Orbitron)
  displayMedium: Platform.select({
    ios: 'Orbitron-Medium',
    android: 'Orbitron_500Medium',
    default: 'sans-serif-medium',
  }),
  displayBold: Platform.select({
    ios: 'Orbitron-Bold',
    android: 'Orbitron_700Bold',
    default: 'sans-serif',
  }),

  // Body Font (Rajdhani)
  bodyMedium: Platform.select({
    ios: 'Rajdhani-Medium',
    android: 'Rajdhani_500Medium',
    default: 'sans-serif',
  }),
  bodySemiBold: Platform.select({
    ios: 'Rajdhani-SemiBold',
    android: 'Rajdhani_600SemiBold',
    default: 'sans-serif-medium',
  }),
  bodyBold: Platform.select({
    ios: 'Rajdhani-Bold',
    android: 'Rajdhani_700Bold',
    default: 'sans-serif',
  }),
} as const;
