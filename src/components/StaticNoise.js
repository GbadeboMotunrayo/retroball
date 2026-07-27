import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { palette } from '../theme/palette';

// Three pre-generated 96px tiles (see scripts/make-noise.js) cross-faded on the
// native driver. One <Image> per layer instead of a grid of hundreds of Views:
// the snow is finer, and the JS thread does nothing per frame — which is what
// keeps this smooth on the older Android hardware the PRD targets.
const TILES = [
  require('../../assets/noise/snow1.png'),
  require('../../assets/noise/snow2.png'),
  require('../../assets/noise/snow3.png'),
];

const CYCLE_MS = 260;

export default function StaticNoise({ intensity = 1, style }) {
  const frame = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const roll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flicker = Animated.loop(
      Animated.timing(frame, {
        toValue: TILES.length,
        duration: CYCLE_MS * TILES.length,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    // Sub-tile drift stops the repeat from reading as a fixed pattern.
    const drifting = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    // The slow vertical roll-bar of an untuned analog signal.
    const rolling = Animated.loop(
      Animated.timing(roll, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    flicker.start();
    drifting.start();
    rolling.start();
    return () => {
      flicker.stop();
      drifting.stop();
      rolling.stop();
    };
  }, [frame, drift, roll]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, style]} pointerEvents="none">
      {TILES.map((src, i) => (
        <Animated.View
          key={i}
          style={[
            styles.layer,
            {
              opacity: frame.interpolate({
                // Each tile peaks in its own slice of the cycle and hands over
                // to the next; the extra points keep the wrap seamless.
                inputRange: [i - 1, i, i + 1, TILES.length + i - 1, TILES.length + i],
                outputRange: [0, intensity, 0, 0, intensity],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, i % 2 === 0 ? 96 : -96],
                  }),
                },
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, i === 1 ? 96 : -96],
                  }),
                },
              ],
            },
          ]}
        >
          <Image source={src} style={styles.tile} resizeMode="repeat" fadeDuration={0} />
        </Animated.View>
      ))}

      <Animated.View
        style={[
          styles.rollBar,
          {
            opacity: 0.07 * intensity,
            transform: [
              {
                translateY: roll.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-20%', '120%'],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: palette.phosphorBlack },
  // Oversized so the drift never exposes an untiled edge.
  layer: { position: 'absolute', top: -96, left: -96, right: -96, bottom: -96 },
  tile: { width: '100%', height: '100%' },
  rollBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '14%',
    backgroundColor: palette.tubeGlow,
  },
});
