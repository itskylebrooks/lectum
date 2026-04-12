import type { BookFinishValues, BookRating, BookWithThumbnail } from '@/shared/types';
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

const ratingOptions: { value: BookRating; label: string; description: string }[] = [
  { value: 'loved', label: 'Loved', description: "Stayed with me; I'd reread or recommend it." },
  { value: 'liked', label: 'Liked', description: 'Enjoyed it and I am glad I read it.' },
  { value: 'mixed', label: 'Mixed', description: 'Some parts worked, some did not.' },
  { value: 'disliked', label: 'Disliked', description: 'I struggled with it or lost interest.' },
  { value: 'abandoned', label: 'Abandoned', description: 'I chose to stop and move on.' },
];

export default function FinishBookModal({ open, book, onClose, onSave }: FinishBookModalProps) {
  const [dateFinished, setDateFinished] = useState(todayDateInputValue());
  const [rating, setRating] = useState<BookRating>('liked');
  const [submitting, setSubmitting] = useState(false);

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
            <div className="grid gap-3">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRating(option.value)}
                  className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                    rating === option.value
                      ? 'border-contrast bg-accent text-inverse'
                      : 'border-subtle bg-surface hover-nonaccent'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{option.description}</span>
                </button>
              ))}
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
