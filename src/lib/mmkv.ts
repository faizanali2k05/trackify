import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'spendify.v1' });

export const mmkvJSON = {
  get<T>(key: string): T | undefined {
    const raw = storage.getString(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  set<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string): void {
    storage.delete(key);
  },
};

/** Zustand persist adapter — bridges MMKV to Zustand's storage interface. */
export const zustandMMKVStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => storage.set(name, value),
  removeItem: (name: string): void => storage.delete(name),
};
