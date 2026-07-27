import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StaticNoise from './StaticNoise';
import { palette } from '../theme/palette';
import { type } from '../theme/type';

// PRD §5.2: a broken or expired link must never surface a raw browser error.
// It surfaces as this — snow, a soft hum, and a broadcast-style caption.
export default function NoSignal({ detail }) {
  return (
    <View style={styles.root}>
      <StaticNoise intensity={0.9} />

      <View style={styles.caption} pointerEvents="none">
        <Text style={styles.headline}>NO SIGNAL</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
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
    backgroundColor: 'rgba(17,18,20,0.72)',
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
});
