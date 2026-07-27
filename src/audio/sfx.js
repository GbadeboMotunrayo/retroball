import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Sound design (PRD Phase 2: hum, click, static) needs three audio assets that
// don't exist yet. Rather than fake them, this module ships the tactile half —
// which works today with no assets — and leaves a single wiring point for the
// audio half.
//
// TO ENABLE SOUND: drop hum.mp3 / click.mp3 / static.mp3 into src/audio/assets,
// uncomment the block below, and the rest of the app needs no changes.
//
// import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
// const SOURCES = {
//   hum: require('./assets/hum.mp3'),
//   click: require('./assets/click.mp3'),
//   static: require('./assets/static.mp3'),
// };
// const players = {};
// export async function initAudio() {
//   await setAudioModeAsync({ playsInSilentMode: true });
//   Object.entries(SOURCES).forEach(([k, src]) => {
//     players[k] = createAudioPlayer(src);
//   });
//   players.hum.loop = true;
//   players.static.loop = true;
// }

const players = {};

export async function initAudio() {
  // No-op until assets land. Kept async so callers don't change shape later.
}

function playSound(name, { loop = false } = {}) {
  const p = players[name];
  if (!p) return;
  p.loop = loop;
  p.seekTo(0);
  p.play();
}

function stopSound(name) {
  players[name]?.pause();
}

/** Mechanical detent click — dial turn, knob step, preset save. */
export function tick() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  }
  playSound('click');
}

/** Heavier thunk — power on/off. */
export function thunk() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
  playSound('click');
}

/** The low mains hum of a warm tube. Runs under boot and under No Signal. */
export function startHum() {
  playSound('hum', { loop: true });
}
export function stopHum() {
  stopSound('hum');
}

/** Snow hiss, played while tuning and while No Signal is on screen. */
export function startStatic() {
  playSound('static', { loop: true });
}
export function stopStatic() {
  stopSound('static');
}

export function setSfxVolume(v) {
  Object.values(players).forEach((p) => {
    if (p) p.volume = v;
  });
}
