import { defaultEase, useMotionPreferences } from "@/shared/animations";
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
import { AnimatePresence, motion } from "framer-motion";
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

type LayerPhase = "enter" | "exit" | "idle";
type LayerDir = "forward" | "back";
interface StepLayer {
  key: number;
  idx: number;
  phase: LayerPhase;
  dir: LayerDir;
}

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
  const totalSteps = 4;
  const { prefersReducedMotion } = useMotionPreferences();
  const btnTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: defaultEase };
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [step, setStep] = useState(1);
  const [renderedSteps, setRenderedSteps] = useState<StepLayer[]>([
    { key: 0, idx: 1, phase: "idle", dir: "forward" },
  ]);
  const [height, setHeight] = useState<number | "auto">("auto");
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
  const stepAnimTimer = useRef<number | null>(null);
  const stepKeyRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (el) {
      observer.current = new ResizeObserver((entries) => {
        if (entries[0]) setHeight(entries[0].contentRect.height);
      });
      observer.current.observe(el);
    }
  }, []);

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
      setStep(1);
      stepKeyRef.current++;
      setRenderedSteps([
        { key: stepKeyRef.current, idx: 1, phase: "idle", dir: "forward" },
      ]);
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
      if (stepAnimTimer.current) window.clearTimeout(stepAnimTimer.current);
      if (observer.current) observer.current.disconnect();
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

    if (step < totalSteps) {
      setError(null);
      queueStep(Math.min(totalSteps, step + 1));
      return;
    }

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

  const queueStep = (next: number) => {
    if (next === step) return;
    const dir: LayerDir = next > step ? "forward" : "back";
    setStep(next);
    setRenderedSteps((prev) =>
      prev.map((layer) => ({ ...layer, phase: "exit", dir })),
    );
    if (stepAnimTimer.current) window.clearTimeout(stepAnimTimer.current);
    const EXIT_MS = 200;
    stepAnimTimer.current = window.setTimeout(() => {
      stepKeyRef.current++;
      setRenderedSteps([
        { key: stepKeyRef.current, idx: next, phase: "enter", dir },
      ]);
      stepAnimTimer.current = window.setTimeout(() => {
        setRenderedSteps((curr) =>
          curr.filter((layer) => layer.phase === "enter"),
        );
      }, 260);
    }, EXIT_MS);
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[90] flex items-center justify-center p-4 transition-colors duration-200 ${closing || entering ? "bg-transparent" : "bg-overlay/90 backdrop-blur-sm"}`}
        onClick={beginClose}
      >
        <div
          className={`max-h-[92vh] w-full max-w-[28rem] overflow-y-auto rounded-2xl border border-subtle bg-surface-elevated p-5 shadow-elevated ring-1 ring-black/5 dark:ring-neutral-700/5 transition-all duration-200 sm:p-6 ${closing || entering ? "opacity-0 scale-[0.95] -translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-editor-title"
        >
          <div className="relative">
            <h2 id="book-editor-title" className="sr-only">
              {titleText}
            </h2>
            <button
              type="button"
              className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full bg-control text-muted hover-nonaccent"
              onClick={beginClose}
              aria-label="Close book editor"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[11px] tracking-wide uppercase text-muted">
              {titleText}
            </p>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div
              className="relative overflow-hidden"
              style={{
                minHeight: 170,
                height: typeof height === "number" ? `${height}px` : undefined,
                transition: "height 200ms ease",
              }}
            >
              {renderedSteps.map((layer) => {
                let stateClass = "";
                if (layer.phase === "enter") {
                  stateClass =
                    layer.dir === "forward"
                      ? "guide-step-enter-forward"
                      : "guide-step-enter-back";
                } else if (layer.phase === "exit") {
                  stateClass =
                    layer.dir === "forward"
                      ? "guide-step-exit-forward"
                      : "guide-step-exit-back";
                }
                const isCurrent = layer.idx === step;
                return (
                  <div
                    key={layer.key}
                    className={`guide-step-layer ${stateClass}`}
                    style={{ bottom: "auto" }}
                    ref={isCurrent ? measureRef : undefined}
                  >
                    {layer.idx === 1 ? (
                      <div className="grid gap-3">
                        <label className="space-y-1">
                          <span className="text-lg font-semibold text-strong">
                            Title
                          </span>
                          <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                            placeholder="Metro 2033"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-lg font-semibold text-strong">
                            Author
                          </span>
                          <input
                            value={author}
                            onChange={(event) => setAuthor(event.target.value)}
                            className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                            placeholder="Dmitry Glukhovsky"
                          />
                        </label>
                      </div>
                    ) : null}

                    {layer.idx === 2 ? (
                      <div className="grid gap-3">
                        <label className="space-y-1">
                          <span className="text-lg font-semibold text-strong">
                            Publication year
                          </span>
                          <input
                            value={publicationYear}
                            onChange={(event) =>
                              setPublicationYear(event.target.value)
                            }
                            inputMode="numeric"
                            className="w-full rounded-xl border border-subtle bg-transparent px-3 py-2.5 text-sm text-strong outline-none ring-0 placeholder:text-muted focus:border-accent"
                            placeholder="1969"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-lg font-semibold text-strong">
                            Category
                          </span>
                          <div className="mt-1 grid w-full grid-cols-2 gap-2">
                            {categories.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setCategory(value)}
                                className={`w-full rounded-xl border border-subtle px-3 py-2 text-sm transition-all duration-150 ease-in-out ${
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
                      </div>
                    ) : null}

                    {layer.idx === 3 ? (
                      <div className="grid gap-3">
                        {!isFinishedBook ? (
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-strong">
                              Status
                            </p>
                            <div className="grid w-full grid-cols-2 gap-2">
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
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-strong">
                              Status
                            </p>
                            <div className="rounded-xl border border-subtle px-3 py-2.5 text-sm text-muted">
                              Finished books keep their current status.
                            </div>
                          </div>
                        )}

                        <label className="space-y-1">
                          <span className="text-lg font-semibold text-strong">
                            Format
                          </span>
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
                    ) : null}

                    {layer.idx === 4 ? (
                      <div className="space-y-2">
                        <span className="block text-lg font-semibold text-strong">
                          Thumbnail
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailChange}
                        />
                        <div
                          className={`grid gap-2 ${thumbnailDataUrl ? "grid-cols-3" : "grid-cols-1"}`}
                        >
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4" />
                            {thumbnailDataUrl ? "Replace" : "Choose"}
                          </button>
                          {thumbnailDataUrl ? (
                            <button
                              type="button"
                              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-strong hover-nonaccent"
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
                              className="w-full rounded-xl border border-subtle px-3 py-2 text-sm text-muted hover-nonaccent"
                              onClick={() => setThumbnailDataUrl(null)}
                            >
                              Remove image
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="mt-5 flex items-center justify-between text-xs text-muted">
              <div>
                Step {step} / {totalSteps}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${index + 1 === step ? "bg-accent" : "bg-chip"}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-2">
              <div className="flex w-full items-center gap-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {step > 1 && (
                    <button
                      key="back"
                      type="button"
                      onClick={() => {
                        setError(null);
                        queueStep(Math.max(1, step - 1));
                      }}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium bg-control text-strong hover-nonaccent transition-opacity ${prefersReducedMotion ? "" : "duration-180"}`}
                      style={{
                        opacity: step > 1 ? 1 : 0,
                        pointerEvents: step > 1 ? "auto" : "none",
                        willChange: "opacity",
                        WebkitTransform: "translateZ(0)",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                      aria-hidden={step <= 1}
                      disabled={step <= 1}
                      tabIndex={step > 1 ? 0 : -1}
                    >
                      Back
                    </button>
                  )}

                  <motion.button
                    key={step === totalSteps ? "finish" : "next"}
                    layout
                    transition={btnTransition}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-inverse transition-colors duration-200 hover-accent-fade disabled:opacity-60"
                    style={{
                      willChange: "transform, width",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    {step === totalSteps
                      ? submitting
                        ? "Saving…"
                        : mode === "create"
                          ? "Add book"
                          : "Save changes"
                      : "Next"}
                  </motion.button>
                </AnimatePresence>
              </div>
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
