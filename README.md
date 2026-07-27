# RetroBall TV

Turn any phone into a football set from 1985 — and stream the match live.

The full pitch and PRD live in `docs/` locally and are deliberately kept out of
this repo — see `.gitignore`. Ask the maintainer if you need them.

## Stack

Expo SDK 54 · React Native 0.81.5 · React 19.1 · New Architecture.

Pinned to 54 on purpose. Expo Go runs exactly one SDK version, and the rest of
the fleet (lux, rebuild, Carpadi, karin, My Kitchen Diary mobile) is on 54 —
bumping RetroBall alone would force an Expo Go upgrade that locks the phone out
of every other project.

## Running it

Browser preview — verifies the shell, not playback:

```bash
cd ~/Desktop/Tech/retroball && npx expo start --web
```

On a device (needed for anything involving the player):

```bash
npx expo start
```

On a phone via Expo Go (same Wi-Fi):

```bash
npx expo start --host lan
```

Regenerate the CRT snow textures after editing the generator:

```bash
node scripts/make-noise.js
```

## Vercel

`vercel.json` builds with `expo export --platform web` into `dist/`. Import the
repo on Vercel and it needs no further configuration.

**Be clear about what the hosted site is.** It renders the TV — boot sequence,
cabinet, dial, knob, snow, No Signal — but it **cannot play a stream**, because
`react-native-webview` has no web implementation and the build swaps in
`StreamPlayer.web.js`, a placard. Treat the deploy as a demo and marketing
surface for the shell, not as the product. The product is the phone app.

## What's built

| Area | State |
| --- | --- |
| CRT boot sequence (dot → line → raster → flicker) | Done, ~1.35s, inside the 2s budget |
| Wooden cabinet, screen recess, scanlines, vignette | Done |
| Channel dial, 9 detents, saved/empty/active states | Done |
| Volume knob (drag, detent clicks) | Done — **reports 0..1 only, not yet wired to device volume** |
| Tune-in OSD, paste + type, URL validation | Done |
| Tuning snow → picture snap | Done |
| "No Signal" state | Done |
| 9 local presets (AsyncStorage), save + one-tap switch | Done |
| Returns to last channel on power-on | Done |
| Portrait rotation nudge | Done |
| Chromeless WebView player | **Written, not verified — see below** |
| Sound design (hum, click, static) | Haptics only; audio needs assets |

## The two things that are not done

### 1. The WebView player is unverified

`src/player/StreamPlayer.js` is written with every anti-chrome-leak measure the
approach needs — inline playback forced, native fullscreen disabled, popups and
multi-window suppressed, off-origin top-level navigation refused, and an
injected script that promotes the largest `<video>` to fill the bezel and hides
the site's own chrome.

**None of that has been run against a real stream.** `react-native-webview` has
no meaningful web implementation, so the browser preview loads
`StreamPlayer.web.js` — a placard, not a player. Verifying this needs a phone
(Expo Go is enough) plus a real stream link.

This is the load-bearing risk in the whole product. The two failure modes to
watch for are (a) sites that refuse to be embedded at all, and (b) video that
escapes into the OS fullscreen player, which would break the bezel illusion at
the exact moment the match starts.

### 2. Sound design needs assets

`src/audio/sfx.js` ships the tactile half — haptic detent clicks work today. The
hum/click/static players are stubbed behind one commented block. Drop
`hum.mp3`, `click.mp3` and `static.mp3` into `src/audio/assets`, uncomment that
block, and nothing else in the app changes.

## What Expo Go can and can't do

`react-native-webview`, `expo-screen-orientation`, `expo-audio`, `expo-haptics`
and AsyncStorage all ship inside Expo Go — so the shell **and the WebView spike**
can be tested on a phone right now, no build required.

The one thing that still needs an EAS dev build is mapping the volume knob to
device media volume, which wants a native module Expo Go doesn't carry.

## Layout

```
src/
  audio/sfx.js            haptics now, audio behind an asset drop-in
  components/             TVSet (assembly) + cabinet, dial, knob, boot, snow, OSD
  player/                 StreamPlayer.js (native) / .web.js (preview stub) / injected.js
  state/                  usePresets (AsyncStorage), validateUrl
  theme/                  palette (PRD §5, exact), type
scripts/make-noise.js     generates assets/noise/*.png
```

Palette is the approved system verbatim. Pure white appears nowhere; phosphor
green (`#C9FFD2`) is confined to the boot raster and scanline sheen.
