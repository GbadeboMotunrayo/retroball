import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { INJECTED_JS } from './injected';
import { palette } from '../theme/palette';

// Device-side diagnostics surface in the Metro terminal, which is the only
// window into what a real stream site does inside the WebView. Dev only.
function diag(...args) {
  if (__DEV__) console.log('[RB player]', ...args);
}

function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Chromeless WebView playback (PRD §4). The stream is the source site's own,
 * at the source site's quality — no re-encoding here.
 *
 * `onStatus` reports one of: 'loading' | 'playing' | 'buffering' | 'error'.
 */
export default function StreamPlayer({ url, muted = false, onStatus }) {
  const ref = useRef(null);
  const origin = useMemo(() => hostOf(url), [url]);

  // Ad frames routinely try to navigate the top window to a different domain.
  // Anything leaving the origin the user actually asked for is refused —
  // otherwise the TV silently ends up showing a casino landing page.
  const onShouldStartLoadWithRequest = useCallback(
    (req) => {
      if (!req.url || req.url === 'about:blank') return true;
      if (req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
      // Sub-frame loads are the stream's own machinery; only gate top-level nav.
      if (!req.isTopFrame) return true;
      const target = hostOf(req.url);
      const allowed = target === origin;
      // A site that fights this will show up here as a burst of blocked
      // hosts — the signature of an ad redirect chain.
      if (!allowed) diag('blocked top-level nav →', target);
      return allowed;
    },
    [origin]
  );

  const onMessage = useCallback(
    (event) => {
      let msg;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      diag(msg.type, msg.payload ?? '');

      if (msg.type === 'diag') return; // reporting only
      if (msg.type === 'playing') onStatus?.('playing');
      else if (msg.type === 'buffering') onStatus?.('buffering');
      // 'found' is the signal that embedding actually worked, even if the
      // stream is still spinning up. The watchdog upstream needs to know the
      // difference between "slow" and "this site will never play here".
      else if (msg.type === 'video-found') onStatus?.('found');
      else if (msg.type === 'video-error' || msg.type === 'no-video') onStatus?.('error');
    },
    [onStatus]
  );

  if (!url) return <View style={styles.blank} />;

  return (
    <View style={styles.root}>
      <WebView
        ref={ref}
        source={{ uri: url }}
        style={styles.web}
        containerStyle={styles.web}
        // Keep the picture inside the bezel — the single most important prop
        // here. Native fullscreen would throw the video out of the TV frame.
        allowsInlineMediaPlayback
        allowsFullscreenVideo={false}
        mediaPlaybackRequiresUserAction={false}
        // Popup / popunder suppression.
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        // Nothing that hints at a browser.
        allowsBackForwardNavigationGestures={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        injectedJavaScript={INJECTED_JS}
        onMessage={onMessage}
        onLoadStart={() => {
          diag('load start', url);
          onStatus?.('loading');
        }}
        onLoadEnd={() => diag('load end')}
        onError={(e) => {
          diag('webview error', e.nativeEvent?.description ?? e.nativeEvent);
          onStatus?.('error');
        }}
        onHttpError={(e) => {
          // A 403/401 here is the classic "this site refuses to be embedded".
          diag('http error', e.nativeEvent?.statusCode, e.nativeEvent?.url);
          onStatus?.('error');
        }}
        mediaPlaybackControlsEnabled={false}
        // Many stream hosts serve a desktop-only player to mobile UAs.
        userAgent={
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.phosphorBlack },
  web: { flex: 1, backgroundColor: palette.phosphorBlack },
  blank: { flex: 1, backgroundColor: palette.phosphorBlack },
});
