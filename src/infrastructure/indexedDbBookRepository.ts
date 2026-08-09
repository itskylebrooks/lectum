import type { BookRepository } from "@/application/bookRepository";
import type { BookRecord, BookWithThumbnail } from "@/shared/types";

type StoredThumbnail = {
  id: string;
  dataUrl: string;
};

type StoredMetadata = {
  key: string;
  value: number | boolean | string;
};

const DB_NAME = "lectum-db";
const DB_VERSION = 2;
const BOOKS_STORE = "books";
const THUMBNAILS_STORE = "thumbnails";
const METADATA_STORE = "metadata";
const LIBRARY_INITIALIZED_KEY = "library-initialized";
const SCHEMA_VERSION_KEY = "schema-version";
const CHANGES_CHANNEL = "lectum-book-changes";

const memoryBooks = new Map<string, BookRecord>();
const memoryThumbnails = new Map<string, string>();
let memoryLibraryInitialized = false;
let databasePromise: Promise<IDBDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let changesChannel: BroadcastChannel | null = null;

function supportsIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB aborted"));
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
        db.createObjectStore(THUMBNAILS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("IndexedDB upgrade was blocked by another tab"));
    };
  });
  return databasePromise;
}

function enqueueWrite<T>(operation: () => Promise<T> | T) {
  const pending = writeQueue.then(operation, operation);
  writeQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

function getChangesChannel() {
  if (
    typeof window === "undefined" ||
    typeof window.BroadcastChannel === "undefined"
  ) {
    return null;
  }
  changesChannel ??= new window.BroadcastChannel(CHANGES_CHANNEL);
  return changesChannel;
}

function publishStoredBookChange() {
  getChangesChannel()?.postMessage({ type: "books-changed" });
}

function normalizeBookForStorage(book: BookWithThumbnail): BookRecord {
  const normalized = { ...book } as BookRecord & {
    thumbnailDataUrl?: string | null;
  };
  delete normalized.thumbnailDataUrl;
  return normalized;
}

function sortBooks(books: BookWithThumbnail[]) {
  return [...books].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

async function listFromIndexedDb() {
  const db = await openDatabase();
  const transaction = db.transaction(
    [BOOKS_STORE, THUMBNAILS_STORE],
    "readonly",
  );
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);

  const books = await requestToPromise(bookStore.getAll());
  const thumbnails = (await requestToPromise(
    thumbnailStore.getAll(),
  )) as StoredThumbnail[];
  await transactionDone(transaction);

  const thumbnailsById = new Map(
    thumbnails.map((thumbnail) => [thumbnail.id, thumbnail.dataUrl]),
  );
  return sortBooks(
    (books as BookRecord[]).map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailId
        ? (thumbnailsById.get(book.thumbnailId) ?? null)
        : null,
    })),
  );
}

function listFromMemory() {
  return sortBooks(
    [...memoryBooks.values()].map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailId
        ? (memoryThumbnails.get(book.thumbnailId) ?? null)
        : null,
    })),
  );
}

function mergeBooksWithThumbnails(
  books: BookRecord[],
  thumbnails: StoredThumbnail[],
) {
  const thumbnailsById = new Map(
    thumbnails.map((thumbnail) => [thumbnail.id, thumbnail.dataUrl]),
  );
  return sortBooks(
    books.map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailId
        ? (thumbnailsById.get(book.thumbnailId) ?? null)
        : null,
    })),
  );
}

async function initializeIntoIndexedDb(starterBooks: BookWithThumbnail[]) {
  const db = await openDatabase();
  const transaction = db.transaction(
    [BOOKS_STORE, THUMBNAILS_STORE, METADATA_STORE],
    "readwrite",
  );
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);
  const metadataStore = transaction.objectStore(METADATA_STORE);

  const initialized = (await requestToPromise(
    metadataStore.get(LIBRARY_INITIALIZED_KEY),
  )) as StoredMetadata | undefined;
  let books = (await requestToPromise(bookStore.getAll())) as BookRecord[];

  if (!initialized) {
    if (books.length === 0) {
      for (const book of starterBooks) {
        const thumbnailId = book.thumbnailDataUrl
          ? (book.thumbnailId ?? `thumbnail:${book.id}`)
          : undefined;
        bookStore.put(normalizeBookForStorage({ ...book, thumbnailId }));
        if (thumbnailId && book.thumbnailDataUrl) {
          thumbnailStore.put({
            id: thumbnailId,
            dataUrl: book.thumbnailDataUrl,
          });
        }
      }
      books = starterBooks.map(normalizeBookForStorage);
    }
    metadataStore.put({ key: LIBRARY_INITIALIZED_KEY, value: true });
  }
  metadataStore.put({ key: SCHEMA_VERSION_KEY, value: DB_VERSION });

  const thumbnails = (await requestToPromise(
    thumbnailStore.getAll(),
  )) as StoredThumbnail[];
  await transactionDone(transaction);
  return mergeBooksWithThumbnails(books, thumbnails);
}

function initializeIntoMemory(starterBooks: BookWithThumbnail[]) {
  if (!memoryLibraryInitialized) {
    if (memoryBooks.size === 0) replaceIntoMemory(starterBooks);
    memoryLibraryInitialized = true;
  }
  return listFromMemory();
}

export async function initializeStoredLibrary(
  starterBooks: BookWithThumbnail[],
) {
  return enqueueWrite(async () => {
    if (!supportsIndexedDb()) return initializeIntoMemory(starterBooks);
    return initializeIntoIndexedDb(starterBooks);
  });
}

export async function listStoredBooks() {
  await writeQueue;
  if (!supportsIndexedDb()) return listFromMemory();
  return listFromIndexedDb();
}

async function putIntoIndexedDb(book: BookWithThumbnail) {
  const db = await openDatabase();
  const transaction = db.transaction(
    [BOOKS_STORE, THUMBNAILS_STORE],
    "readwrite",
  );
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);

  const thumbnailId = book.thumbnailDataUrl
    ? (book.thumbnailId ?? `thumbnail:${book.id}`)
    : undefined;
  const previous = (await requestToPromise(bookStore.get(book.id))) as
    | BookRecord
    | undefined;

  if (previous?.thumbnailId && previous.thumbnailId !== thumbnailId) {
    thumbnailStore.delete(previous.thumbnailId);
  }

  if (thumbnailId && book.thumbnailDataUrl) {
    thumbnailStore.put({ id: thumbnailId, dataUrl: book.thumbnailDataUrl });
  } else if (previous?.thumbnailId) {
    thumbnailStore.delete(previous.thumbnailId);
  }

  bookStore.put(
    normalizeBookForStorage({
      ...book,
      thumbnailId,
    }),
  );

  await transactionDone(transaction);
  return {
    ...book,
    thumbnailId,
    thumbnailDataUrl: book.thumbnailDataUrl ?? null,
  } satisfies BookWithThumbnail;
}

function putIntoMemory(book: BookWithThumbnail) {
  const thumbnailId = book.thumbnailDataUrl
    ? (book.thumbnailId ?? `thumbnail:${book.id}`)
    : undefined;
  const previous = memoryBooks.get(book.id);

  if (previous?.thumbnailId && previous.thumbnailId !== thumbnailId) {
    memoryThumbnails.delete(previous.thumbnailId);
  }

  if (thumbnailId && book.thumbnailDataUrl) {
    memoryThumbnails.set(thumbnailId, book.thumbnailDataUrl);
  } else if (previous?.thumbnailId) {
    memoryThumbnails.delete(previous.thumbnailId);
  }

  const stored: BookRecord = {
    ...normalizeBookForStorage(book),
    thumbnailId,
  };
  memoryBooks.set(stored.id, stored);
  return {
    ...stored,
    thumbnailDataUrl: book.thumbnailDataUrl ?? null,
  } satisfies BookWithThumbnail;
}

export async function saveStoredBook(book: BookWithThumbnail) {
  return enqueueWrite(async () => {
    const saved = !supportsIndexedDb()
      ? putIntoMemory(book)
      : await putIntoIndexedDb(book);
    publishStoredBookChange();
    return saved;
  });
}

async function deleteFromIndexedDb(bookId: string) {
  const db = await openDatabase();
  const transaction = db.transaction(
    [BOOKS_STORE, THUMBNAILS_STORE],
    "readwrite",
  );
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);
  const existing = (await requestToPromise(bookStore.get(bookId))) as
    | BookRecord
    | undefined;

  if (existing?.thumbnailId) {
    thumbnailStore.delete(existing.thumbnailId);
  }
  bookStore.delete(bookId);

  await transactionDone(transaction);
}

function deleteFromMemory(bookId: string) {
  const existing = memoryBooks.get(bookId);
  if (existing?.thumbnailId) {
    memoryThumbnails.delete(existing.thumbnailId);
  }
  memoryBooks.delete(bookId);
}

export async function deleteStoredBook(bookId: string) {
  return enqueueWrite(async () => {
    if (!supportsIndexedDb()) {
      deleteFromMemory(bookId);
    } else {
      await deleteFromIndexedDb(bookId);
    }
    publishStoredBookChange();
  });
}

async function replaceIntoIndexedDb(books: BookWithThumbnail[]) {
  const db = await openDatabase();
  const transaction = db.transaction(
    [BOOKS_STORE, THUMBNAILS_STORE, METADATA_STORE],
    "readwrite",
  );
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);
  const metadataStore = transaction.objectStore(METADATA_STORE);
  const completion = transactionDone(transaction);

  try {
    bookStore.clear();
    thumbnailStore.clear();

    for (const book of books) {
      const thumbnailId = book.thumbnailDataUrl
        ? (book.thumbnailId ?? `thumbnail:${book.id}`)
        : undefined;
      bookStore.put(
        normalizeBookForStorage({
          ...book,
          thumbnailId,
        }),
      );
      if (thumbnailId && book.thumbnailDataUrl) {
        thumbnailStore.put({ id: thumbnailId, dataUrl: book.thumbnailDataUrl });
      }
    }
    metadataStore.put({ key: LIBRARY_INITIALIZED_KEY, value: true });
    metadataStore.put({ key: SCHEMA_VERSION_KEY, value: DB_VERSION });

    await completion;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // The transaction may already have aborted because of the original error.
    }
    await completion.catch(() => undefined);
    throw error;
  }
  return sortBooks(
    books.map((book) => ({
      ...book,
      thumbnailId: book.thumbnailDataUrl
        ? (book.thumbnailId ?? `thumbnail:${book.id}`)
        : undefined,
      thumbnailDataUrl: book.thumbnailDataUrl ?? null,
    })),
  );
}

function replaceIntoMemory(books: BookWithThumbnail[]) {
  memoryBooks.clear();
  memoryThumbnails.clear();

  for (const book of books) {
    const thumbnailId = book.thumbnailDataUrl
      ? (book.thumbnailId ?? `thumbnail:${book.id}`)
      : undefined;
    memoryBooks.set(book.id, {
      ...normalizeBookForStorage(book),
      thumbnailId,
    });
    if (thumbnailId && book.thumbnailDataUrl) {
      memoryThumbnails.set(thumbnailId, book.thumbnailDataUrl);
    }
  }
  memoryLibraryInitialized = true;
  return listFromMemory();
}

export async function replaceStoredBooks(books: BookWithThumbnail[]) {
  return enqueueWrite(async () => {
    const stored = !supportsIndexedDb()
      ? replaceIntoMemory(books)
      : await replaceIntoIndexedDb(books);
    publishStoredBookChange();
    return stored;
  });
}

export function subscribeToStoredBookChanges(onChange: () => void) {
  const channel = getChangesChannel();
  if (!channel) return () => undefined;

  const listener = (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === "books-changed") onChange();
  };
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}

export function resetStoredBooksForTests() {
  memoryBooks.clear();
  memoryThumbnails.clear();
  memoryLibraryInitialized = false;
  writeQueue = Promise.resolve();
}

export async function resetStoredDatabaseForTests() {
  await writeQueue;
  const db = databasePromise ? await databasePromise.catch(() => null) : null;
  db?.close();
  databasePromise = null;
  changesChannel?.close();
  changesChannel = null;
  resetStoredBooksForTests();

  if (!supportsIndexedDb()) return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to reset IndexedDB"));
    request.onblocked = () => reject(new Error("IndexedDB reset was blocked"));
  });
}

export const indexedDbBookRepository: BookRepository = {
  initialize: initializeStoredLibrary,
  list: listStoredBooks,
  save: saveStoredBook,
  delete: deleteStoredBook,
  replaceAll: replaceStoredBooks,
  subscribe: subscribeToStoredBookChanges,
};
