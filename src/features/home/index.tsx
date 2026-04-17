import BookCard from '@/shared/components/books/BookCard';
import StatCard from '@/shared/components/layout/StatCard';
import { useBookStore } from '@/shared/store/books';
import { usePreferencesStore } from '@/shared/store/preferences';
import { formatDisplayDate } from '@/shared/utils/date';
import {
  getBooksFinishedThisYear,
  getMostRecentFinishedBook,
  selectReadingBooks,
} from '@/shared/utils/stats';

export default function Home() {
  const books = useBookStore((state) => state.books);
  const openCreate = useBookStore((state) => state.openCreate);
  const openEdit = useBookStore((state) => state.openEdit);
  const openFinish = useBookStore((state) => state.openFinish);
  const dateFormat = usePreferencesStore((state) => state.dateFormat);

  const readingBooks = selectReadingBooks(books);
  const finishedThisYear = getBooksFinishedThisYear(books);
  const recentFinished = getMostRecentFinishedBook(books);

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-[2rem] border border-subtle bg-surface p-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-soft">Right now</p>
        <h1 className="mt-3 text-3xl font-semibold text-strong">
          Keep the books you are actively reading visible and finish them without ceremony.
        </h1>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-inverse hover-accent-fade"
            onClick={() => openCreate('reading')}
          >
            Add current read
          </button>
          <button
            type="button"
            className="rounded-2xl border border-subtle px-4 py-3 text-sm text-strong hover-nonaccent"
            onClick={() => openCreate('next')}
          >
            Add to backlog
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Finished this year" value={finishedThisYear} />
        <StatCard
          label="Last finished"
          value={recentFinished ? recentFinished.title : 'No finished books yet'}
          note={
            recentFinished
              ? `${recentFinished.author} · ${formatDisplayDate(recentFinished.dateFinished, dateFormat)}`
              : 'Finish one book and it shows up here.'
          }
        />
      </section>

      <section className="space-y-4">
        {readingBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">Nothing marked as reading yet.</p>
            <p className="mt-2 text-sm text-muted">
              Add the books you have open now, or pull one from your Library backlog when you start.
            </p>
          </div>
        ) : (
          readingBooks.map((book) => (
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
                    onClick={() => openFinish(book.id)}
                  >
                    Finish
                  </button>
                </>
              }
              footer={<p className="text-sm text-muted">Currently reading</p>}
            />
          ))
        )}
      </section>
    </div>
  );
}
