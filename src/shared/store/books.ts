import type {
  BookEditorValues,
  BookFinishValues,
  BookFormStatus,
  BookWithThumbnail,
} from "@/shared/types";
import {
  deleteStoredBook,
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

interface BookStoreState {
  books: BookWithThumbnail[];
  loading: boolean;
  initialized: boolean;
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
  editorState: closeEditorState(),
  finishBookId: null,
  deleteBookId: null,
  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const books = await listStoredBooks();
    if (books.length === 0) {
      const starterBooks = createStarterBooks();
      await replaceStoredBooks(starterBooks);
      set({ books: starterBooks, loading: false, initialized: true });
      return;
    }
    set({ books, loading: false, initialized: true });
  },
  refresh: async () => {
    set({ loading: true });
    const books = await listStoredBooks();
    set({ books, loading: false, initialized: true });
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
    await saveStoredBook(book);
    const books = await listStoredBooks();
    set({ books, editorState: closeEditorState(), initialized: true });
  },
  finishBook: async (bookId, values) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    await saveStoredBook({
      ...existing,
      isReading: false,
      dateFinished: values.dateFinished,
      rating: values.rating,
      updatedAt: nowIso(),
    });

    const books = await listStoredBooks();
    set({ books, finishBookId: null, initialized: true });
  },
  startBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing || existing.dateFinished) return;

    await saveStoredBook({
      ...existing,
      isReading: true,
      updatedAt: nowIso(),
    });

    const books = await listStoredBooks();
    set({ books, initialized: true });
  },
  reopenBook: async (bookId) => {
    const existing = resolveBook(get(), bookId);
    if (!existing) return;

    await saveStoredBook({
      ...existing,
      isReading: true,
      dateFinished: undefined,
      rating: undefined,
      updatedAt: nowIso(),
    });

    const books = await listStoredBooks();
    set({ books, initialized: true });
  },
  deleteBook: async (bookId) => {
    await deleteStoredBook(bookId);
    const books = await listStoredBooks();
    set({ books, deleteBookId: null, initialized: true });
  },
  importBooks: async (books) => {
    await replaceStoredBooks(books);
    const refreshed = await listStoredBooks();
    set({
      books: refreshed,
      initialized: true,
      editorState: closeEditorState(),
      finishBookId: null,
      deleteBookId: null,
    });
  },
  resetToStarterBooks: async () => {
    const starterBooks = createStarterBooks();
    await replaceStoredBooks(starterBooks);
    set({
      books: starterBooks,
      initialized: true,
      editorState: closeEditorState(),
      finishBookId: null,
      deleteBookId: null,
    });
  },
}));
