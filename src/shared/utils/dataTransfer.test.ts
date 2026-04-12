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
];

describe('data transfer', () => {
  it('round-trips Lectum exports with thumbnails', () => {
    const payload = buildExportPayload({
      books: sampleBooks,
      settings: { themeMode: 'system', dateFormat: 'DMY' },
    });

    const parsed = parseImportPayload(JSON.stringify(payload));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.payload.books[0]?.thumbnailDataUrl).toBe(sampleBooks[0]?.thumbnailDataUrl);
    expect(parsed.payload.settings.dateFormat).toBe('DMY');
  });

  it('rejects non-Lectum payloads', () => {
    const parsed = parseImportPayload(JSON.stringify({ app: 'other-app' }));
    expect(parsed).toEqual({ ok: false, reason: 'not_lectum' });
  });
});
