import BookBadge from "@/shared/components/books/BookBadge";
import BookCover from "@/shared/components/books/BookCover";
import { usePreferencesStore } from "@/shared/store/preferences";
import type { BookWithThumbnail } from "@/shared/types";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
  formatBookRatingLabel,
  RATING_META,
} from "@/shared/utils/bookPresentation";
import { formatDisplayDate } from "@/shared/utils/date";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface BookDetailsModalProps {
  open: boolean;
  book: BookWithThumbnail | null;
  onClose: () => void;
  onEdit: (bookId: string) => void;
  onFinish: (bookId: string) => void;
  onReopen: (bookId: string) => void;
  onDelete: (bookId: string) => void;
  onStartReading: (bookId: string) => void;
}

export default function BookDetailsModal({
  open,
  book,
  onClose,
  onEdit,
  onFinish,
  onReopen,
  onDelete,
  onStartReading,
}: BookDetailsModalProps) {
  const dateFormat = usePreferencesStore((state) => state.dateFormat);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const enterRaf = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
      setVisible(true);
      setClosing(false);
      setEntering(true);
      enterRaf.current = requestAnimationFrame(() => {
        enterRaf.current = requestAnimationFrame(() => setEntering(false));
      });
      return;
    }

    if (visible) {
      setClosing(true);
      timeoutRef.current = window.setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 220);
    }
  }, [open, visible]);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
    },
    [],
  );

  const beginClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      onClose();
      setVisible(false);
      setClosing(false);
    }, 220);
  }, [closing, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Esc") beginClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginClose, open]);

  if (!visible || !book) return null;

  const isReading = book.isReading;
  const isFinished = Boolean(book.dateFinished);
  const rating = book.rating;

  return createPortal(
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center p-4 transition-colors duration-200 ${closing || entering ? "bg-transparent" : "bg-overlay backdrop-blur-sm"}`}
      onClick={beginClose}
    >
      <div
        className={`w-full max-w-xl rounded-2xl border border-subtle bg-surface-elevated shadow-elevated overflow-y-auto max-h-[90vh] ring-1 ring-black/5 dark:ring-neutral-700/5 relative transition-all duration-200 ${closing || entering ? "opacity-0 scale-[0.95] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-details-title"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-end gap-2 mb-4">
            <button
              type="button"
              className="rounded-full border border-subtle p-2 text-muted hover-nonaccent"
              onClick={beginClose}
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Left Column - Thumbnail */}
            <div className="flex justify-center sm:justify-start flex-shrink-0">
              <BookCover
                title={book.title}
                author={book.author}
                thumbnailDataUrl={book.thumbnailDataUrl}
                className="h-56 w-40 shadow-sm"
              />
            </div>

            {/* Right Column - Content */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2
                  id="book-details-title"
                  className="text-lg font-semibold text-strong"
                >
                  {book.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{book.author}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <BookBadge tone="neutral">
                  {formatBookFormatLabel(book.format)}
                </BookBadge>
                <BookBadge tone="soft">
                  {formatBookCategoryLabel(book.category)}
                </BookBadge>
                <BookBadge tone="neutral">{book.publicationYear}</BookBadge>
                {isFinished && (
                  <BookBadge tone={RATING_META[rating].tone}>
                    {formatBookRatingLabel(rating)}
                  </BookBadge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted pt-4">
                {isFinished && (
                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-soft">
                      Finished
                    </span>
                    <p className="text-strong">
                      {formatDisplayDate(book.dateFinished, dateFormat)}
                    </p>
                  </div>
                )}

                {isReading && (
                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-soft">
                      Status
                    </span>
                    <p className="text-strong">Currently reading</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons Below All Columns */}
          <div className="space-y-2 mt-6">
            <button
              type="button"
              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
              onClick={() => {
                onEdit(book.id);
                beginClose();
              }}
            >
              Edit
            </button>

            {isReading ? (
              <button
                type="button"
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                onClick={() => {
                  onFinish(book.id);
                  beginClose();
                }}
              >
                Finish
              </button>
            ) : isFinished ? (
              <button
                type="button"
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                onClick={() => {
                  onReopen(book.id);
                  beginClose();
                }}
              >
                Reopen
              </button>
            ) : (
              <button
                type="button"
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                onClick={() => {
                  onStartReading(book.id);
                  beginClose();
                }}
              >
                Start reading
              </button>
            )}

            <button
              type="button"
              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-danger hover:bg-danger hover:text-inverse"
              onClick={() => {
                onDelete(book.id);
                beginClose();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
