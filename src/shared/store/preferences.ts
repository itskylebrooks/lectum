import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import type { DateFormatMode } from '@/shared/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PreferencesState {
  dateFormat: DateFormatMode;
  setDateFormat: (value: DateFormatMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      dateFormat: 'DMY',
      setDateFormat: (dateFormat) => set({ dateFormat }),
    }),
    {
      name: STORAGE_KEYS.PREFERENCES,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
