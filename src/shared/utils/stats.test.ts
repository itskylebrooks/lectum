import {
  buildFinishedBookStats,
  getBooksFinishedThisYear,
  getMostRecentFinishedBook,
  selectFinishedBooks,
  selectNextBooks,
  selectReadingBooks,
} from '@/shared/utils/stats';
import type { BookWithThumbnail } from '@/shared/types';
import { describe, expect, it } from 'vitest';

const books: BookWithThumbnail[] = [
  {
    id: 'reading',
    title: 'Reading Book',
    author: 'Ada',
    publicationYear: 2023,
    format: 'digital',
    category: 'non-fiction',
    isReading: true,
    thumbnailDataUrl: null,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'next',
    title: 'Queued Book',
    author: 'Bea',
    publicationYear: 2022,
    format: 'print',
    category: 'fiction',
    isReading: false,
    thumbnailDataUrl: null,
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-04-02T10:00:00.000Z',
  },
  {
    id: 'finished-1',
    title: 'Finished One',
    author: 'Ada',
    publicationYear: 1999,
    format: 'print',
    category: 'fiction',
    isReading: false,
    dateFinished: '2026-03-10',
    rating: 'liked',
    thumbnailDataUrl: null,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'finished-2',
    title: 'Finished Two',
    author: 'Carl',
    publicationYear: 2004,
    format: 'audiobook',
    category: 'non-fiction',
    isReading: false,
    dateFinished: '2026-04-10',
    rating: 'loved',
    thumbnailDataUrl: null,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-10T10:00:00.000Z',
  },
];

describe('stats selectors', () => {
  it('separates reading, next, and finished books', () => {
    expect(selectReadingBooks(books).map((book) => book.id)).toEqual(['reading']);
    expect(selectNextBooks(books).map((book) => book.id)).toEqual(['next']);
    expect(selectFinishedBooks(books).map((book) => book.id)).toEqual(['finished-2', 'finished-1']);
  });

  it('builds aggregate finished-book stats', () => {
    const stats = buildFinishedBookStats(books);
    expect(stats.ratingDistribution.loved).toBe(1);
    expect(stats.formatBreakdown.audiobook).toBe(1);
    expect(stats.categoryBreakdown['non-fiction']).toBe(1);
    expect(stats.topAuthors[0]).toEqual({ author: 'Ada', count: 1 });
  });

  it('reports this year and most recent finished book', () => {
    expect(getBooksFinishedThisYear(books, 2026)).toBe(2);
    expect(getMostRecentFinishedBook(books)?.id).toBe('finished-2');
  });
});
