import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

// ---------------------------------------------------------------- Alert dialog (sweet-alert style)
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type AlertButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; value?: string };
export type AlertOptions = { title: string; message?: string; type?: AlertType; buttons?: AlertButton[]; dismissable?: boolean };
type Confirm = { title: string; message?: string; confirmText?: string; cancelText?: string; destructive?: boolean; type?: AlertType };

type Overlay = {
  /** Shows a dialog; resolves with the pressed button's value (or text), undefined if dismissed. */
  alert: (o: AlertOptions) => Promise<string | undefined>;
  /** Yes/no dialog; resolves true when confirmed. */
  confirm: (o: Confirm) => Promise<boolean>;
  toast: (message: string, o?: { type?: AlertType; durationMs?: number }) => void;
};

const OverlayContext = createContext<Overlay | null>(null);

/** `const { alert, confirm, toast } = useAlert();` then `if (await confirm({ title: 'Delete?' })) …` */
export function useAlert(): Overlay {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useAlert must be used inside <OverlayProvider> (it is in AppProviders)');
  return ctx;
}
export const useToast = () => useAlert().toast;

const ICONS: Record<AlertType, keyof typeof Ionicons.glyphMap> = { success: 'checkmark-circle', error: 'close-circle', warning: 'warning', info: 'information-circle' };

export function OverlayProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [dialog, setDialog] = useState<(AlertOptions & { resolve: (v: string | undefined) => void }) | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: AlertType }[]>([]);
  const nextId = useRef(0);

  const toneColor = (type: AlertType = 'info') => ({ success: t.colors.success, error: t.colors.danger, warning: t.colors.warning, info: t.colors.brand })[type];

  const alert = useCallback((o: AlertOptions) => new Promise<string | undefined>((resolve) => {
    if (Platform.OS !== 'web' && o.type) Haptics.notificationAsync(o.type === 'error' ? Haptics.NotificationFeedbackType.Error : o.type === 'warning' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDialog({ ...o, resolve });
  }), []);

  const confirm = useCallback(async (o: Confirm) => {
    const v = await alert({
      title: o.title, message: o.message, type: o.type ?? (o.destructive ? 'warning' : undefined),
      buttons: [{ text: o.cancelText ?? 'Cancel', style: 'cancel', value: 'cancel' }, { text: o.confirmText ?? 'OK', style: o.destructive ? 'destructive' : 'default', value: 'ok' }],
    });
    return v === 'ok';
  }, [alert]);

  const toast = useCallback((message: string, o?: { type?: AlertType; durationMs?: number }) => {
    const id = ++nextId.current;
    setToasts((all) => [...all.slice(-2), { id, message, type: o?.type ?? 'info' }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), o?.durationMs ?? 2600);
  }, []);

  const close = (value: string | undefined) => { dialog?.resolve(value); setDialog(null); };
  const value = useMemo(() => ({ alert, confirm, toast }), [alert, confirm, toast]);
  const buttons = dialog?.buttons ?? [{ text: 'OK', value: 'ok' }];

  return (
    <OverlayContext.Provider value={value}>
      {children}

      <Modal visible={!!dialog} transparent animationType="none" onRequestClose={() => { if (dialog?.dismissable !== false) close(undefined); }} statusBarTranslucent>
        {dialog ? (
          <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Pressable style={{ position: 'absolute', inset: 0 } as object} onPress={() => { if (dialog.dismissable !== false) close(undefined); }} accessibilityLabel="Close" />
            <Animated.View entering={ZoomIn.springify().damping(16)} style={{ width: '100%', maxWidth: 380, backgroundColor: t.colors.surface, borderRadius: t.radius.xl, padding: t.spacing.xl, gap: t.spacing.md, alignItems: 'center', borderColor: t.colors.border, borderWidth: 1 }} accessibilityRole="alert">
              {dialog.type ? <Ionicons name={ICONS[dialog.type]} size={56} color={toneColor(dialog.type)} /> : null}
              <Text size="xl" weight="bold" center>{dialog.title}</Text>
              {dialog.message ? <Text muted center>{dialog.message}</Text> : null}
              <View style={{ flexDirection: buttons.length > 2 ? 'column' : 'row', gap: 8, alignSelf: 'stretch', marginTop: 8 }}>
                {buttons.map((b) => (
                  <Button key={b.text} title={b.text} style={{ flex: buttons.length > 2 ? undefined : 1 }}
                    variant={b.style === 'cancel' ? 'ghost' : b.style === 'destructive' ? 'danger' : 'primary'}
                    onPress={() => close(b.value ?? b.text)} />
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Modal>

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
        {toasts.map((x) => (
          <Animated.View key={x.id} entering={SlideInUp.springify().damping(18)} exiting={FadeOut} accessibilityLiveRegion="polite"
            style={{ maxWidth: 480, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, borderLeftColor: toneColor(x.type), borderLeftWidth: 4, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <Ionicons name={ICONS[x.type]} size={20} color={toneColor(x.type)} />
            <Text style={{ flex: 1 }}>{x.message}</Text>
          </Animated.View>
        ))}
      </View>
    </OverlayContext.Provider>
  );
}

// ---------------------------------------------------------------- Bottom sheet
/** Slides up from the bottom (centered dialog on wide screens). Tap outside to close. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
        <Pressable style={{ position: 'absolute', inset: 0 } as object} onPress={onClose} accessibilityLabel="Close" />
        <Animated.View entering={SlideInDown.springify().damping(20)} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: t.radius.xl, borderTopRightRadius: t.radius.xl, padding: t.spacing.lg, paddingBottom: t.spacing.lg + insets.bottom, gap: t.spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border }} />
          {title ? <Text size="lg" weight="bold">{title}</Text> : null}
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
