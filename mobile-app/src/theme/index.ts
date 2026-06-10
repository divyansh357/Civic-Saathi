import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const civicTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    // ── Brand primaries ──────────────────────────────────────
    primary:           '#0F766E',   // Teal — main CTA, FAB, chips
    onPrimary:         '#FFFFFF',
    primaryContainer:  '#B2F5EA',   // Tonal fills, selected states
    onPrimaryContainer:'#00201D',

    // ── Secondaries ──────────────────────────────────────────
    secondary:           '#6A8D73', // Sage green
    onSecondary:         '#FFFFFF',
    secondaryContainer:  '#E1E5E1',
    onSecondaryContainer:'#1B3A21',

    // ── Tertiaries ───────────────────────────────────────────
    tertiary:            '#F59E0B', // Warm amber highlights
    onTertiary:          '#FFFFFF',
    tertiaryContainer:   '#FEF3C7',
    onTertiaryContainer: '#3B2600',

    // ── Error ────────────────────────────────────────────────
    error:               '#DC2626',
    onError:             '#FFFFFF',
    errorContainer:      '#FEF2F2',
    onErrorContainer:    '#410002',

    // ── Surfaces ─────────────────────────────────────────────
    background:          '#F4F6FA',
    onBackground:        '#0F172A',
    surface:             '#FFFFFF',
    onSurface:           '#0F172A',
    surfaceVariant:      '#E8E0E8',
    onSurfaceVariant:    '#49454F',
    surfaceDisabled:     'rgba(28, 27, 31, 0.12)',
    onSurfaceDisabled:   'rgba(28, 27, 31, 0.38)',

    // ── Outlines ─────────────────────────────────────────────
    outline:             '#79747E',
    outlineVariant:      '#E2E8F0',

    // ── Misc ─────────────────────────────────────────────────
    inverseSurface:      '#0F172A',
    inverseOnSurface:    '#F1F5F9',
    inversePrimary:      '#5EEAD4',
    shadow:              '#000000',
    scrim:               '#000000',
    elevation: {
      level0: 'transparent',
      level1: '#F8F9FD',
      level2: '#F2F4F8',
      level3: '#ECEEF3',
      level4: '#EAECF1',
      level5: '#E6E9EE',
    },
    backdrop:            'rgba(0, 0, 0, 0.4)',
  },
};
