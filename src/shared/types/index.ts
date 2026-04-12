export type ThemeMode = 'system' | 'light' | 'dark';
export type DateFormatMode = 'DMY' | 'MDY';
export type BookFormat = 'print' | 'digital' | 'audiobook';
export type BookCategory = 'fiction' | 'non-fiction';
export type BookRating = 'loved' | 'liked' | 'mixed' | 'disliked' | 'abandoned';
export type BookFormStatus = 'next' | 'reading';
export type LibrarySort =
  | 'finishedDesc'
  | 'finishedAsc'
  | 'title'
  | 'author'
  | 'publicationYearDesc'
  | 'publicationYearAsc';

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  publicationYear: number;
  format: BookFormat;
  category: BookCategory;
  thumbnailId?: string;
  isReading: boolean;
  dateFinished?: string;
  rating?: BookRating;
  createdAt: string;
  updatedAt: string;
}

export interface BookWithThumbnail extends BookRecord {
  thumbnailDataUrl?: string | null;
}

export interface FinishedBook extends BookWithThumbnail {
  dateFinished: string;
  rating: BookRating;
}

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
  app: 'lectum';
  version: string;
  exportedAt: string;
  settings: LectumSettings;
  books: BookWithThumbnail[];
}

export interface FinishModalState {
  bookId: string;
}
