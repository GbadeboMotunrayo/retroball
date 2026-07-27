import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { palette } from '../theme/palette';

// PRD §5.3: the whole thing must land in under 2s — nostalgia shouldn't cost
// usability. Total here is ~1.35s.
const DOT = 160;
const LINE = 220;
const OPEN = 300;
const SETTLE = 420;

// The real CRT power-on order: a bright dot blooms, stretches into a
// horizontal line, then the line opens vertically into a full raster that
// flickers once and settles. Phosphor green is used here and only here.
export default function BootSequence({ onComplete }) {
  const dot = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;
  const height = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;

  // Held in a ref so that a parent re-render during the boot window (callers
  // pass an inline arrow) can't restart the sequence from the top and trap the
  // user on a screen that never finishes powering on.
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    const run = Animated.sequence([
      Animated.timing(dot, {
        toValue: 1,
        duration: DOT,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(width, {
        toValue: 1,
        duration: LINE,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(height, {
        toValue: 1,
        duration: OPEN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // One unstable flicker as the tube finds its bias, then fade the whole
      // boot layer out to reveal whatever is behind it.
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.35, duration: 70, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: SETTLE - 180, useNativeDriver: true }),
      ]),
    ]);

    run.start(({ finished }) => {
      if (finished) done.current?.();
    });
    return () => run.stop();
  }, [dot, width, height, flicker]);

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View
        style={[
          styles.raster,
          {
            opacity: Animated.add(
              dot.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
              flicker.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] })
            ),
            transform: [
              { scaleX: Animated.add(0.02, Animated.multiply(width, 0.98)) },
              { scaleY: Animated.add(0.004, Animated.multiply(height, 0.996)) },
            ],
          },
        ]}
      />
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
  raster: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.phosphorGlow,
  },
});
