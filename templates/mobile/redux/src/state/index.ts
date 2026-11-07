import { useDispatch, useSelector } from 'react-redux';
import { actions, type Appearance, type AppDispatch, type RootState } from './store';

export type { Appearance } from './store';
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// The hooks screens use (same names in the Zustand version of this template).
export function useAppearance() {
  const dispatch = useAppDispatch();
  return { appearance: useAppSelector((s) => s.settings.appearance), setAppearance: (a: Appearance) => dispatch(actions.setAppearance(a)) };
}
export function useTaps() {
  const dispatch = useAppDispatch();
  return { taps: useAppSelector((s) => s.taps.count), addTap: () => dispatch(actions.addTap()) };
}
