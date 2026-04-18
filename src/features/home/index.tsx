import BookDetailsModal from "@/shared/components/books/BookDetailsModal";
import BookThumbnailCard from "@/shared/components/books/BookThumbnailCard";
import { useBookStore } from "@/shared/store/books";
import { selectNextBooks, selectReadingBooks } from "@/shared/utils/stats";
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
  const nextBooks = selectNextBooks(books);
  const selectedBookData = books.find((b) => b.id === selectedBook) ?? null;

  return (
    <div className="mt-4 space-y-4">
      <section className="space-y-4">
        <div className="text-center uppercase tracking-wider text-sm md:text-base font-semibold text-muted">
          READING
        </div>

        {readingBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">
              Nothing marked as reading yet.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[46rem] flex-wrap justify-center gap-3">
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

      <section className="space-y-4">
        <div className="text-center uppercase tracking-wider text-sm md:text-base font-semibold text-muted">
          NEXT
        </div>

        {nextBooks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
            <p className="text-lg font-medium text-strong">
              Nothing waiting in your next list.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[46rem] flex-wrap justify-center gap-3">
            {nextBooks.map((book) => (
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
