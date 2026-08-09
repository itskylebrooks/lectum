import type { BookFormStatus } from "@/shared/types";
import { create } from "zustand";

type EditorState =
  | {
      open: false;
      mode: "create";
      bookId?: undefined;
      initialStatus: BookFormStatus;
    }
  | {
      open: true;
      mode: "create";
      bookId?: undefined;
      initialStatus: BookFormStatus;
    }
  | {
      open: true;
      mode: "edit";
      bookId: string;
      initialStatus: BookFormStatus;
    };

interface BookUiState {
  editorState: EditorState;
  finishBookId: string | null;
  deleteBookId: string | null;
  openCreate: (initialStatus?: BookFormStatus) => void;
  openEdit: (bookId: string) => void;
  closeEditor: () => void;
  openFinish: (bookId: string) => void;
  closeFinish: () => void;
  openDelete: (bookId: string) => void;
  closeDelete: () => void;
  reset: () => void;
}

function initialState(): Pick<
  BookUiState,
  "editorState" | "finishBookId" | "deleteBookId"
> {
  return {
    editorState: { open: false, mode: "create", initialStatus: "next" },
    finishBookId: null,
    deleteBookId: null,
  };
}

export const useBookUiStore = create<BookUiState>((set) => ({
  ...initialState(),
  openCreate: (initialStatus = "next") =>
    set({ editorState: { open: true, mode: "create", initialStatus } }),
  openEdit: (bookId) =>
    set({
      editorState: {
        open: true,
        mode: "edit",
        bookId,
        initialStatus: "next",
      },
    }),
  closeEditor: () => set({ editorState: initialState().editorState }),
  openFinish: (bookId) => set({ finishBookId: bookId }),
  closeFinish: () => set({ finishBookId: null }),
  openDelete: (bookId) => set({ deleteBookId: bookId }),
  closeDelete: () => set({ deleteBookId: null }),
  reset: () => set(initialState()),
}));
