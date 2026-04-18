import BookBadge from '@/shared/components/books/BookBadge';
import BookCard from '@/shared/components/books/BookCard';
import StatCard from '@/shared/components/layout/StatCard';
import { useBookStore } from '@/shared/store/books';
import { usePreferencesStore } from '@/shared/store/preferences';
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
} from '@/shared/utils/bookPresentation';
import { formatDisplayDate } from '@/shared/utils/date';
import {
  getBooksFinishedThisYear,
  getMostRecentFinishedBook,
  selectReadingBooks,
} from '@/shared/utils/stats';
import { BookOpen, CalendarDays } from 'lucide-react';

export default function Home() {
  const books = useBookStore((state) => state.books);
  const openEdit = useBookStore((state) => state.openEdit);
  const openFinish = useBookStore((state) => state.openFinish);
  const dateFormat = usePreferencesStore((state) => state.dateFormat);

  const readingBooks = selectReadingBooks(books);
  const finishedThisYear = getBooksFinishedThisYear(books);
  const recentFinished = getMostRecentFinishedBook(books);

  return (
    <div className="mt-4 space-y-4">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Finished this year" value={finishedThisYear} icon={BookOpen} />
        <StatCard
          label="Last finished"
          value={recentFinished ? recentFinished.title : 'No finished books yet'}
          note={
            recentFinished
              ? `${recentFinished.author} · ${formatDisplayDate(recentFinished.dateFinished, dateFormat)}`
              : 'No finished books yet.'
          }
          icon={CalendarDays}
        />
      </section>

      <section className="space-y-4">
        <div className="text-center uppercase tracking-wider text-sm md:text-base font-semibold text-muted">
          CURRENTLY READING
        </div>

        {readingBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">Nothing marked as reading yet.</p>
          </div>
        ) : (
          readingBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              badges={
                <>
                  <BookBadge tone="neutral">{formatBookFormatLabel(book.format)}</BookBadge>
                  <BookBadge tone="soft">{formatBookCategoryLabel(book.category)}</BookBadge>
                  <BookBadge tone="soft">{book.publicationYear}</BookBadge>
                </>
              }
              details={
                <p className="text-sm text-muted">
                  Active now. Finish it when you are done, or open manage actions to edit details.
                </p>
              }
              actions={
                <>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => openFinish(book.id)}
                  >
                    Finish
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => openEdit(book.id)}
                  >
                    Edit
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
