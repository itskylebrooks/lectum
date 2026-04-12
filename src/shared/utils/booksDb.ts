import type { BookRecord, BookWithThumbnail } from '@/shared/types';

type StoredThumbnail = {
  id: string;
  dataUrl: string;
};

const DB_NAME = 'lectum-db';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';
const THUMBNAILS_STORE = 'thumbnails';

const memoryBooks = new Map<string, BookRecord>();
const memoryThumbnails = new Map<string, string>();

function supportsIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB aborted'));
  });
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
        db.createObjectStore(THUMBNAILS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function normalizeBookForStorage(book: BookWithThumbnail): BookRecord {
  const normalized = { ...book } as BookRecord & { thumbnailDataUrl?: string | null };
  delete normalized.thumbnailDataUrl;
  return normalized;
}

function sortBooks(books: BookWithThumbnail[]) {
  return [...books].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

async function listFromIndexedDb() {
  const db = await openDatabase();
  const transaction = db.transaction([BOOKS_STORE, THUMBNAILS_STORE], 'readonly');
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);

  const books = await requestToPromise(bookStore.getAll());
  const thumbnails = (await requestToPromise(thumbnailStore.getAll())) as StoredThumbnail[];
  await transactionDone(transaction);

  const thumbnailsById = new Map(thumbnails.map((thumbnail) => [thumbnail.id, thumbnail.dataUrl]));
  return sortBooks(
    (books as BookRecord[]).map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailId ? thumbnailsById.get(book.thumbnailId) ?? null : null,
    })),
  );
}

function listFromMemory() {
  return sortBooks(
    [...memoryBooks.values()].map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailId ? memoryThumbnails.get(book.thumbnailId) ?? null : null,
    })),
  );
}

export async function listStoredBooks() {
  if (!supportsIndexedDb()) return listFromMemory();
  return listFromIndexedDb();
}

async function putIntoIndexedDb(book: BookWithThumbnail) {
  const db = await openDatabase();
  const transaction = db.transaction([BOOKS_STORE, THUMBNAILS_STORE], 'readwrite');
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);

  const thumbnailId = book.thumbnailDataUrl ? book.thumbnailId ?? `thumbnail:${book.id}` : undefined;
  const previous = (await requestToPromise(bookStore.get(book.id))) as BookRecord | undefined;

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
  const thumbnailId = book.thumbnailDataUrl ? book.thumbnailId ?? `thumbnail:${book.id}` : undefined;
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
  return { ...stored, thumbnailDataUrl: book.thumbnailDataUrl ?? null } satisfies BookWithThumbnail;
}

export async function saveStoredBook(book: BookWithThumbnail) {
  if (!supportsIndexedDb()) return putIntoMemory(book);
  return putIntoIndexedDb(book);
}

async function deleteFromIndexedDb(bookId: string) {
  const db = await openDatabase();
  const transaction = db.transaction([BOOKS_STORE, THUMBNAILS_STORE], 'readwrite');
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);
  const existing = (await requestToPromise(bookStore.get(bookId))) as BookRecord | undefined;

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
  if (!supportsIndexedDb()) {
    deleteFromMemory(bookId);
    return;
  }

  await deleteFromIndexedDb(bookId);
}

async function replaceIntoIndexedDb(books: BookWithThumbnail[]) {
  const db = await openDatabase();
  const transaction = db.transaction([BOOKS_STORE, THUMBNAILS_STORE], 'readwrite');
  const bookStore = transaction.objectStore(BOOKS_STORE);
  const thumbnailStore = transaction.objectStore(THUMBNAILS_STORE);

  bookStore.clear();
  thumbnailStore.clear();

  for (const book of books) {
    const thumbnailId = book.thumbnailDataUrl ? book.thumbnailId ?? `thumbnail:${book.id}` : undefined;
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

  await transactionDone(transaction);
}

function replaceIntoMemory(books: BookWithThumbnail[]) {
  memoryBooks.clear();
  memoryThumbnails.clear();

  for (const book of books) {
    const thumbnailId = book.thumbnailDataUrl ? book.thumbnailId ?? `thumbnail:${book.id}` : undefined;
    memoryBooks.set(book.id, {
      ...normalizeBookForStorage(book),
      thumbnailId,
    });
    if (thumbnailId && book.thumbnailDataUrl) {
      memoryThumbnails.set(thumbnailId, book.thumbnailDataUrl);
    }
  }
}

export async function replaceStoredBooks(books: BookWithThumbnail[]) {
  if (!supportsIndexedDb()) {
    replaceIntoMemory(books);
    return;
  }

  await replaceIntoIndexedDb(books);
}

export function resetStoredBooksForTests() {
  memoryBooks.clear();
  memoryThumbnails.clear();
}
