import type {
  BookEditorValues,
  BookFinishValues,
  BookFormStatus,
  BookWithThumbnail,
} from "@/shared/types";
import {
  deleteStoredBook,
  initializeStoredLibrary,
  listStoredBooks,
  replaceStoredBooks,
  saveStoredBook,
} from "@/shared/utils/booksDb";
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
}

function nowIso() {
  return new Date().toISOString();
}

function persistenceErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Lectum could not save because browser storage is full.";
  }
  return "Lectum could not access its local data. Please try again.";
}

let initializationPromise: Promise<void> | null = null;

function makeId() {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `book:${Math.random().toString(36).slice(2, 10)}`;
}

function resolveBook(state: BookStoreState, bookId: string) {
  return state.books.find((book) => book.id === bookId) ?? null;
}

function createBaseBook(values: BookEditorValues): BookWithThumbnail {
  const timestamp = nowIso();
  return {
    id: makeId(),
    title: values.title.trim(),
    author: values.author.trim(),
    publicationYear: values.publicationYear,
    format: values.format,
    category: values.category,
    thumbnailDataUrl: values.thumbnailDataUrl ?? null,
    isReading: values.isReading,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function updateBookFromValues(
  existing: BookWithThumbnail,
  values: BookEditorValues,
): BookWithThumbnail {
  return {
    ...existing,
    title: values.title.trim(),
    author: values.author.trim(),
    publicationYear: values.publicationYear,
    format: values.format,
    category: values.category,
    thumbnailDataUrl: values.thumbnailDataUrl ?? null,
    isReading: existing.dateFinished ? false : values.isReading,
    updatedAt: nowIso(),
  };
}

function closeEditorState(): EditorState {
  return { open: false, mode: "create", initialStatus: "next" };
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthRelativeDate(base: Date, monthOffset: number) {
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + monthOffset;
  const day = base.getUTCDate();

  const monthStart = new Date(Date.UTC(year, month, 1));
  const maxDay = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, maxDay);

  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), clampedDay),
  );
}

function createStarterBooks(now = new Date()): BookWithThumbnail[] {
  const thisMonthFinished = isoDate(monthRelativeDate(now, 0));
  const lastMonthFinished = isoDate(monthRelativeDate(now, -1));
  const createdAt = now.toISOString();

  return [
    {
      id: "starter-reading-the-stranger-max-frei",
      title: "The Stranger",
      author: "Max Frei",
      publicationYear: 1996,
      format: "print",
      category: "fiction",
      isReading: true,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-steve-jobs-walter-isaacson",
      title: "Steve Jobs",
      author: "Walter Isaacson",
      publicationYear: 2011,
      format: "print",
      category: "non-fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-the-da-vinci-code-dan-brown",
      title: "The Da Vinci Code",
      author: "Dan Brown",
      publicationYear: 2003,
      format: "print",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-1984-george-orwell",
      title: "1984",
      author: "George Orwell",
      publicationYear: 1949,
      format: "print",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-finished-master-and-margarita-bulgakov",
      title: "The Master and Margarita",
      author: "Mikhail Bulgakov",
      publicationYear: 1966,
      format: "print",
      category: "fiction",
      isReading: false,
      dateFinished: thisMonthFinished,
      rating: "loved",
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-finished-martin-eden-jack-london",
      title: "Martin Eden",
      author: "Jack London",
      publicationYear: 1908,
      format: "print",
      category: "fiction",
      isReading: false,
      dateFinished: lastMonthFinished,
      rating: "liked",
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
  ];
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
        const books = await initializeStoredLibrary(createStarterBooks());
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
      const books = await listStoredBooks();
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
    const book = existing
      ? updateBookFromValues(existing, values)
      : createBaseBook(values);
    try {
      await saveStoredBook(book);
      const books = await listStoredBooks();
      set({
        books,
        editorState: closeEditorState(),
        initialized: true,
        status: "ready",
        error: null,
      });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  finishBook: async (bookId, values) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    try {
      await saveStoredBook({
        ...existing,
        isReading: false,
        dateFinished: values.dateFinished,
        rating: values.rating,
        updatedAt: nowIso(),
      });

      const books = await listStoredBooks();
      set({
        books,
        finishBookId: null,
        initialized: true,
        status: "ready",
        error: null,
      });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  startBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing || existing.dateFinished) return;

    try {
      await saveStoredBook({
        ...existing,
        isReading: true,
        updatedAt: nowIso(),
      });

      const books = await listStoredBooks();
      set({ books, initialized: true, status: "ready", error: null });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  reopenBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    try {
      await saveStoredBook({
        ...existing,
        isReading: true,
        dateFinished: undefined,
        rating: undefined,
        updatedAt: nowIso(),
      });

      const books = await listStoredBooks();
      set({ books, initialized: true, status: "ready", error: null });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  deleteBook: async (bookId) => {
    try {
      await deleteStoredBook(bookId);
      const books = await listStoredBooks();
      set({
        books,
        deleteBookId: null,
        initialized: true,
        status: "ready",
        error: null,
      });
    } catch (error) {
      set({ status: "error", error: persistenceErrorMessage(error) });
      throw error;
    }
  },
  importBooks: async (books) => {
    try {
      await replaceStoredBooks(books);
      const refreshed = await listStoredBooks();
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
      await replaceStoredBooks(starterBooks);
      set({
        books: starterBooks,
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
}));
