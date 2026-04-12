import type { LectumExportV1, LectumSettings, BookWithThumbnail } from '@/shared/types';

const APP_NAME = 'lectum';
const APP_VERSION = '1.0.0';

type ImportFailure = { ok: false; reason: 'invalid' | 'not_lectum' };
type ImportSuccess = { ok: true; payload: LectumExportV1 };

function isBookCandidate(value: unknown): value is BookWithThumbnail {
  if (!value || typeof value !== 'object') return false;
  const book = value as Partial<BookWithThumbnail>;
  return (
    typeof book.id === 'string' &&
    typeof book.title === 'string' &&
    typeof book.author === 'string' &&
    typeof book.publicationYear === 'number' &&
    typeof book.format === 'string' &&
    typeof book.category === 'string' &&
    typeof book.isReading === 'boolean' &&
    typeof book.createdAt === 'string' &&
    typeof book.updatedAt === 'string'
  );
}

export function buildExportPayload(args: {
  books: BookWithThumbnail[];
  settings: LectumSettings;
}): LectumExportV1 {
  return {
    app: APP_NAME,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: args.settings,
    books: args.books.map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailDataUrl ?? null,
    })),
  };
}

export function parseImportPayload(serialized: string): ImportFailure | ImportSuccess {
  try {
    const parsed = JSON.parse(serialized) as Partial<LectumExportV1> | null;
    if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'invalid' };
    if (parsed.app !== APP_NAME) return { ok: false, reason: 'not_lectum' };

    const rawBooks = Array.isArray(parsed.books) ? parsed.books.filter(isBookCandidate) : [];
    const settings = parsed.settings ?? { themeMode: 'system', dateFormat: 'DMY' };

    return {
      ok: true,
      payload: {
        app: APP_NAME,
        version: typeof parsed.version === 'string' ? parsed.version : APP_VERSION,
        exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
        settings: {
          themeMode:
            settings.themeMode === 'light' || settings.themeMode === 'dark' || settings.themeMode === 'system'
              ? settings.themeMode
              : 'system',
          dateFormat: settings.dateFormat === 'MDY' ? 'MDY' : 'DMY',
        },
        books: rawBooks.map((book) => ({
          ...book,
          thumbnailDataUrl: book.thumbnailDataUrl ?? null,
        })),
      },
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
