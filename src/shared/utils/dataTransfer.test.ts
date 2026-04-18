import { buildExportPayload, parseImportPayload } from '@/shared/utils/dataTransfer';
import type { BookWithThumbnail } from '@/shared/types';
import { describe, expect, it } from 'vitest';

const sampleBooks: BookWithThumbnail[] = [
  {
    id: '1',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    publicationYear: 1969,
    format: 'print',
    category: 'fiction',
    thumbnailId: 'thumbnail:1',
    thumbnailDataUrl: 'data:image/png;base64,abc',
    isReading: false,
    dateFinished: '2026-04-11',
    rating: 'loved',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-11T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    publicationYear: 2020,
    format: 'digital',
    category: 'fiction',
    isReading: true,
    createdAt: '2026-04-08T10:00:00.000Z',
    updatedAt: '2026-04-13T10:00:00.000Z',
    thumbnailDataUrl: null,
  },
];

describe('data transfer', () => {
  it('round-trips full library data and settings', () => {
    const payload = buildExportPayload({
      books: sampleBooks,
      settings: { themeMode: 'dark', dateFormat: 'MDY' },
    });

    const parsed = parseImportPayload(JSON.stringify(payload));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.payload.settings).toEqual({ themeMode: 'dark', dateFormat: 'MDY' });
    expect(parsed.payload.books).toEqual(sampleBooks);
  });

  it('rejects non-Lectum payloads', () => {
    const parsed = parseImportPayload(JSON.stringify({ app: 'other-app' }));
    expect(parsed).toEqual({ ok: false, reason: 'not_lectum' });
  });
});
