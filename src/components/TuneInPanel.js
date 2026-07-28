import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { palette } from '../theme/palette';
import { type } from '../theme/type';
import { normalizeUrl } from '../state/validateUrl';
import { tick } from '../audio/sfx';

// Shown on the screen area when no channel is tuned, and when retuning a
// channel whose saved link has died. Styled as an on-screen display (the menu
// an old TV overlays on the picture), not as an app form.
export default function TuneInPanel({ channel, initialValue = '', onTune, onClear }) {
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState(null);

  // Retuning a different channel must not carry the previous channel's link
  // into the box.
  useEffect(() => {
    setText(initialValue);
    setError(null);
  }, [initialValue, channel]);

  const paste = async () => {
    tick();
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip) {
        setText(clip);
        setError(null);
      }
    } catch {
      // Clipboard permission denied or empty — typing still works.
    }
  };

  const submit = () => {
    const result = normalizeUrl(text);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    tick();
    onTune?.(result.url, result.host);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.osd}>{channel ? `TUNE CHANNEL ${channel}` : 'TUNE IN'}</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            if (error) setError(null);
          }}
          onSubmitEditing={submit}
          placeholder="paste a stream link"
          placeholderTextColor={palette.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectionColor={palette.signalAmber}
          style={styles.input}
          accessibilityLabel="Stream link"
        />
        <Pressable onPress={paste} style={styles.pasteBtn} accessibilityRole="button">
          <Text style={styles.pasteLabel}>PASTE</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.tuneBtn, pressed && styles.tuneBtnPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.tuneLabel}>TUNE IN</Text>
        </Pressable>

        {/* Only offered when there is actually a saved channel to wipe. */}
        {onClear ? (
          <Pressable
            onPress={() => {
              tick();
              onClear();
            }}
            style={({ pressed }) => [styles.clearBtn, pressed && styles.tuneBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Clear channel ${channel}`}
          >
            <Text style={styles.clearLabel}>CLEAR</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  osd: { ...type.status, color: palette.signalAmber, marginBottom: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%', maxWidth: 460 },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(233,220,198,0.3)',
    backgroundColor: 'rgba(17,18,20,0.85)',
    color: palette.tubeGlow,
    ...type.channelSmall,
  },
  pasteBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(233,220,198,0.3)',
    backgroundColor: 'rgba(233,220,198,0.08)',
  },
  pasteLabel: { ...type.label, color: palette.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  tuneBtn: {
    paddingHorizontal: 30,
    paddingVertical: 11,
    backgroundColor: palette.signalAmber,
  },
  tuneBtnPressed: { opacity: 0.75 },
  tuneLabel: { ...type.label, fontSize: 11, color: palette.cabinetShadow, fontWeight: '700' },
  clearBtn: {
    marginLeft: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: palette.noSignalRed,
  },
  clearLabel: { ...type.label, fontSize: 11, color: palette.noSignalRed },
  error: { ...type.body, marginTop: 14, color: palette.noSignalRed },
});
