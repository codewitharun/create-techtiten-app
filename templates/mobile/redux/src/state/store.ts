// App state with Redux Toolkit. Server data (API calls) goes through RTK Query (./apiSlice).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';

export type Appearance = 'system' | 'light' | 'dark';

const settings = createSlice({
  name: 'settings',
  initialState: { appearance: 'system' as Appearance },
  reducers: { setAppearance: (s, a: PayloadAction<Appearance>) => { s.appearance = a.payload; } },
});

const taps = createSlice({
  name: 'taps',
  initialState: { count: 0 },
  reducers: { addTap: (s) => { s.count += 1; } },
});

export const actions = { ...settings.actions, ...taps.actions };
export const store = configureStore({
  reducer: { settings: settings.reducer, taps: taps.reducer, [apiSlice.reducerPath]: apiSlice.reducer },
  middleware: (get) => get().concat(apiSlice.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Persist settings on this phone (small and explicit; add redux-persist if you need more).
const KEY = 'settings';
AsyncStorage.getItem(KEY)
  .then((raw) => { const s = raw ? JSON.parse(raw) : null; if (s?.appearance) store.dispatch(actions.setAppearance(s.appearance)); })
  .catch(() => {});
let last = store.getState().settings;
store.subscribe(() => {
  const now = store.getState().settings;
  if (now !== last) { last = now; AsyncStorage.setItem(KEY, JSON.stringify(now)).catch(() => {}); }
});
