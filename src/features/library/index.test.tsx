import LibraryPage from "@/features/library";
import { useBookStore } from "@/shared/store/books";
import { usePreferencesStore } from "@/shared/store/preferences";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("LibraryPage", () => {
  beforeEach(() => {
    usePreferencesStore.setState({ dateFormat: "DMY" });
    useBookStore.setState({
      books: [
        {
          id: "finished-1",
          title: "Finished Book",
          author: "Ursula Le Guin",
          publicationYear: 1974,
          format: "print",
          category: "fiction",
          isReading: false,
          dateFinished: "2026-04-15",
          rating: "loved",
          createdAt: "2026-04-01T12:00:00.000Z",
          updatedAt: "2026-04-15T12:00:00.000Z",
          thumbnailDataUrl: null,
        },
      ],
      loading: false,
      initialized: true,
      editorState: { open: false, mode: "create", initialStatus: "next" },
      finishBookId: null,
      deleteBookId: null,
      openCreate: vi.fn(),
      openEdit: vi.fn(),
      closeEditor: vi.fn(),
      openFinish: vi.fn(),
      closeFinish: vi.fn(),
      openDelete: vi.fn(),
      closeDelete: vi.fn(),
      saveBook: vi.fn(),
      finishBook: vi.fn(),
      startBook: vi.fn(),
      reopenBook: vi.fn(),
      deleteBook: vi.fn(),
      initialize: vi.fn(),
      refresh: vi.fn(),
      importBooks: vi.fn(),
    });
  });

  it("renders library page with books and filters", async () => {
    render(<LibraryPage />);

    expect(
      screen.getByRole("button", { name: "All ratings" }),
    ).toBeInTheDocument();

    // Book should be visible and clickable
    const bookButton = screen.getByLabelText(/Open Finished Book/i);
    expect(bookButton).toBeInTheDocument();
  });
});
