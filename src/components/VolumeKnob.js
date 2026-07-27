import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { palette, cabinet } from '../theme/palette';
import { type } from '../theme/type';
import { tick } from '../audio/sfx';

const SWEEP = 270; // Classic pot travel: 7 o'clock round to 5 o'clock.
const START = -135;
const DRAG_RANGE = 160; // px of vertical drag for the full sweep

// Continuous rotary pot, dragged vertically. Reports 0..1; the caller decides
// whether that drives device media volume (native) or nothing (web preview).
export default function VolumeKnob({ size = 96, value = 0.7, onChange }) {
  const rotation = useRef(new Animated.Value(value)).current;
  const latest = useRef(value);
  const lastDetent = useRef(Math.round(value * 10));

  // PanResponder must not be rebuilt between gestures or the drag drops
  // mid-move, so it closes over refs rather than props.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          latest.current = rotation.__getValue();
        },
        onPanResponderMove: (_evt, gesture) => {
          const next = Math.min(1, Math.max(0, latest.current - gesture.dy / DRAG_RANGE));
          rotation.setValue(next);

          // Click once per 10% of travel — the tactile feedback a real knob gives.
          const detent = Math.round(next * 10);
          if (detent !== lastDetent.current) {
            lastDetent.current = detent;
            tick();
          }
          onChange?.(next);
        },
        onPanResponderRelease: () => {
          latest.current = rotation.__getValue();
        },
      }),
    [rotation, onChange]
  );

  const radius = size / 2;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View
        style={{ width: size, height: size }}
        {...responder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Volume"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      >
        <View style={[styles.plate, { width: size, height: size, borderRadius: radius }]} />

        <Animated.View
          style={[
            styles.knob,
            {
              width: size * 0.68,
              height: size * 0.68,
              borderRadius: size * 0.34,
              left: radius - size * 0.34,
              top: radius - size * 0.34,
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [`${START}deg`, `${START + SWEEP}deg`],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.grip} />
        </Animated.View>
      </View>

      <Text style={styles.label}>VOL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    position: 'absolute',
    backgroundColor: cabinet.lowlight,
    borderWidth: 2,
    borderColor: cabinet.groove,
  },
  knob: {
    position: 'absolute',
    backgroundColor: cabinet.trim,
    borderWidth: 2,
    borderColor: cabinet.highlight,
    alignItems: 'center',
  },
  grip: {
    width: 3,
    height: '40%',
    marginTop: 5,
    borderRadius: 2,
    backgroundColor: palette.cabinetShadow,
  },
  label: { ...type.label, marginTop: 7, color: palette.textSecondary },
});
