import BookCard from '@/shared/components/books/BookCard';
import { useBookStore } from '@/shared/store/books';
import { usePreferencesStore } from '@/shared/store/preferences';
import type { BookCategory, BookFormat, BookRating, LibrarySort } from '@/shared/types';
import { formatDisplayDate } from '@/shared/utils/date';
import { selectFinishedBooks, selectNextBooks, sortFinishedBooks } from '@/shared/utils/stats';
import { useMemo, useState } from 'react';

const sortOptions: { value: LibrarySort; label: string }[] = [
  { value: 'finishedDesc', label: 'Finished date ↓' },
  { value: 'finishedAsc', label: 'Finished date ↑' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'publicationYearDesc', label: 'Publication year ↓' },
  { value: 'publicationYearAsc', label: 'Publication year ↑' },
];

export default function LibraryPage() {
  const books = useBookStore((state) => state.books);
  const openCreate = useBookStore((state) => state.openCreate);
  const openEdit = useBookStore((state) => state.openEdit);
  const startBook = useBookStore((state) => state.startBook);
  const reopenBook = useBookStore((state) => state.reopenBook);
  const openDelete = useBookStore((state) => state.openDelete);
  const dateFormat = usePreferencesStore((state) => state.dateFormat);
  const [ratingFilter, setRatingFilter] = useState<BookRating | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<BookFormat | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | 'all'>('all');
  const [sort, setSort] = useState<LibrarySort>('finishedDesc');

  const filteredBooks = useMemo(() => {
    return sortFinishedBooks(selectFinishedBooks(books), sort).filter((book) => {
      if (ratingFilter !== 'all' && book.rating !== ratingFilter) return false;
      if (formatFilter !== 'all' && book.format !== formatFilter) return false;
      if (categoryFilter !== 'all' && book.category !== categoryFilter) return false;
      return true;
    });
  }, [books, categoryFilter, formatFilter, ratingFilter, sort]);

  const nextBooks = useMemo(() => selectNextBooks(books), [books]);

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-[1.75rem] border border-subtle bg-surface p-5">
        <h1 className="text-2xl font-semibold text-strong">Library</h1>
        <p className="mt-2 text-sm text-muted">
          Finished books and your unread backlog, kept together in one quiet place.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            onChange={(event) => setRatingFilter(event.target.value as BookRating | 'all')}
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
            onChange={(event) => setFormatFilter(event.target.value as BookFormat | 'all')}
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            <option value="all">All formats</option>
            <option value="print">Print</option>
            <option value="digital">Digital</option>
            <option value="audiobook">Audiobook</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as BookCategory | 'all')}
            className="rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong"
          >
            <option value="all">All categories</option>
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-fiction</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-strong">Next</h2>
              <p className="mt-2 text-sm text-muted">
                Your backlog, without a separate page.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-inverse hover-accent-fade"
              onClick={() => openCreate('next')}
            >
              Add to backlog
            </button>
          </div>
        </div>

        {nextBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">Nothing waiting in your backlog.</p>
            <p className="mt-2 text-sm text-muted">
              Add a book here when you want to remember it without starting it yet.
            </p>
          </div>
        ) : (
          nextBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              meta={
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-soft">
                  <span>{book.format}</span>
                  <span>{book.category}</span>
                  <span>{book.publicationYear}</span>
                </div>
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
                    className="rounded-xl bg-accent px-3 py-2 text-sm text-inverse hover-accent-fade"
                    onClick={() => void startBook(book.id)}
                  >
                    Start reading
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
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-xl font-semibold text-strong">Finished</h2>
          <p className="mt-2 text-sm text-muted">
            Filter by what it was, how it landed, and when you finished it.
          </p>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">No finished books match the current filters.</p>
            <p className="mt-2 text-sm text-muted">Try another filter combination or finish a book from your backlog.</p>
          </div>
        ) : (
          filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              meta={
                <div className="space-y-2 text-sm text-muted">
                  <p>
                    {book.rating} · {book.format} · {book.category}
                  </p>
                  <p>
                    Finished {formatDisplayDate(book.dateFinished, dateFormat)} · Published {book.publicationYear}
                  </p>
                </div>
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
            />
          ))
        )}
      </section>
    </div>
  );
}
