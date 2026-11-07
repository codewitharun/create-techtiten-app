// App state with Zustand. One small store per concern; `persist` saves to the phone.
// Server data (API calls) lives in TanStack Query instead (see src/api/client.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Appearance = 'system' | 'light' | 'dark';

type SettingsState = { appearance: Appearance; setAppearance: (a: Appearance) => void };
export const useSettingsStore = create<SettingsState>()(
  persist((set) => ({ appearance: 'system', setAppearance: (appearance) => set({ appearance }) }), {
    name: 'settings',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

type TapsState = { taps: number; addTap: () => void };
export const useTapsStore = create<TapsState>()((set) => ({ taps: 0, addTap: () => set((s) => ({ taps: s.taps + 1 })) }));

// The hooks screens use (same names in the Redux version of this template).
export const useAppearance = () => ({
  appearance: useSettingsStore((s) => s.appearance),
  setAppearance: useSettingsStore((s) => s.setAppearance),
});
export const useTaps = () => ({ taps: useTapsStore((s) => s.taps), addTap: useTapsStore((s) => s.addTap) });
