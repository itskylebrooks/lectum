import BookBadge from "@/shared/components/books/BookBadge";
import BookCover from "@/shared/components/books/BookCover";
import { usePreferencesStore } from "@/shared/store/preferences";
import type { BookWithThumbnail } from "@/shared/types";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
  formatBookRatingLabel,
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
        className={`w-full max-w-[20rem] sm:max-w-[22rem] rounded-2xl border border-subtle bg-surface-elevated shadow-elevated overflow-y-auto max-h-[90vh] ring-1 ring-black/5 dark:ring-neutral-700/5 relative transition-all duration-200 ${closing || entering ? "opacity-0 scale-[0.95] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-details-title"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex min-h-8 flex-wrap items-center gap-2">
              <BookBadge tone="neutral">
                {formatBookFormatLabel(book.format)}
              </BookBadge>
              <BookBadge tone="neutral">
                {formatBookCategoryLabel(book.category)}
              </BookBadge>
              <BookBadge tone="neutral">{book.publicationYear}</BookBadge>
            </div>

            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-control text-muted hover-nonaccent"
              onClick={beginClose}
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <BookCover
                title={book.title}
                author={book.author}
                thumbnailDataUrl={book.thumbnailDataUrl}
                className="h-64 w-44 shadow-sm"
              />
            </div>

            <div className="space-y-2 text-sm text-muted">
              {isFinished && (
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-strong">
                  <span>
                    {formatDisplayDate(book.dateFinished, dateFormat)}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>{formatBookRatingLabel(rating)}</span>
                </div>
              )}

              {isReading && (
                <div>
                  <p className="text-center text-strong">Reading</p>
                </div>
              )}
            </div>
          </div>

          {/* Buttons Below All Columns */}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {isReading ? (
              <button
                type="button"
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent sm:order-3"
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
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent sm:order-3"
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
                className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent sm:order-3"
                onClick={() => {
                  onStartReading(book.id);
                  beginClose();
                }}
              >
                Start
              </button>
            )}

            <button
              type="button"
              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent sm:order-2"
              onClick={() => {
                onEdit(book.id);
                beginClose();
              }}
            >
              Edit
            </button>

            <button
              type="button"
              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-danger hover:bg-danger hover:text-inverse sm:order-1"
              onClick={() => {
                onDelete(book.id);
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
