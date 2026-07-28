import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';

import BootSequence from './BootSequence';
import ChannelDial from './ChannelDial';
import NoSignal from './NoSignal';
import RotateNudge from './RotateNudge';
import Scanlines from './Scanlines';
import StaticNoise from './StaticNoise';
import TuneInPanel from './TuneInPanel';
import VolumeKnob from './VolumeKnob';
import StreamPlayer from '../player/StreamPlayer';
import { usePresets } from '../state/usePresets';
import { palette, cabinet } from '../theme/palette';
import { type } from '../theme/type';
import { startHum, startStatic, stopHum, stopStatic, thunk, tick } from '../audio/sfx';

// How long the snow plays before the picture snaps in. Long enough to read as
// tuning, short enough that it never feels like a loading spinner in disguise.
const TUNING_MS = 900;

// A page can load without ever playing — a silent refusal to embed, a stream
// that never starts. Without this the user stares at black forever. Set
// generously: the target audience is on African mobile networks, and a false
// "No Signal" on a link that would have worked is the worse failure.
const WATCHDOG_MS = 15000;

const MODE = {
  OFF: 'off',
  BOOTING: 'booting',
  IDLE: 'idle',
  TUNING: 'tuning',
  PLAYING: 'playing',
  NO_SIGNAL: 'nosignal',
};

export default function TVSet() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const [mode, setMode] = useState(MODE.BOOTING);
  const [channel, setChannel] = useState(1);
  const [url, setUrl] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [failure, setFailure] = useState(null);
  const { presets, ready, save, clear } = usePresets();

  const [retuning, setRetuning] = useState(false);

  const restored = useRef(false);
  const tuningTimer = useRef(null);
  const watchdogTimer = useRef(null);
  const snap = useRef(new Animated.Value(0)).current;

  // Nobody wants the screen dimming at 1-1 in the 80th minute.
  useKeepAwake();

  useEffect(
    () => () => {
      clearTimeout(tuningTimer.current);
      clearTimeout(watchdogTimer.current);
    },
    []
  );

  // Ambient audio follows the mode. Hum under everything that isn't playing,
  // snow hiss under tuning and No Signal.
  useEffect(() => {
    if (mode === MODE.OFF) {
      stopHum();
      stopStatic();
      return;
    }
    if (mode === MODE.TUNING || mode === MODE.NO_SIGNAL) {
      startHum();
      startStatic();
    } else {
      stopStatic();
      if (mode === MODE.PLAYING) stopHum();
      else startHum();
    }
  }, [mode]);

  const tuneTo = useCallback(
    (nextUrl) => {
      clearTimeout(tuningTimer.current);
      clearTimeout(watchdogTimer.current);
      setFailure(null);
      setRetuning(false);
      setUrl(nextUrl);
      setMode(MODE.TUNING);
      snap.setValue(0);

      // The picture is mounted behind the snow during this window so it has a
      // head start loading — the snow is covering real work, not stalling.
      tuningTimer.current = setTimeout(() => {
        setMode((m) => (m === MODE.TUNING ? MODE.PLAYING : m));
      }, TUNING_MS);

      // Cancelled as soon as the player reports a video (see onStatus).
      watchdogTimer.current = setTimeout(() => {
        setFailure("This link didn't start playing. It may be dead, or it may block playback here.");
        setMode(MODE.NO_SIGNAL);
      }, WATCHDOG_MS);
    },
    [snap]
  );

  // The picture "snapping into focus" out of the snow (PRD §3.3).
  useEffect(() => {
    if (mode !== MODE.PLAYING) return;
    Animated.timing(snap, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, snap]);

  // A real set comes back on the channel you left it on. Once the stored
  // presets have loaded, tune the selected channel automatically rather than
  // asking a returning fan for a link they already saved. Guarded so it can
  // only ever fire once — it must not yank the user off an empty channel they
  // deliberately switched to.
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const preset = presets[channel];
    if (preset?.url) tuneTo(preset.url);
  }, [ready, presets, channel, tuneTo]);

  const onSelectChannel = useCallback(
    (n) => {
      setChannel(n);
      setRetuning(false);
      const preset = presets[n];
      if (preset?.url) tuneTo(preset.url);
      else {
        clearTimeout(watchdogTimer.current);
        setUrl(null);
        setFailure(null);
        setMode(MODE.IDLE);
      }
    },
    [presets, tuneTo]
  );

  const onStatus = useCallback((status) => {
    if (status === 'error') {
      clearTimeout(watchdogTimer.current);
      setFailure('The channel went off air, or the link has expired.');
      setMode(MODE.NO_SIGNAL);
      return;
    }
    // Any of these means the page embedded and produced a video, so however
    // slow it is from here, it is not a dead link.
    if (status === 'playing' || status === 'found' || status === 'buffering') {
      clearTimeout(watchdogTimer.current);
    }
  }, []);

  // Opens the tune-in panel for a channel that already has a link saved, so a
  // dead preset can be replaced or wiped instead of stranding the user.
  const retune = useCallback(
    (n) => {
      const target = n ?? channel;
      clearTimeout(tuningTimer.current);
      clearTimeout(watchdogTimer.current);
      setChannel(target);
      setUrl(null);
      setFailure(null);
      setRetuning(true);
      setMode(MODE.IDLE);
    },
    [channel]
  );

  const clearChannel = useCallback(() => {
    tick();
    clear(channel);
    setUrl(null);
    setFailure(null);
    setRetuning(false);
    setMode(MODE.IDLE);
  }, [channel, clear]);

  const togglePower = useCallback(() => {
    thunk();
    setMode((m) => {
      if (m === MODE.OFF) return MODE.BOOTING;
      return MODE.OFF;
    });
  }, []);

  const saveCurrent = useCallback(() => {
    if (!url) return;
    tick();
    save(channel, url);
  }, [url, channel, save]);

  const canSave = Boolean(url) && presets[channel]?.url !== url;
  // After a retune the channel still holds the old preset until SET is pressed,
  // so the label must follow what is actually playing, not what is stored —
  // otherwise the set claims to be showing a link it isn't.
  const nowShowing = canSave ? null : presets[channel]?.label;

  const screenBody = useMemo(() => {
    if (mode === MODE.OFF) return <View style={styles.dead} />;
    if (mode === MODE.BOOTING) {
      return <BootSequence onComplete={() => setMode(url ? MODE.PLAYING : MODE.IDLE)} />;
    }
    if (mode === MODE.NO_SIGNAL) {
      return (
        <NoSignal
          detail={failure}
          channel={presets[channel]?.url ? channel : null}
          onRetune={presets[channel]?.url ? () => retune(channel) : null}
        />
      );
    }

    return (
      <>
        {url ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: snap }]}>
            <StreamPlayer url={url} muted={volume === 0} onStatus={onStatus} />
          </Animated.View>
        ) : null}

        {mode === MODE.TUNING ? <StaticNoise intensity={1} /> : null}
        {mode === MODE.IDLE ? (
          <TuneInPanel
            channel={retuning ? channel : null}
            initialValue={retuning ? (presets[channel]?.url ?? '') : ''}
            onTune={tuneTo}
            onClear={retuning && presets[channel]?.url ? clearChannel : null}
          />
        ) : null}
      </>
    );
  }, [
    mode,
    url,
    failure,
    snap,
    volume,
    onStatus,
    tuneTo,
    retuning,
    channel,
    presets,
    retune,
    clearChannel,
  ]);

  if (!isLandscape) return <RotateNudge />;

  return (
    <View
      style={[
        styles.room,
        { paddingLeft: insets.left + 10, paddingRight: insets.right + 10 },
      ]}
    >
      <View style={styles.cabinet}>
        {/* Screen recess */}
        <View style={styles.recess}>
          <View style={styles.glass}>
            {screenBody}
            {mode !== MODE.OFF ? <Scanlines /> : null}
          </View>
        </View>

        {/* Control column */}
        <View style={styles.controls}>
          <Text style={styles.brand}>RetroBall</Text>

          <ChannelDial
            channel={channel}
            presets={presets}
            onSelect={onSelectChannel}
            onRetune={retune}
            size={124}
          />

          <Text style={styles.nowShowing} numberOfLines={1}>
            {mode === MODE.OFF
              ? '—'
              : nowShowing || (url ? 'UNSAVED' : 'NO CHANNEL')}
          </Text>

          <View style={styles.knobRow}>
            <VolumeKnob value={volume} onChange={setVolume} size={78} />

            <View style={styles.stack}>
              <Pressable
                onPress={togglePower}
                style={styles.power}
                accessibilityRole="button"
                accessibilityLabel={mode === MODE.OFF ? 'Power on' : 'Power off'}
              >
                <View
                  style={[
                    styles.powerLamp,
                    {
                      backgroundColor:
                        mode === MODE.OFF ? cabinet.groove : palette.broadcastGreen,
                    },
                  ]}
                />
                <Text style={styles.powerLabel}>PWR</Text>
              </Pressable>

              <Pressable
                onPress={saveCurrent}
                disabled={!canSave}
                style={[styles.save, !canSave && styles.saveDisabled]}
                accessibilityRole="button"
                accessibilityLabel={`Save to channel ${channel}`}
              >
                <Text
                  style={[
                    styles.saveLabel,
                    { color: canSave ? palette.broadcastGreen : palette.textDisabled },
                  ]}
                >
                  SET {channel}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Speaker grille — pure decoration, but the cabinet reads wrong without it. */}
          <View style={styles.grille}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={styles.grilleSlot} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.cabinetShadow,
    paddingVertical: 10,
  },
  cabinet: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: cabinet.face,
    borderWidth: 3,
    borderColor: cabinet.highlight,
    padding: 12,
    // Depth. Elevation carries Android, the shadow* set carries iOS/web.
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  recess: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: cabinet.groove,
    padding: 9,
  },
  glass: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.phosphorBlack,
  },
  dead: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.phosphorBlack },

  controls: {
    width: 168,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  brand: {
    ...type.label,
    fontSize: 12,
    color: cabinet.trim,
    letterSpacing: 3,
  },
  nowShowing: {
    ...type.label,
    color: palette.signalAmber,
    maxWidth: 150,
  },
  knobRow: { flexDirection: 'row', alignItems: 'center' },
  stack: { marginLeft: 14, alignItems: 'center' },
  power: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: cabinet.lowlight,
    borderWidth: 1,
    borderColor: cabinet.groove,
  },
  powerLamp: { width: 8, height: 8, borderRadius: 4, marginBottom: 5 },
  powerLabel: { ...type.label, fontSize: 9, color: palette.textSecondary },
  save: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.broadcastGreen,
  },
  saveDisabled: { borderColor: cabinet.groove },
  saveLabel: { ...type.label, fontSize: 9 },
  grille: {
    width: '86%',
    borderRadius: 5,
    backgroundColor: cabinet.lowlight,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  grilleSlot: {
    height: 2,
    marginVertical: 2,
    borderRadius: 1,
    backgroundColor: cabinet.groove,
  },
});
