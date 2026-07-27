import { Platform } from 'react-native';

// No custom font assets in v1 — the retro read comes from the cabinet and the
// screen, not from a downloaded typeface. Platform monospace gives channel
// numbers and status text the right analog/broadcast feel with zero load cost.
export const fonts = {
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'ui-monospace, Menlo, Consolas, monospace',
  }),
  sans: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-condensed',
    default: 'system-ui, sans-serif',
  }),
};

export const type = {
  channelBig: { fontFamily: fonts.mono, fontSize: 34, letterSpacing: 2 },
  channelSmall: { fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1 },
  status: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 3 },
  label: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 2 },
  body: { fontFamily: fonts.sans, fontSize: 14 },
};

export default type;
