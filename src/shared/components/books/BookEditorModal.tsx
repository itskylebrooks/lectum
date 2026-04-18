import ImageCropModal from "@/shared/components/books/ImageCropModal";
import type {
  BookCategory,
  BookEditorValues,
  BookFormat,
  BookFormStatus,
  BookWithThumbnail,
} from "@/shared/types";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
} from "@/shared/utils/bookPresentation";
import { Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface BookEditorModalProps {
  open: boolean;
  mode: "create" | "edit";
  book: BookWithThumbnail | null;
  initialStatus: BookFormStatus;
  onClose: () => void;
  onSave: (values: BookEditorValues) => Promise<void>;
}

const formats: BookFormat[] = ["print", "digital", "audiobook"];
const categories: BookCategory[] = ["fiction", "non-fiction"];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function BookEditorModal({
  open,
  mode,
  book,
  initialStatus,
  onClose,
  onSave,
}: BookEditorModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publicationYear, setPublicationYear] = useState(
    String(new Date().getFullYear()),
  );
  const [format, setFormat] = useState<BookFormat>("print");
  const [category, setCategory] = useState<BookCategory>("fiction");
  const [status, setStatus] = useState<BookFormStatus>("next");
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const enterRaf = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setTitle(book?.title ?? "");
      setAuthor(book?.author ?? "");
      setPublicationYear(
        String(book?.publicationYear ?? new Date().getFullYear()),
      );
      setFormat(book?.format ?? "print");
      setCategory(book?.category ?? "fiction");
      setStatus(book?.isReading ? "reading" : initialStatus);
      setThumbnailDataUrl(book?.thumbnailDataUrl ?? null);
      setCropSource(null);
      setCropMimeType("image/jpeg");
      setSubmitting(false);
      setError(null);
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
  }, [book, initialStatus, open, visible]);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
    },
    [],
  );

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const titleText = mode === "create" ? "Add Book" : "Edit Book";
  const isFinishedBook = Boolean(book?.dateFinished);

  async function handleThumbnailChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await fileToDataUrl(file);
    setCropSource(result);
    setCropMimeType(file.type || "image/jpeg");
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const year = Number(publicationYear);
    if (!title.trim() || !author.trim()) {
      setError("Title and author are required.");
      return;
    }
    if (
      !Number.isInteger(year) ||
      year < 0 ||
      year > new Date().getFullYear() + 2
    ) {
      setError("Enter a valid publication year.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title,
        author,
        publicationYear: year,
        format,
        category,
        isReading: status === "reading",
        thumbnailDataUrl,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

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
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Esc") beginClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginClose, visible]);

  if (!visible) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[90] flex items-center justify-center p-4 transition-colors duration-200 ${closing || entering ? "bg-transparent" : "bg-overlay/90 backdrop-blur-sm"}`}
        onClick={beginClose}
      >
        <div
          className={`max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] border border-subtle bg-surface-elevated p-4 shadow-elevated transition-all duration-200 sm:p-5 ${closing || entering ? "opacity-0 scale-[0.95] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-editor-title"
        >
          <div className="flex items-start justify-between gap-3 border-b border-subtle pb-3">
            <div className="min-w-0">
              <h2
                id="book-editor-title"
                className="text-xl font-semibold text-strong"
              >
                {titleText}
              </h2>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-subtle text-muted hover-nonaccent"
              onClick={beginClose}
              aria-label="Close book editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm text-muted">Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                    placeholder="The Left Hand of Darkness"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm text-muted">Author</span>
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                    placeholder="Ursula K. Le Guin"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm text-muted">Publication year</span>
                  <input
                    value={publicationYear}
                    onChange={(event) => setPublicationYear(event.target.value)}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                    placeholder="1969"
                  />
                </label>

                {!isFinishedBook ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted">Status</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus("next")}
                        className={`rounded-xl border px-2.5 py-2 text-left transition ${
                          status === "next"
                            ? "border-subtle bg-accent text-inverse shadow-elevated"
                            : "border-subtle bg-surface-elevated text-muted hover-nonaccent"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          Next
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus("reading")}
                        className={`rounded-xl border px-2.5 py-2 text-left transition ${
                          status === "reading"
                            ? "border-subtle bg-accent text-inverse shadow-elevated"
                            : "border-subtle bg-surface-elevated text-muted hover-nonaccent"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          Reading
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm text-muted">Category</span>
                  <div className="mt-1 flex gap-2">
                    {categories.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        className={`rounded-xl border border-subtle px-3 py-2 text-sm transition-all duration-150 ease-in-out ${
                          category === value
                            ? "bg-accent text-inverse shadow-elevated hover-accent-fade"
                            : "bg-surface-elevated text-muted hover-nonaccent"
                        }`}
                      >
                        {formatBookCategoryLabel(value)}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-sm text-muted">Format</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {formats.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormat(value)}
                        className={`rounded-xl border border-subtle px-3 py-2 text-sm transition-all duration-150 ease-in-out ${
                          format === value
                            ? "bg-accent text-inverse shadow-elevated hover-accent-fade"
                            : "bg-surface-elevated text-muted hover-nonaccent"
                        }`}
                      >
                        {formatBookFormatLabel(value)}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <span className="block text-sm text-muted">Thumbnail</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {thumbnailDataUrl ? "Replace" : "Choose"}
                  </button>
                  {thumbnailDataUrl ? (
                    <button
                      type="button"
                      className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                      onClick={() => {
                        setCropSource(thumbnailDataUrl);
                        setCropMimeType("image/jpeg");
                      }}
                    >
                      Preview
                    </button>
                  ) : null}
                  {thumbnailDataUrl ? (
                    <button
                      type="button"
                      className="rounded-xl border border-subtle px-3 py-2 text-sm text-muted hover-nonaccent"
                      onClick={() => setThumbnailDataUrl(null)}
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-subtle pt-3">
              <button
                type="button"
                className="rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                onClick={beginClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-inverse hover-accent-fade disabled:opacity-60"
              >
                {submitting
                  ? "Saving…"
                  : mode === "create"
                    ? "Add book"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ImageCropModal
        open={Boolean(cropSource)}
        source={cropSource}
        mimeType={cropMimeType}
        onClose={() => setCropSource(null)}
        onConfirm={(dataUrl) => {
          setThumbnailDataUrl(dataUrl);
          setCropSource(null);
        }}
      />
    </>,
    document.body,
  );
}
