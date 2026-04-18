import BookDetailsModal from "@/shared/components/books/BookDetailsModal";
import BookThumbnailCard from "@/shared/components/books/BookThumbnailCard";
import { useBookStore } from "@/shared/store/books";
import type {
  BookCategory,
  BookFormat,
  BookRating,
  LibrarySort,
} from "@/shared/types";
import { selectFinishedBooks, sortFinishedBooks } from "@/shared/utils/stats";
import { useMemo, useState } from "react";

const sortOptions: { value: LibrarySort; label: string }[] = [
  { value: "finishedDesc", label: "Finished date ↓" },
  { value: "finishedAsc", label: "Finished date ↑" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "publicationYearDesc", label: "Publication year ↓" },
  { value: "publicationYearAsc", label: "Publication year ↑" },
];

export default function LibraryPage() {
  const books = useBookStore((state) => state.books);
  const openEdit = useBookStore((state) => state.openEdit);
  const openFinish = useBookStore((state) => state.openFinish);
  const startBook = useBookStore((state) => state.startBook);
  const reopenBook = useBookStore((state) => state.reopenBook);
  const openDelete = useBookStore((state) => state.openDelete);
  const [ratingFilter, setRatingFilter] = useState<BookRating | "all">("all");
  const [formatFilter, setFormatFilter] = useState<BookFormat | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | "all">(
    "all",
  );
  const [sort, setSort] = useState<LibrarySort>("finishedDesc");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    return sortFinishedBooks(selectFinishedBooks(books), sort).filter(
      (book) => {
        if (ratingFilter !== "all" && book.rating !== ratingFilter)
          return false;
        if (formatFilter !== "all" && book.format !== formatFilter)
          return false;
        if (categoryFilter !== "all" && book.category !== categoryFilter)
          return false;
        return true;
      },
    );
  }, [books, categoryFilter, formatFilter, ratingFilter, sort]);
  const activeFilterCount = [ratingFilter, formatFilter, categoryFilter].filter(
    (value) => value !== "all",
  ).length;

  const selectedBookData = books.find((b) => b.id === selectedBook) ?? null;

  function resetFilters() {
    setRatingFilter("all");
    setFormatFilter("all");
    setCategoryFilter("all");
    setSort("finishedDesc");
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-[1.75rem] border border-subtle bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as LibrarySort)}
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(event.target.value as BookRating | "all")
            }
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            <option value="all">All ratings</option>
            <option value="loved">Loved</option>
            <option value="liked">Liked</option>
            <option value="mixed">Mixed</option>
            <option value="disliked">Disliked</option>
            <option value="abandoned">Abandoned</option>
          </select>
          <select
            value={formatFilter}
            onChange={(event) =>
              setFormatFilter(event.target.value as BookFormat | "all")
            }
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            <option value="all">All formats</option>
            <option value="print">Print</option>
            <option value="digital">Digital</option>
            <option value="audiobook">Audiobook</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as BookCategory | "all")
            }
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            <option value="all">All categories</option>
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-fiction</option>
          </select>
        </div>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl border border-subtle px-4 py-3 text-sm text-strong hover-nonaccent"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        ) : null}
      </section>

      <section className="space-y-4">
        {filteredBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">
              No finished books match the current filters.
            </p>
            <p className="mt-2 text-sm text-muted">
              Try another filter combination or finish a book from your backlog.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {filteredBooks.map((book) => (
              <BookThumbnailCard
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book.id)}
              />
            ))}
          </div>
        )}
      </section>

      <BookDetailsModal
        open={selectedBook !== null}
        book={selectedBookData}
        onClose={() => setSelectedBook(null)}
        onEdit={openEdit}
        onFinish={openFinish}
        onReopen={reopenBook}
        onDelete={openDelete}
        onStartReading={startBook}
      />
    </div>
  );
}
