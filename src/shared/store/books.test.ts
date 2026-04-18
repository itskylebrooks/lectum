import { useBookStore } from "@/shared/store/books";
import { resetStoredBooksForTests } from "@/shared/utils/booksDb";
import { beforeEach, describe, expect, it } from "vitest";

function expectedMonthDate(offset: number) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + offset;
  const day = now.getUTCDate();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEndDay = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, monthEndDay);
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), clampedDay),
  )
    .toISOString()
    .slice(0, 10);
}

describe("book store", () => {
  beforeEach(() => {
    resetStoredBooksForTests();
    useBookStore.setState({
      books: [],
      loading: false,
      initialized: false,
      editorState: { open: false, mode: "create", initialStatus: "next" },
      finishBookId: null,
      deleteBookId: null,
    });
  });

  it("moves a book through next, reading, and finished states", async () => {
    await useBookStore.getState().saveBook({
      title: "Lectum",
      author: "Kyle Brooks",
      publicationYear: 2026,
      format: "print",
      category: "non-fiction",
      isReading: false,
      thumbnailDataUrl: null,
    });

    const created = useBookStore.getState().books[0];
    expect(created?.isReading).toBe(false);
    expect(created?.dateFinished).toBeUndefined();

    await useBookStore.getState().startBook(created!.id);
    expect(useBookStore.getState().books[0]?.isReading).toBe(true);

    await useBookStore.getState().finishBook(created!.id, {
      dateFinished: "2026-04-12",
      rating: "liked",
    });

    const finished = useBookStore.getState().books[0];
    expect(finished?.isReading).toBe(false);
    expect(finished?.rating).toBe("liked");

    await useBookStore.getState().reopenBook(created!.id);
    const reopened = useBookStore.getState().books[0];
    expect(reopened?.isReading).toBe(true);
    expect(reopened?.dateFinished).toBeUndefined();
  });

  it("seeds starter books on first initialize when storage is empty", async () => {
    await useBookStore.getState().initialize();

    const books = useBookStore.getState().books;
    expect(books).toHaveLength(6);

    const reading = books.find(
      (book) => book.id === "starter-reading-the-stranger-max-frei",
    );
    expect(reading?.title).toBe("The Stranger");
    expect(reading?.author).toBe("Max Frei");
    expect(reading?.isReading).toBe(true);

    const finishedThisMonth = books.find(
      (book) => book.id === "starter-finished-master-and-margarita-bulgakov",
    );
    const finishedLastMonth = books.find(
      (book) => book.id === "starter-finished-martin-eden-jack-london",
    );

    expect(finishedThisMonth?.dateFinished).toBe(expectedMonthDate(0));
    expect(finishedThisMonth?.rating).toBe("loved");
    expect(finishedLastMonth?.dateFinished).toBe(expectedMonthDate(-1));
    expect(finishedLastMonth?.rating).toBe("liked");
  });

  it("restores starter books when resetToStarterBooks is called", async () => {
    await useBookStore.getState().saveBook({
      title: "Temporary",
      author: "Temp Author",
      publicationYear: 2025,
      format: "digital",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
    });

    await useBookStore.getState().resetToStarterBooks();

    const books = useBookStore.getState().books;
    expect(books).toHaveLength(6);
    expect(books.some((book) => book.title === "Temporary")).toBe(false);
    expect(books.some((book) => book.title === "Steve Jobs")).toBe(true);
  });
});
