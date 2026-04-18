import BookBadge from "@/shared/components/books/BookBadge";
import BookCard from "@/shared/components/books/BookCard";
import { useBookStore } from "@/shared/store/books";
import { useLibraryUiStore } from "@/shared/store/libraryUi";
import { usePreferencesStore } from "@/shared/store/preferences";
import type {
  BookCategory,
  BookFormat,
  BookRating,
  LibrarySort,
} from "@/shared/types";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
  formatBookRatingLabel,
  RATING_META,
} from "@/shared/utils/bookPresentation";
import { formatDisplayDate } from "@/shared/utils/date";
import {
  selectFinishedBooks,
  selectNextBooks,
  sortFinishedBooks,
} from "@/shared/utils/stats";
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
  const startBook = useBookStore((state) => state.startBook);
  const reopenBook = useBookStore((state) => state.reopenBook);
  const openDelete = useBookStore((state) => state.openDelete);
  const dateFormat = usePreferencesStore((state) => state.dateFormat);
  const [ratingFilter, setRatingFilter] = useState<BookRating | "all">("all");
  const [formatFilter, setFormatFilter] = useState<BookFormat | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | "all">(
    "all",
  );
  const [sort, setSort] = useState<LibrarySort>("finishedDesc");
  const filtersOpen = useLibraryUiStore((state) => state.filtersOpen);

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

  const nextBooks = useMemo(() => selectNextBooks(books), [books]);
  const activeFilterCount = [ratingFilter, formatFilter, categoryFilter].filter(
    (value) => value !== "all",
  ).length;

  function resetFilters() {
    setRatingFilter("all");
    setFormatFilter("all");
    setCategoryFilter("all");
    setSort("finishedDesc");
  }

  return (
    <div className="mt-4 space-y-4">
      {filtersOpen ? (
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
      ) : null}

      <section className="space-y-4">
        <div className="text-center uppercase tracking-wider text-sm md:text-base font-semibold text-muted">
          BACKLOG
        </div>

        {nextBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">
              Nothing waiting in your backlog.
            </p>
          </div>
        ) : (
          nextBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              badges={
                <>
                  <BookBadge tone="neutral">
                    {formatBookFormatLabel(book.format)}
                  </BookBadge>
                  <BookBadge tone="soft">
                    {formatBookCategoryLabel(book.category)}
                  </BookBadge>
                  <BookBadge tone="soft">{book.publicationYear}</BookBadge>
                </>
              }
              actions={
                <>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => void startBook(book.id)}
                  >
                    Start reading
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => openEdit(book.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-danger hover:bg-danger hover:text-inverse"
                    onClick={() => openDelete(book.id)}
                  >
                    Delete
                  </button>
                </>
              }
            />
          ))
        )}
      </section>

      <section className="space-y-4">
        <div className="text-center uppercase tracking-wider text-sm md:text-base font-semibold text-muted">
          FINISHED
        </div>

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
          filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              badges={
                <>
                  <BookBadge tone={RATING_META[book.rating].tone}>
                    {formatBookRatingLabel(book.rating)}
                  </BookBadge>
                  <BookBadge tone="neutral">
                    {formatBookFormatLabel(book.format)}
                  </BookBadge>
                  <BookBadge tone="soft">
                    {formatBookCategoryLabel(book.category)}
                  </BookBadge>
                </>
              }
              actions={
                <>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => openEdit(book.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => void reopenBook(book.id)}
                  >
                    Reopen
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-danger hover:bg-danger hover:text-inverse"
                    onClick={() => openDelete(book.id)}
                  >
                    Delete
                  </button>
                </>
              }
              footer={
                <div className="space-y-1 text-sm text-muted">
                  <p>
                    Finished {formatDisplayDate(book.dateFinished, dateFormat)}
                  </p>
                  <p>Published {book.publicationYear}</p>
                </div>
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
