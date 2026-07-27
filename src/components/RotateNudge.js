import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { palette, cabinet } from '../theme/palette';
import { type } from '../theme/type';

// PRD user story #7: rotating should complete the illusion. Portrait isn't an
// error state — it's the TV waiting to be stood up the right way round.
export default function RotateNudge() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(spin, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(700),
        Animated.timing(spin, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.set,
          {
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg'],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.screen} />
      </Animated.View>

      <Text style={styles.headline}>TURN YOUR SET</Text>
      <Text style={styles.body}>RetroBall runs sideways.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cabinetShadow,
    paddingHorizontal: 32,
  },
  set: {
    width: 96,
    height: 132,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: cabinet.face,
    backgroundColor: cabinet.lowlight,
    padding: 9,
    marginBottom: 30,
  },
  screen: { flex: 1, borderRadius: 4, backgroundColor: palette.phosphorBlack },
  headline: { ...type.status, color: palette.signalAmber },
  body: { ...type.body, marginTop: 10, color: palette.textSecondary },
});
