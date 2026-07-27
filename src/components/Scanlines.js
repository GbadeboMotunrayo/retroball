import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../theme/palette';

const LINE_COUNT = 90;

// Static overlay: horizontal scan lines plus a corner vignette to fake tube
// curvature. Purely decorative, so it never intercepts touches.
export default function Scanlines({ curvature = true }) {
  const lines = useMemo(() => Array.from({ length: LINE_COUNT }), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.lines}>
        {lines.map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      {curvature ? (
        <>
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.55)']}
            locations={[0, 0.18, 0.82, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'transparent', 'rgba(0,0,0,0.45)']}
            locations={[0, 0.14, 0.86, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}

      {/* Phosphor sheen across the top of the glass. */}
      <LinearGradient
        colors={['rgba(201,255,210,0.05)', 'transparent']}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lines: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.phosphorBlack,
    opacity: 0.5,
  },
});
