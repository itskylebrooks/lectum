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
      className="group relative inline-block w-full max-w-[10.9375rem] overflow-hidden rounded-2xl transform-gpu motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-contrast"
      style={{ willChange: "transform" }}
      aria-label={`Open ${book.title} by ${book.author}`}
    >
      <BookCover
        title={book.title}
        author={book.author}
        thumbnailDataUrl={book.thumbnailDataUrl}
        accentSeed={book.id}
        className="h-auto w-full max-w-[10.9375rem] aspect-[35/49] shadow-sm transition-shadow duration-200 group-hover:shadow-elevated"
      />
    </button>
  );
}
