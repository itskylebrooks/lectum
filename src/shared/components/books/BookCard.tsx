import BookCover from '@/shared/components/books/BookCover';
import type { BookWithThumbnail } from '@/shared/types';
import type { ReactNode } from 'react';

interface BookCardProps {
  book: BookWithThumbnail;
  meta: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export default function BookCard({ book, meta, actions, footer }: BookCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-subtle bg-surface p-4 shadow-sm transition-shadow duration-200 hover:shadow-elevated">
      <div className="flex gap-4">
        <BookCover
          title={book.title}
          author={book.author}
          thumbnailDataUrl={book.thumbnailDataUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-strong">{book.title}</h2>
              <p className="mt-1 text-sm text-muted">{book.author}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          <div className="mt-3">{meta}</div>
          {footer ? <div className="mt-4 border-t border-subtle pt-3">{footer}</div> : null}
        </div>
      </div>
    </article>
  );
}
