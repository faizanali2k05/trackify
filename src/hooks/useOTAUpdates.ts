/**
 * useOTAUpdates — checks for and applies over-the-air (EAS) updates.
 *
 * How "push to GitHub → app updates on every device" works:
 *   1. You push to `main`.
 *   2. The GitHub Action (.github/workflows/eas-update.yml) runs `eas update`,
 *      publishing a new JS/asset bundle to the `production` channel.
 *   3. Installed apps download it. expo-updates checks on launch automatically;
 *      this hook also re-checks when the app returns to the foreground and
 *      reloads as soon as a new bundle is ready — so it feels near real-time.
 *
 * No-ops in Expo Go and in dev (expo-updates is only active in built apps), so
 * it is always safe to mount.
 */
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

async function checkAndApply() {
  // isEnabled is false in Expo Go / dev — bail quietly.
  if (!Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // Offline or transient error — try again next foreground.
  }
}

export function useOTAUpdates() {
  useEffect(() => {
    checkAndApply();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkAndApply();
    });
    return () => sub.remove();
  }, []);
}
