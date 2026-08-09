import type {
  BookEditorValues,
  BookFinishValues,
  BookFormStatus,
  BookWithThumbnail,
} from "@/shared/types";
import {
  createBook,
  createStarterBooks,
  finishBook as finishBookRecord,
  reopenBook as reopenBookRecord,
  startBook as startBookRecord,
  updateBook,
} from "@/domain/books";
import { indexedDbBookRepository as bookRepository } from "@/infrastructure/bookRepository";
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
  | { open: true; mode: "edit"; bookId: string; initialStatus: BookFormStatus };

export type LibraryStatus = "idle" | "loading" | "ready" | "error";

interface BookStoreState {
  books: BookWithThumbnail[];
  loading: boolean;
  initialized: boolean;
  status: LibraryStatus;
  error: string | null;
  editorState: EditorState;
  finishBookId: string | null;
  deleteBookId: string | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  openCreate: (initialStatus?: BookFormStatus) => void;
  openEdit: (bookId: string) => void;
  closeEditor: () => void;
  openFinish: (bookId: string) => void;
  closeFinish: () => void;
  openDelete: (bookId: string) => void;
  closeDelete: () => void;
  saveBook: (values: BookEditorValues) => Promise<void>;
  finishBook: (bookId: string, values: BookFinishValues) => Promise<void>;
  startBook: (bookId: string) => Promise<void>;
  reopenBook: (bookId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  importBooks: (books: BookWithThumbnail[]) => Promise<void>;
  resetToStarterBooks: () => Promise<void>;
  watchExternalChanges: () => () => void;
}

function persistenceErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Lectum could not save because browser storage is full.";
  }
  return "Lectum could not access its local data. Please try again.";
}

let initializationPromise: Promise<void> | null = null;

function resolveBook(state: BookStoreState, bookId: string) {
  return state.books.find((book) => book.id === bookId) ?? null;
}

function closeEditorState(): EditorState {
  return { open: false, mode: "create", initialStatus: "next" };
}

function sortBooks(books: BookWithThumbnail[]) {
  return [...books].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function upsertBook(books: BookWithThumbnail[], saved: BookWithThumbnail) {
  return sortBooks([saved, ...books.filter((book) => book.id !== saved.id)]);
}

export const useBookStore = create<BookStoreState>((set, get) => ({
  books: [],
  loading: false,
  initialized: false,
  status: "idle",
  error: null,
  editorState: closeEditorState(),
  finishBookId: null,
  deleteBookId: null,
  initialize: () => {
    if (get().initialized) return Promise.resolve();
    if (initializationPromise) return initializationPromise;

    set({ loading: true, status: "loading", error: null });
    initializationPromise = (async () => {
      try {
        const books = await bookRepository.initialize(createStarterBooks());
        set({
          books,
          loading: false,
          initialized: true,
          status: "ready",
          error: null,
        });
      } catch (error) {
        set({
          loading: false,
          initialized: false,
          status: "error",
          error: persistenceErrorMessage(error),
        });
      } finally {
        initializationPromise = null;
      }
    })();
    return initializationPromise;
  },
  refresh: async () => {
    set({ loading: true, status: "loading", error: null });
    try {
      const books = await bookRepository.list();
      set({
        books,
        loading: false,
        initialized: true,
        status: "ready",
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        status: "error",
        error: persistenceErrorMessage(error),
      });
    }
  },
  openCreate: (initialStatus = "next") =>
    set({
      editorState: { open: true, mode: "create", initialStatus },
    }),
  openEdit: (bookId) => {
    const book = resolveBook(get(), bookId);
    set({
      editorState: {
        open: true,
        mode: "edit",
        bookId,
        initialStatus: book?.isReading ? "reading" : "next",
      },
    });
  },
  closeEditor: () => set({ editorState: closeEditorState() }),
  openFinish: (bookId) => set({ finishBookId: bookId }),
  closeFinish: () => set({ finishBookId: null }),
  openDelete: (bookId) => set({ deleteBookId: bookId }),
  closeDelete: () => set({ deleteBookId: null }),
  saveBook: async (values) => {
    const { editorState } = get();
    const existing =
      editorState.open && editorState.mode === "edit"
        ? resolveBook(get(), editorState.bookId)
        : null;
    const book = existing ? updateBook(existing, values) : createBook(values);
    try {
      const saved = await bookRepository.save(book);
      set((state) => ({
        books: upsertBook(state.books, saved),
        editorState: closeEditorState(),
        initialized: true,
        status: "ready",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  finishBook: async (bookId, values) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    try {
      const saved = await bookRepository.save(
        finishBookRecord(existing, values),
      );
      set((state) => ({
        books: upsertBook(state.books, saved),
        finishBookId: null,
        initialized: true,
        status: "ready",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  startBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;
    const started = startBookRecord(existing);
    if (!started) return;

    try {
      const saved = await bookRepository.save(started);
      set((state) => ({
        books: upsertBook(state.books, saved),
        initialized: true,
        status: "ready",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  reopenBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    try {
      const saved = await bookRepository.save(reopenBookRecord(existing));
      set((state) => ({
        books: upsertBook(state.books, saved),
        initialized: true,
        status: "ready",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  deleteBook: async (bookId) => {
    try {
      await bookRepository.delete(bookId);
      set((state) => ({
        books: state.books.filter((book) => book.id !== bookId),
        deleteBookId: null,
        initialized: true,
        status: "ready",
        error: null,
      }));
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  importBooks: async (books) => {
    try {
      const refreshed = await bookRepository.replaceAll(books);
      set({
        books: refreshed,
        initialized: true,
        status: "ready",
        error: null,
        editorState: closeEditorState(),
        finishBookId: null,
        deleteBookId: null,
      });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  resetToStarterBooks: async () => {
    const starterBooks = createStarterBooks();
    try {
      const stored = await bookRepository.replaceAll(starterBooks);
      set({
        books: stored,
        initialized: true,
        status: "ready",
        error: null,
        editorState: closeEditorState(),
        finishBookId: null,
        deleteBookId: null,
      });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  watchExternalChanges: () =>
    bookRepository.subscribe(() => {
      void get().refresh();
    }),
}));
