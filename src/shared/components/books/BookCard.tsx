import BookCover from "@/shared/components/books/BookCover";
import type { BookWithThumbnail } from "@/shared/types";
import { Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface BookCardProps {
  book: BookWithThumbnail;
  badges?: ReactNode;
  details?: ReactNode;
  primaryAction?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  manageLabel?: string;
}

export default function BookCard({
  book,
  badges,
  details,
  primaryAction,
  actions,
  footer,
  manageLabel = "Manage",
}: BookCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setActionsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [actionsOpen]);

  return (
    <article className="mx-auto w-full max-w-sm rounded-[1.75rem] border border-subtle bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-elevated">
      <div className="flex flex-col items-center text-center">
        <BookCover
          title={book.title}
          author={book.author}
          thumbnailDataUrl={book.thumbnailDataUrl}
          accentSeed={book.id}
          className="h-40 w-28 shadow-sm"
        />
        <div className="mt-4 min-w-0 w-full">
          <h2 className="text-lg font-semibold text-strong">{book.title}</h2>
          <p className="mt-1 text-sm text-muted">{book.author}</p>
        </div>

        {badges ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {badges}
          </div>
        ) : null}
        {details ? <div className="mt-4 w-full">{details}</div> : null}
        {footer ? (
          <div className="mt-4 w-full border-t border-subtle pt-3">
            {footer}
          </div>
        ) : null}

        {primaryAction || actions ? (
          <div
            ref={actionsRef}
            className="mt-4 flex w-full flex-col items-center gap-2"
          >
            {primaryAction}
            {actions ? (
              actionsOpen ? (
                <div className="flex w-full flex-wrap items-center justify-center gap-2">
                  {actions}
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                  onClick={() => setActionsOpen(true)}
                  aria-label={manageLabel}
                >
                  <Settings2 className="h-4 w-4" />
                  <span>{manageLabel}</span>
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
