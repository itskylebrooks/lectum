import BookDetailsModal from "@/shared/components/books/BookDetailsModal";
import BookThumbnailCard from "@/shared/components/books/BookThumbnailCard";
import StatCard from "@/shared/components/layout/StatCard";
import { useBookStore } from "@/shared/store/books";
import {
  getBooksFinishedThisYear,
  getMostRecentFinishedBook,
  selectReadingBooks,
} from "@/shared/utils/stats";
import { BookOpen, CalendarDays } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const books = useBookStore((state) => state.books);
  const openEdit = useBookStore((state) => state.openEdit);
  const openFinish = useBookStore((state) => state.openFinish);
  const startBook = useBookStore((state) => state.startBook);
  const reopenBook = useBookStore((state) => state.reopenBook);
  const openDelete = useBookStore((state) => state.openDelete);

  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const readingBooks = selectReadingBooks(books);
  const finishedThisYear = getBooksFinishedThisYear(books);
  const recentFinished = getMostRecentFinishedBook(books);
  const selectedBookData = books.find((b) => b.id === selectedBook) ?? null;

  return (
    <div className="mt-4 space-y-4">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Finished this year"
          value={finishedThisYear}
          icon={BookOpen}
        />
        <StatCard
          label="Last finished"
          value={
            recentFinished ? recentFinished.title : "No finished books yet"
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
            <p className="text-lg font-medium text-strong">
              Nothing marked as reading yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {readingBooks.map((book) => (
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
