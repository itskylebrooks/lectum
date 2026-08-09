export type ThemeMode = "system" | "light" | "dark";
export type DateFormatMode = "DMY" | "MDY";
export type BookFormat = "print" | "digital" | "audiobook";
export type BookCategory = "fiction" | "non-fiction";
export type BookRating = "loved" | "liked" | "mixed" | "disliked" | "abandoned";
export type BookFormStatus = "next" | "reading";
export type LibrarySort =
  | "finishedDesc"
  | "finishedAsc"
  | "title"
  | "author"
  | "publicationYearDesc"
  | "publicationYearAsc";

interface BookRecordFields {
  id: string;
  title: string;
  author: string;
  publicationYear: number;
  format: BookFormat;
  category: BookCategory;
  thumbnailId?: string;
  createdAt: string;
  updatedAt: string;
}

type NextBookState = {
  isReading: false;
  dateFinished?: undefined;
  rating?: undefined;
};

type ReadingBookState = {
  isReading: true;
  dateFinished?: undefined;
  rating?: undefined;
};

type FinishedBookState = {
  isReading: false;
  dateFinished: string;
  rating: BookRating;
};

export type BookRecord = BookRecordFields &
  (NextBookState | ReadingBookState | FinishedBookState);

export type BookWithThumbnail = BookRecord & {
  thumbnailDataUrl?: string | null;
};

export type FinishedBook = BookWithThumbnail & {
  isReading: false;
  dateFinished: string;
  rating: BookRating;
};

export interface BookEditorValues {
  title: string;
  author: string;
  publicationYear: number;
  format: BookFormat;
  category: BookCategory;
  isReading: boolean;
  thumbnailDataUrl: string | null;
}

export interface BookFinishValues {
  dateFinished: string;
  rating: BookRating;
}

export interface LectumSettings {
  themeMode: ThemeMode;
  dateFormat: DateFormatMode;
}

export interface LectumExportV1 {
  app: "lectum";
  version: string;
  exportedAt: string;
  settings: LectumSettings;
  books: BookWithThumbnail[];
}

export interface FinishModalState {
  bookId: string;
}
