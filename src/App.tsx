import Home from "@/features/home";
import LibraryPage from "@/features/library";
import StatsPage from "@/features/stats";
import SyncPage from "@/features/sync";
import { createPageMotion } from "@/shared/animations";
import BookEditorModal from "@/shared/components/books/BookEditorModal";
import FinishBookModal from "@/shared/components/books/FinishBookModal";
import AppHeader from "@/shared/components/headers/AppHeader";
import ConfirmModal from "@/shared/components/modals/ConfirmModal";
import { useBookUiStore } from "@/shared/store/bookUi";
import { useBookStore } from "@/shared/store/books";
import type { TargetAndTransition, Transition } from "framer-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

type PageChildProps = { pageTransitioning?: boolean };

const Page = ({
  children,
  initial,
  animate,
  transition,
}: {
  children: React.ReactElement<PageChildProps>;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  transition?: Transition;
}) => {
  return (
    <motion.main
      className="w-full relative overflow-hidden"
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { pageTransitioning: false })
        : children}
    </motion.main>
  );
};

export default function App() {
  const location = useLocation();
  const initialize = useBookStore((state) => state.initialize);
  const books = useBookStore((state) => state.books);
  const libraryStatus = useBookStore((state) => state.status);
  const libraryError = useBookStore((state) => state.error);
  const watchExternalChanges = useBookStore(
    (state) => state.watchExternalChanges,
  );
  const saveBook = useBookStore((state) => state.saveBook);
  const finishBook = useBookStore((state) => state.finishBook);
  const deleteBook = useBookStore((state) => state.deleteBook);
  const editorState = useBookUiStore((state) => state.editorState);
  const closeEditor = useBookUiStore((state) => state.closeEditor);
  const finishBookId = useBookUiStore((state) => state.finishBookId);
  const closeFinish = useBookUiStore((state) => state.closeFinish);
  const deleteBookId = useBookUiStore((state) => state.deleteBookId);
  const closeDelete = useBookUiStore((state) => state.closeDelete);
  const shouldReduceMotion = useReducedMotion();
  const baseMotion = createPageMotion(shouldReduceMotion);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => watchExternalChanges(), [watchExternalChanges]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const editingBook =
    editorState.open && editorState.mode === "edit"
      ? (books.find((book) => book.id === editorState.bookId) ?? null)
      : null;
  const finishingBook = finishBookId
    ? (books.find((book) => book.id === finishBookId) ?? null)
    : null;
  const deletingBook = deleteBookId
    ? (books.find((book) => book.id === deleteBookId) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:pb-6">
      <AppHeader />

      {libraryStatus === "error" && !books.length ? (
        <section
          className="mb-4 rounded-2xl border border-danger bg-surface p-4 text-sm text-strong"
          role="alert"
        >
          <p>{libraryError}</p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-accent px-3 py-2 text-inverse"
            onClick={() => {
              void initialize();
            }}
          >
            Retry
          </button>
        </section>
      ) : null}

      <main>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Page
                  initial={baseMotion.initial}
                  animate={baseMotion.animate}
                  transition={baseMotion.transition}
                >
                  <Home />
                </Page>
              }
            />
            <Route
              path="/library"
              element={
                <Page
                  initial={baseMotion.initial}
                  animate={baseMotion.animate}
                  transition={baseMotion.transition}
                >
                  <LibraryPage />
                </Page>
              }
            />
            <Route path="/next" element={<Navigate to="/library" replace />} />
            <Route
              path="/stats"
              element={
                <Page
                  initial={baseMotion.initial}
                  animate={baseMotion.animate}
                  transition={baseMotion.transition}
                >
                  <StatsPage />
                </Page>
              }
            />
            <Route
              path="/sync"
              element={
                <Page
                  initial={baseMotion.initial}
                  animate={baseMotion.animate}
                  transition={baseMotion.transition}
                >
                  <SyncPage />
                </Page>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <BookEditorModal
        open={editorState.open}
        mode={editorState.mode}
        book={editingBook}
        initialStatus={editorState.initialStatus}
        onClose={closeEditor}
        onSave={(values) =>
          saveBook(
            values,
            editorState.open && editorState.mode === "edit"
              ? editorState.bookId
              : undefined,
          )
        }
      />

      <FinishBookModal
        open={Boolean(finishingBook)}
        book={finishingBook}
        onClose={closeFinish}
        onSave={(values) =>
          finishingBook
            ? finishBook(finishingBook.id, values)
            : Promise.resolve()
        }
      />

      <ConfirmModal
        open={Boolean(deletingBook)}
        onClose={closeDelete}
        onConfirm={async () => {
          if (!deletingBook) return;
          await deleteBook(deletingBook.id);
          closeDelete();
        }}
        destructive
        title="Delete book?"
        message={
          deletingBook ? `Remove "${deletingBook.title}" from Lectum.` : ""
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
