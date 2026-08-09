import type { BookWithThumbnail } from "@/shared/types";

export interface BookRepository {
  initialize: (
    starterBooks: BookWithThumbnail[],
  ) => Promise<BookWithThumbnail[]>;
  list: () => Promise<BookWithThumbnail[]>;
  save: (book: BookWithThumbnail) => Promise<BookWithThumbnail>;
  delete: (bookId: string) => Promise<void>;
  replaceAll: (books: BookWithThumbnail[]) => Promise<BookWithThumbnail[]>;
  subscribe: (onChange: () => void) => () => void;
}
