import { create } from 'zustand';

const useAppStore = create((set) => ({
  tg: null,
  user: null,
  colorScheme: 'light',
  isReady: false,

  initTelegram: () => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();

      set({
        tg,
        user: tg.initDataUnsafe?.user || null,
        colorScheme: tg.colorScheme || 'light',
        isReady: true,
      });

      // Listen to theme changes
      tg.onEvent('themeChanged', () => {
        set({ colorScheme: tg.colorScheme });
      });
    } else {
      // Dev fallback — mock user for testing outside Telegram
      set({
        tg: null,
        user: {
          id: 123456,
          first_name: 'مصطفى',
          last_name: 'العراقي',
          username: 'mustafa_iq',
          language_code: 'ar',
        },
        colorScheme: 'dark',
        isReady: true,
      });
    }
  },

  triggerHaptic: (style = 'medium') => {
    const tg = window.Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred(style);
  },
}));

export default useAppStore;
