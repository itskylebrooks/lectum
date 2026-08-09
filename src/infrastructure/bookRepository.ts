import type { BookWithThumbnail } from "@/shared/types";
import {
  deleteStoredBook,
  initializeStoredLibrary,
  listStoredBooks,
  replaceStoredBooks,
  saveStoredBook,
} from "@/shared/utils/booksDb";

export interface BookRepository {
  initialize: (
    starterBooks: BookWithThumbnail[],
  ) => Promise<BookWithThumbnail[]>;
  list: () => Promise<BookWithThumbnail[]>;
  save: (book: BookWithThumbnail) => Promise<BookWithThumbnail>;
  delete: (bookId: string) => Promise<void>;
  replaceAll: (books: BookWithThumbnail[]) => Promise<void>;
}

export const indexedDbBookRepository: BookRepository = {
  initialize: initializeStoredLibrary,
  list: listStoredBooks,
  save: saveStoredBook,
  delete: deleteStoredBook,
  replaceAll: replaceStoredBooks,
};
