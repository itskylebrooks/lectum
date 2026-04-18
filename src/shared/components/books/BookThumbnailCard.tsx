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
      className="group relative inline-block rounded-2xl overflow-hidden transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-contrast"
      aria-label={`Open ${book.title} by ${book.author}`}
    >
      <div className="transition-transform duration-200 group-hover:scale-105 origin-center">
        <BookCover
          title={book.title}
          author={book.author}
          thumbnailDataUrl={book.thumbnailDataUrl}
          className="h-60 w-44 shadow-sm group-hover:shadow-elevated transition-shadow duration-200"
        />
      </div>
    </button>
  );
}
