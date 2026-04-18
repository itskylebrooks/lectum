import BookCover from "@/shared/components/books/BookCover";
import type { BookWithThumbnail } from "@/shared/types";

interface BookThumbnailCardProps {
  book: BookWithThumbnail;
  onClick: () => void;
}

export default function BookThumbnailCard({
  book,
  onClick,
}: BookThumbnailCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-block rounded-2xl overflow-hidden transform-gpu motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-contrast"
      style={{ willChange: "transform" }}
      aria-label={`Open ${book.title} by ${book.author}`}
    >
      <BookCover
        title={book.title}
        author={book.author}
        thumbnailDataUrl={book.thumbnailDataUrl}
        className="h-[15.25rem] w-[10.9375rem] shadow-sm group-hover:shadow-elevated transition-shadow duration-200"
      />
    </button>
  );
}
