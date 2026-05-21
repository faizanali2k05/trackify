import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * App persistence layer.
 *
 * We use AsyncStorage so the app runs in Expo Go with zero native build setup.
 * It satisfies Zustand's async StateStorage contract. If you later move to a
 * custom dev build and want the extra speed, this is the single file to swap
 * for an MMKV-backed adapter.
 */
export const persistStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

/** Convenience JSON helpers for ad-hoc reads/writes outside of Zustand. */
export const storageJSON = {
  async get<T>(key: string): Promise<T | undefined> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
