import Home from "@/features/home";
import LibraryPage from "@/features/library";
import StatsPage from "@/features/stats";
import SyncPage from "@/features/sync";
import { createPageMotion } from "@/shared/animations";
import BookEditorModal from "@/shared/components/books/BookEditorModal";
import FinishBookModal from "@/shared/components/books/FinishBookModal";
import AppHeader from "@/shared/components/headers/AppHeader";
import ConfirmModal from "@/shared/components/modals/ConfirmModal";
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
  const editorState = useBookStore((state) => state.editorState);
  const closeEditor = useBookStore((state) => state.closeEditor);
  const saveBook = useBookStore((state) => state.saveBook);
  const finishBookId = useBookStore((state) => state.finishBookId);
  const closeFinish = useBookStore((state) => state.closeFinish);
  const finishBook = useBookStore((state) => state.finishBook);
  const deleteBookId = useBookStore((state) => state.deleteBookId);
  const closeDelete = useBookStore((state) => state.closeDelete);
  const deleteBook = useBookStore((state) => state.deleteBook);
  const shouldReduceMotion = useReducedMotion();
  const baseMotion = createPageMotion(shouldReduceMotion);

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
        onSave={saveBook}
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
        onConfirm={() =>
          deletingBook ? deleteBook(deletingBook.id) : undefined
        }
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
