import App from "@/App";
import { useBookStore } from "@/shared/store/books";
import { usePreferencesStore } from "@/shared/store/preferences";
import {
  resetStoredBooksForTests,
  saveStoredBook,
} from "@/shared/utils/booksDb";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

describe("App flow", () => {
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
    usePreferencesStore.setState({ dateFormat: "DMY" });
  });

  it("displays books in the library and home pages", async () => {
    await saveStoredBook({
      id: "queued",
      title: "Queued Book",
      author: "Ada Lovelace",
      publicationYear: 2024,
      format: "print",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt: "2026-04-10T12:00:00.000Z",
      updatedAt: "2026-04-10T12:00:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/library"]}>
        <App />
      </MemoryRouter>,
    );

    // Book should appear in library with accessible label
    await screen.findByLabelText(/Open Queued Book/i);
    expect(screen.getByLabelText(/Open Queued Book/i)).toBeInTheDocument();
  });
});
