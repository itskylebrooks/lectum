import type { BookFinishValues, BookRating, BookWithThumbnail } from '@/shared/types';
import BookBadge from '@/shared/components/books/BookBadge';
import {
  getBookRatingFromIndex,
  getBookRatingIndex,
  RATING_META,
  RATING_ORDER,
} from '@/shared/utils/bookPresentation';
import { todayDateInputValue } from '@/shared/utils/date';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FinishBookModalProps {
  open: boolean;
  book: BookWithThumbnail | null;
  onClose: () => void;
  onSave: (values: BookFinishValues) => Promise<void>;
}

export default function FinishBookModal({ open, book, onClose, onSave }: FinishBookModalProps) {
  const [dateFinished, setDateFinished] = useState(todayDateInputValue());
  const [rating, setRating] = useState<BookRating>('liked');
  const [submitting, setSubmitting] = useState(false);
  const selectedRating = RATING_META[rating];

  useEffect(() => {
    if (!open) return;
    setDateFinished(book?.dateFinished ?? todayDateInputValue());
    setRating(book?.rating ?? 'liked');
    setSubmitting(false);
  }, [book, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ dateFinished, rating });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !book) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-overlay/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] border border-subtle bg-surface-elevated p-5 shadow-elevated sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-book-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="finish-book-title" className="text-2xl font-semibold text-strong">
              Finish "{book.title}"
            </h2>
            <p className="mt-2 text-sm text-muted">
              Add the date you finished it and how it landed for you.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-subtle p-2 text-muted hover-nonaccent"
            onClick={onClose}
            aria-label="Close finish modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-strong">Date finished</span>
            <input
              type="date"
              value={dateFinished}
              onChange={(event) => setDateFinished(event.target.value)}
              className="w-full rounded-2xl border border-subtle bg-control px-4 py-3 text-sm text-strong outline-none focus:border-contrast"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-strong">Rating</p>
            <div className="rounded-[1.5rem] border border-subtle bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <BookBadge tone={selectedRating.tone}>{selectedRating.label}</BookBadge>
                <span className="text-xs uppercase tracking-[0.22em] text-soft">
                  {getBookRatingIndex(rating) + 1}/{RATING_ORDER.length}
                </span>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={RATING_ORDER.length - 1}
                  step={1}
                  value={getBookRatingIndex(rating)}
                  onChange={(event) =>
                    setRating(getBookRatingFromIndex(Number(event.target.value)))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-progress-track"
                  style={{ accentColor: 'var(--color-accent)' }}
                  aria-label="Rating slider"
                />
                <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                  {RATING_ORDER.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-xl px-2 py-2 text-[11px] transition ${
                        rating === value
                          ? 'bg-accent text-inverse'
                          : 'text-muted hover:bg-subtle hover:text-strong'
                      }`}
                      onClick={() => setRating(value)}
                    >
                      {RATING_META[value].shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-muted">{selectedRating.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-2xl border border-subtle px-4 py-3 text-sm text-strong hover-nonaccent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-inverse hover-accent-fade disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save completion'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
