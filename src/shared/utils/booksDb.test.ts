import type { BookWithThumbnail } from "@/shared/types";
import {
  initializeStoredLibrary,
  listStoredBooks,
  replaceStoredBooks,
  resetStoredDatabaseForTests,
  saveStoredBook,
} from "@/shared/utils/booksDb";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const originalIndexedDb = globalThis.indexedDB;

function makeBook(
  id: string,
  thumbnailDataUrl: string | null = null,
): BookWithThumbnail {
  return {
    id,
    title: `Book ${id}`,
    author: "Test Author",
    publicationYear: 2026,
    format: "print",
    category: "fiction",
    isReading: false,
    thumbnailDataUrl,
    createdAt: "2026-08-09T10:00:00.000Z",
    updatedAt: "2026-08-09T10:00:00.000Z",
  };
}

function openRawDatabase(version: number) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("lectum-db", version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function objectStoreCount(storeName: string) {
  const db = await openRawDatabase(2);
  const transaction = db.transaction(storeName, "readonly");
  const request = transaction.objectStore(storeName).count();
  const count = await new Promise<number>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return count;
}

describe("IndexedDB book repository", () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: new IDBFactory(),
    });
    await resetStoredDatabaseForTests();
  });

  afterEach(async () => {
    await resetStoredDatabaseForTests();
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
  });

  it("persists an intentionally empty initialized library", async () => {
    const starter = makeBook("starter");
    expect(await initializeStoredLibrary([starter])).toEqual([starter]);

    await replaceStoredBooks([]);

    expect(await initializeStoredLibrary([starter])).toEqual([]);
    expect(await listStoredBooks()).toEqual([]);
  });

  it("stores book and thumbnail changes atomically without leaving orphan thumbnails", async () => {
    const image = "data:image/png;base64,Y292ZXI=";
    await saveStoredBook(makeBook("cover", image));

    expect((await listStoredBooks())[0]?.thumbnailDataUrl).toBe(image);
    expect(await objectStoreCount("thumbnails")).toBe(1);

    await saveStoredBook(makeBook("cover"));

    expect((await listStoredBooks())[0]?.thumbnailDataUrl).toBeNull();
    expect(await objectStoreCount("thumbnails")).toBe(0);
  });

  it("serializes concurrent writes", async () => {
    await Promise.all([
      saveStoredBook(makeBook("one")),
      saveStoredBook(makeBook("two")),
      saveStoredBook(makeBook("three")),
    ]);

    expect((await listStoredBooks()).map((book) => book.id).sort()).toEqual([
      "one",
      "three",
      "two",
    ]);
  });

  it("rolls back a replacement when one record cannot be cloned", async () => {
    await replaceStoredBooks([makeBook("existing")]);
    const invalid = {
      ...makeBook("invalid"),
      uncloneable: () => undefined,
    } as unknown as BookWithThumbnail;

    await expect(replaceStoredBooks([invalid])).rejects.toBeDefined();

    expect((await listStoredBooks()).map((book) => book.id)).toEqual([
      "existing",
    ]);
  });

  it("migrates a version-one database without replacing existing books", async () => {
    const legacyDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("lectum-db", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("books", { keyPath: "id" });
        request.result.createObjectStore("thumbnails", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = legacyDb.transaction("books", "readwrite");
    transaction.objectStore("books").put(makeBook("legacy"));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    legacyDb.close();

    const books = await initializeStoredLibrary([makeBook("starter")]);

    expect(books.map((book) => book.id)).toEqual(["legacy"]);
    expect(await objectStoreCount("metadata")).toBe(2);
  });
});
