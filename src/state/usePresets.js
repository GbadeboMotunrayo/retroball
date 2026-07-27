import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'retroball.presets.v1';

/**
 * Up to 9 channel presets, stored locally on device. No account, no sync —
 * PRD §5.3 puts onboarding friction at zero for v1.
 *
 * Shape: { [channel: 1..9]: { url, label, savedAt } }
 */
export function usePresets() {
  const [presets, setPresets] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) setPresets(JSON.parse(raw));
      })
      .catch(() => {
        // A corrupt or unreadable store just means "no saved channels" — it
        // should never block the user from tuning in manually.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next) => {
    setPresets(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const save = useCallback(
    (channel, url, label) => {
      let host = label;
      if (!host) {
        try {
          host = new URL(url).host.replace(/^www\./, '');
        } catch {
          host = 'CHANNEL';
        }
      }
      persist({ ...presets, [channel]: { url, label: host, savedAt: Date.now() } });
    },
    [presets, persist]
  );

  const clear = useCallback(
    (channel) => {
      const next = { ...presets };
      delete next[channel];
      persist(next);
    },
    [presets, persist]
  );

  return { presets, ready, save, clear };
}

export default usePresets;
