import { create } from 'zustand';

interface LibraryUiState {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  toggleFilters: () => void;
}

export const useLibraryUiStore = create<LibraryUiState>((set) => ({
  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),
  toggleFilters: () => set((state) => ({ filtersOpen: !state.filtersOpen })),
}));
