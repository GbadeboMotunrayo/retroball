import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';

import TVSet from './src/components/TVSet';
import { initAudio } from './src/audio/sfx';
import { palette } from './src/theme/palette';

export default function App() {
  useEffect(() => {
    // Landscape-first (PRD §5.2). Web has patchy orientation-lock support and
    // will simply ignore this; the portrait nudge covers that case.
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
    initAudio().catch(() => {});

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <View style={styles.root}>
        <TVSet />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cabinetShadow },
});
