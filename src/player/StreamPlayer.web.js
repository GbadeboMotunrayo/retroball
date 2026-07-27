import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';
import { type } from '../theme/type';

// Web preview stub. react-native-webview has no meaningful web implementation,
// and cross-origin iframes can't be scripted the way the native player needs —
// so the browser build shows a placard instead of pretending to play.
//
// The shell (cabinet, boot, dial, knob, No Signal) is fully verifiable here;
// playback itself is only verifiable on a device build.
export default function StreamPlayer({ url, onStatus }) {
  useEffect(() => {
    if (url) onStatus?.('playing');
  }, [url, onStatus]);

  return (
    <View style={styles.root}>
      <Text style={styles.headline}>PREVIEW MODE</Text>
      <Text style={styles.body}>Playback is device-only.</Text>
      {url ? <Text style={styles.url} numberOfLines={1}>{url}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.phosphorBlack,
    paddingHorizontal: 24,
  },
  headline: { ...type.status, color: palette.signalAmber, marginBottom: 10 },
  body: { ...type.body, color: palette.textSecondary },
  url: { ...type.channelSmall, color: palette.textDisabled, marginTop: 14, maxWidth: '80%' },
});
