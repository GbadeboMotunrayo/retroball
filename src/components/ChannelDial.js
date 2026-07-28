import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, cabinet } from '../theme/palette';
import { type } from '../theme/type';
import { tick } from '../audio/sfx';

const CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const STEP = 360 / CHANNELS.length;

// Rotary channel selector. Tapping a detent spins the pointer to it with a
// mechanical click — "turn the dial to Channel 3" is the core interaction the
// product is named after, so it gets real physics rather than a tab bar.
export default function ChannelDial({ size = 132, channel, presets = {}, onSelect, onRetune }) {
  const angle = useRef(new Animated.Value(((channel || 1) - 1) * STEP)).current;

  useEffect(() => {
    Animated.timing(angle, {
      toValue: ((channel || 1) - 1) * STEP,
      duration: 340,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();
  }, [channel, angle]);

  const radius = size / 2;
  const detentRadius = radius - 13;

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.bezel, { width: size, height: size, borderRadius: radius }]} />

      {CHANNELS.map((n, i) => {
        // -90° so channel 1 sits at 12 o'clock rather than 3 o'clock.
        const rad = ((i * STEP - 90) * Math.PI) / 180;
        const saved = Boolean(presets[n]);
        const active = channel === n;

        return (
          <Pressable
            key={n}
            onPress={() => {
              tick();
              onSelect?.(n);
            }}
            // Long-press is the shortcut for replacing a saved channel's link
            // without having to sit through its No Signal screen first.
            onLongPress={
              saved
                ? () => {
                    tick();
                    onRetune?.(n);
                  }
                : undefined
            }
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Channel ${n}${saved ? ', saved' : ', empty'}`}
            accessibilityHint={saved ? 'Long press to retune or clear' : undefined}
            accessibilityState={{ selected: active }}
            style={[
              styles.detent,
              {
                left: radius + detentRadius * Math.cos(rad) - 13,
                top: radius + detentRadius * Math.sin(rad) - 13,
                borderColor: active
                  ? palette.signalAmber
                  : saved
                    ? palette.broadcastGreen
                    : 'rgba(233,220,198,0.22)',
                backgroundColor: active ? 'rgba(217,145,30,0.18)' : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.detentLabel,
                {
                  color: active
                    ? palette.signalAmber
                    : saved
                      ? palette.broadcastGreen
                      : palette.textDisabled,
                },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}

      {/* Knob body + pointer, rotating as one piece. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.knob,
          {
            width: size * 0.46,
            height: size * 0.46,
            borderRadius: size * 0.23,
            left: radius - size * 0.23,
            top: radius - size * 0.23,
            transform: [
              {
                rotate: angle.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.pointer} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bezel: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: cabinet.groove,
    backgroundColor: cabinet.lowlight,
  },
  detent: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detentLabel: { ...type.channelSmall, fontSize: 13 },
  knob: {
    position: 'absolute',
    backgroundColor: cabinet.trim,
    borderWidth: 2,
    borderColor: cabinet.highlight,
    alignItems: 'center',
  },
  pointer: {
    width: 3,
    height: '38%',
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: palette.signalAmber,
  },
});
