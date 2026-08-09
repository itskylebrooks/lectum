import type {
  BookCategory,
  BookFormat,
  BookRating,
  BookWithThumbnail,
  LectumExportV1,
  LectumSettings,
} from "@/shared/types";

const APP_NAME = "lectum";
const EXPORT_SCHEMA_VERSION = "1.0.0";
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const MAX_IMPORT_BOOKS = 10_000;
const BOOK_FORMATS: ReadonlySet<BookFormat> = new Set([
  "print",
  "digital",
  "audiobook",
]);
const BOOK_CATEGORIES: ReadonlySet<BookCategory> = new Set([
  "fiction",
  "non-fiction",
]);
const BOOK_RATINGS: ReadonlySet<BookRating> = new Set([
  "loved",
  "liked",
  "mixed",
  "disliked",
  "abandoned",
]);

type ImportFailure = {
  ok: false;
  reason: "invalid" | "not_lectum" | "unsupported_version";
};
type ImportSuccess = { ok: true; payload: LectumExportV1 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

function isThumbnailDataUrl(
  value: unknown,
): value is string | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" &&
      /^data:image\/(?:jpeg|png|webp);base64,/i.test(value))
  );
}

function isBookCandidate(value: unknown): value is BookWithThumbnail {
  if (!isRecord(value)) return false;

  const hasFinishedDate = value.dateFinished !== undefined;
  const hasRating = value.rating !== undefined;
  const validFinishedState = hasFinishedDate
    ? isCalendarDate(value.dateFinished) &&
      typeof value.rating === "string" &&
      BOOK_RATINGS.has(value.rating as BookRating) &&
      value.isReading === false
    : !hasRating;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.author) &&
    typeof value.publicationYear === "number" &&
    Number.isInteger(value.publicationYear) &&
    value.publicationYear >= 0 &&
    value.publicationYear <= new Date().getFullYear() + 2 &&
    typeof value.format === "string" &&
    BOOK_FORMATS.has(value.format as BookFormat) &&
    typeof value.category === "string" &&
    BOOK_CATEGORIES.has(value.category as BookCategory) &&
    typeof value.isReading === "boolean" &&
    (value.thumbnailId === undefined || isNonEmptyString(value.thumbnailId)) &&
    isThumbnailDataUrl(value.thumbnailDataUrl) &&
    isIsoDateTime(value.createdAt) &&
    isIsoDateTime(value.updatedAt) &&
    validFinishedState
  );
}

function isSettingsCandidate(value: unknown): value is LectumSettings {
  if (!isRecord(value)) return false;
  return (
    (value.themeMode === "light" ||
      value.themeMode === "dark" ||
      value.themeMode === "system") &&
    (value.dateFormat === "DMY" || value.dateFormat === "MDY")
  );
}

export function buildExportPayload(args: {
  books: BookWithThumbnail[];
  settings: LectumSettings;
}): LectumExportV1 {
  return {
    app: APP_NAME,
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: args.settings,
    books: args.books.map((book) => ({
      ...book,
      thumbnailDataUrl: book.thumbnailDataUrl ?? null,
    })),
  };
}

export function parseImportPayload(
  serialized: string,
): ImportFailure | ImportSuccess {
  if (new Blob([serialized]).size > MAX_IMPORT_BYTES) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isRecord(parsed)) return { ok: false, reason: "invalid" };
    if (parsed.app !== APP_NAME) return { ok: false, reason: "not_lectum" };
    if (parsed.version !== EXPORT_SCHEMA_VERSION) {
      return { ok: false, reason: "unsupported_version" };
    }
    if (
      !isIsoDateTime(parsed.exportedAt) ||
      !isSettingsCandidate(parsed.settings)
    ) {
      return { ok: false, reason: "invalid" };
    }
    if (
      !Array.isArray(parsed.books) ||
      parsed.books.length > MAX_IMPORT_BOOKS
    ) {
      return { ok: false, reason: "invalid" };
    }
    if (!parsed.books.every(isBookCandidate)) {
      return { ok: false, reason: "invalid" };
    }

    const ids = new Set(parsed.books.map((book) => book.id));
    if (ids.size !== parsed.books.length) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      payload: {
        app: APP_NAME,
        version: EXPORT_SCHEMA_VERSION,
        exportedAt: parsed.exportedAt,
        settings: parsed.settings,
        books: parsed.books.map((book) => ({
          ...book,
          thumbnailDataUrl: book.thumbnailDataUrl ?? null,
        })),
      },
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
