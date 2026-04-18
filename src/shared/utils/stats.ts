import type {
  BookCategory,
  BookFormat,
  BookWithThumbnail,
  FinishedBook,
  LibrarySort,
} from '@/shared/types';
import { RATING_ORDER } from '@/shared/utils/bookPresentation';

const formatOrder: BookFormat[] = ['print', 'digital', 'audiobook'];
const categoryOrder: BookCategory[] = ['fiction', 'non-fiction'];

export function selectReadingBooks(books: BookWithThumbnail[]) {
  return [...books]
    .filter((book) => book.isReading && !book.dateFinished)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function selectNextBooks(books: BookWithThumbnail[]) {
  return [...books]
    .filter((book) => !book.isReading && !book.dateFinished)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function selectFinishedBooks(books: BookWithThumbnail[]): FinishedBook[] {
  return [...books]
    .filter((book): book is FinishedBook => Boolean(book.dateFinished && book.rating))
    .sort((left, right) => right.dateFinished.localeCompare(left.dateFinished));
}

export function sortFinishedBooks(books: FinishedBook[], sort: LibrarySort) {
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

  return [...books].sort((left, right) => {
    switch (sort) {
      case 'title':
        return collator.compare(left.title, right.title);
      case 'author':
        return collator.compare(left.author, right.author);
      case 'publicationYearDesc':
        return right.publicationYear - left.publicationYear;
      case 'publicationYearAsc':
        return left.publicationYear - right.publicationYear;
      case 'finishedAsc':
        return left.dateFinished.localeCompare(right.dateFinished);
      case 'finishedDesc':
      default:
        return right.dateFinished.localeCompare(left.dateFinished);
    }
  });
}

function countByKey<T extends string>(values: T[], order: T[]) {
  const counts = Object.fromEntries(order.map((value) => [value, 0])) as Record<T, number>;
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function yearKey(date: string) {
  return date.slice(0, 4);
}

function decadeKey(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

export function getMostReadAuthors(books: FinishedBook[]) {
  const counts = new Map<string, number>();
  for (const book of books) {
    counts.set(book.author, (counts.get(book.author) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([author, count]) => ({ author, count }))
    .sort((left, right) => right.count - left.count || left.author.localeCompare(right.author))
    .slice(0, 5);
}

export function buildFinishedBookStats(books: BookWithThumbnail[]) {
  const finished = selectFinishedBooks(books);
  const perMonth = new Map<string, number>();
  const perYear = new Map<string, number>();
  const perDecade = new Map<string, number>();

  for (const book of finished) {
    perMonth.set(monthKey(book.dateFinished), (perMonth.get(monthKey(book.dateFinished)) ?? 0) + 1);
    perYear.set(yearKey(book.dateFinished), (perYear.get(yearKey(book.dateFinished)) ?? 0) + 1);
    perDecade.set(decadeKey(book.publicationYear), (perDecade.get(decadeKey(book.publicationYear)) ?? 0) + 1);
  }

  return {
    finished,
    perMonth: [...perMonth.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    perYear: [...perYear.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    ratingDistribution: countByKey(
      finished.map((book) => book.rating),
      RATING_ORDER,
    ),
    formatBreakdown: countByKey(
      finished.map((book) => book.format),
      formatOrder,
    ),
    categoryBreakdown: countByKey(
      finished.map((book) => book.category),
      categoryOrder,
    ),
    decadeSpread: [...perDecade.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    topAuthors: getMostReadAuthors(finished),
  };
}

export function getBooksFinishedThisYear(books: BookWithThumbnail[], year = new Date().getFullYear()) {
  const yearPrefix = String(year);
  return selectFinishedBooks(books).filter((book) => book.dateFinished.startsWith(yearPrefix)).length;
}

export function getMostRecentFinishedBook(books: BookWithThumbnail[]) {
  return selectFinishedBooks(books)[0] ?? null;
}
