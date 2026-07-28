import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import StaticNoise from './StaticNoise';
import { palette } from '../theme/palette';
import { type } from '../theme/type';
import { tick } from '../audio/sfx';

// PRD §5.2: a broken or expired link must never surface a raw browser error.
// It surfaces as this — snow, a soft hum, and a broadcast-style caption.
//
// Free stream links expire constantly, so this screen is also the recovery
// point: without a way out of here, a saved channel whose link dies becomes
// permanently unusable. The retune control is the way out.
export default function NoSignal({ detail, channel, onRetune }) {
  return (
    <View style={styles.root}>
      <StaticNoise intensity={0.9} />

      <View style={styles.caption}>
        <Text style={styles.headline}>NO SIGNAL</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}

        {onRetune ? (
          <Pressable
            onPress={() => {
              tick();
              onRetune();
            }}
            style={({ pressed }) => [styles.retune, pressed && styles.retunePressed]}
            accessibilityRole="button"
            accessibilityLabel={channel ? `Retune channel ${channel}` : 'Retune'}
          >
            <Text style={styles.retuneLabel}>
              {channel ? `RETUNE CHANNEL ${channel}` : 'RETUNE'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.phosphorBlack,
  },
  caption: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: 'rgba(17,18,20,0.82)',
    borderWidth: 1,
    borderColor: palette.noSignalRed,
  },
  headline: {
    ...type.status,
    fontSize: 18,
    letterSpacing: 6,
    color: palette.noSignalRed,
  },
  detail: {
    ...type.body,
    marginTop: 8,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  retune: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: palette.signalAmber,
  },
  retunePressed: { opacity: 0.75 },
  retuneLabel: { ...type.label, fontSize: 10, color: palette.cabinetShadow, fontWeight: '700' },
});
