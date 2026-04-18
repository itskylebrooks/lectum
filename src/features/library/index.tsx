import BookDetailsModal from "@/shared/components/books/BookDetailsModal";
import BookThumbnailCard from "@/shared/components/books/BookThumbnailCard";
import DropdownSelect, {
  type DropdownSelectOption,
} from "@/shared/components/inputs/DropdownSelect";
import { useBookStore } from "@/shared/store/books";
import type {
  BookCategory,
  BookFormat,
  BookRating,
  LibrarySort,
} from "@/shared/types";
import { selectFinishedBooks, sortFinishedBooks } from "@/shared/utils/stats";
import { useEffect, useMemo, useState } from "react";

const sortOptions: { value: LibrarySort; label: string }[] = [
  { value: "finishedDesc", label: "Finished ↓" },
  { value: "finishedAsc", label: "Finished ↑" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "publicationYearDesc", label: "Published ↓" },
  { value: "publicationYearAsc", label: "Published ↑" },
];

const ratingOptions: Array<DropdownSelectOption<BookRating | "all">> = [
  { value: "all", label: "All ratings" },
  { value: "loved", label: "Loved" },
  { value: "liked", label: "Liked" },
  { value: "mixed", label: "Mixed" },
  { value: "disliked", label: "Disliked" },
  { value: "abandoned", label: "Abandoned" },
];

const formatOptions: Array<DropdownSelectOption<BookFormat | "all">> = [
  { value: "all", label: "All formats" },
  { value: "print", label: "Print" },
  { value: "digital", label: "Digital" },
  { value: "audiobook", label: "Audiobook" },
];

const categoryOptions: Array<DropdownSelectOption<BookCategory | "all">> = [
  { value: "all", label: "All categories" },
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-fiction" },
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

  useEffect(() => {
    if (selectedBook !== null && selectedBookData === null) {
      setSelectedBook(null);
    }
  }, [selectedBook, selectedBookData]);

  function resetFilters() {
    setRatingFilter("all");
    setFormatFilter("all");
    setCategoryFilter("all");
    setSort("finishedDesc");
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-2xl border border-subtle bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DropdownSelect
            label="Sort"
            value={sort}
            options={sortOptions}
            onChange={(nextSort) => setSort(nextSort)}
          />
          <DropdownSelect
            label="Rating"
            value={ratingFilter}
            options={ratingOptions}
            onChange={(nextRating) => setRatingFilter(nextRating)}
          />
          <DropdownSelect
            label="Format"
            value={formatFilter}
            options={formatOptions}
            onChange={(nextFormat) => setFormatFilter(nextFormat)}
          />
          <DropdownSelect
            label="Category"
            value={categoryFilter}
            options={categoryOptions}
            onChange={(nextCategory) => setCategoryFilter(nextCategory)}
          />
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
          <div className="rounded-2xl border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">
              No finished books match the current filters.
            </p>
            <p className="mt-2 text-sm text-muted">
              Try another filter combination or finish a book from your backlog.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[46rem] flex-wrap justify-center gap-3">
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
