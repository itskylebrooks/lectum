import type {
  BookEditorValues,
  BookFinishValues,
  BookWithThumbnail,
} from "@/shared/types";

export interface BookDomainDependencies {
  createId: () => string;
  now: () => Date;
}

const defaultDependencies: BookDomainDependencies = {
  createId: () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `book:${Math.random().toString(36).slice(2, 10)}`,
  now: () => new Date(),
};

function updatedAt(dependencies: BookDomainDependencies) {
  return dependencies.now().toISOString();
}

function bookFields(book: BookWithThumbnail) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publicationYear: book.publicationYear,
    format: book.format,
    category: book.category,
    thumbnailId: book.thumbnailId,
    thumbnailDataUrl: book.thumbnailDataUrl,
    createdAt: book.createdAt,
  };
}

export function createBook(
  values: BookEditorValues,
  dependencies = defaultDependencies,
): BookWithThumbnail {
  const timestamp = updatedAt(dependencies);
  const fields = {
    id: dependencies.createId(),
    title: values.title.trim(),
    author: values.author.trim(),
    publicationYear: values.publicationYear,
    format: values.format,
    category: values.category,
    thumbnailDataUrl: values.thumbnailDataUrl ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return values.isReading
    ? { ...fields, isReading: true }
    : { ...fields, isReading: false };
}

export function updateBook(
  existing: BookWithThumbnail,
  values: BookEditorValues,
  dependencies = defaultDependencies,
): BookWithThumbnail {
  const fields = {
    ...bookFields(existing),
    title: values.title.trim(),
    author: values.author.trim(),
    publicationYear: values.publicationYear,
    format: values.format,
    category: values.category,
    thumbnailDataUrl: values.thumbnailDataUrl ?? null,
    updatedAt: updatedAt(dependencies),
  };
  if (existing.dateFinished) {
    return {
      ...fields,
      isReading: false,
      dateFinished: existing.dateFinished,
      rating: existing.rating,
    };
  }
  return values.isReading
    ? { ...fields, isReading: true }
    : { ...fields, isReading: false };
}

export function finishBook(
  existing: BookWithThumbnail,
  values: BookFinishValues,
  dependencies = defaultDependencies,
): BookWithThumbnail {
  return {
    ...bookFields(existing),
    isReading: false,
    dateFinished: values.dateFinished,
    rating: values.rating,
    updatedAt: updatedAt(dependencies),
  };
}

export function startBook(
  existing: BookWithThumbnail,
  dependencies = defaultDependencies,
): BookWithThumbnail | null {
  if (existing.dateFinished) return null;
  return {
    ...bookFields(existing),
    isReading: true,
    updatedAt: updatedAt(dependencies),
  };
}

export function reopenBook(
  existing: BookWithThumbnail,
  dependencies = defaultDependencies,
): BookWithThumbnail {
  return {
    ...bookFields(existing),
    isReading: true,
    dateFinished: undefined,
    rating: undefined,
    updatedAt: updatedAt(dependencies),
  };
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthRelativeDate(base: Date, monthOffset: number) {
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + monthOffset;
  const day = base.getUTCDate();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const maxDay = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth(),
      Math.min(day, maxDay),
    ),
  );
}

export function createStarterBooks(now = new Date()): BookWithThumbnail[] {
  const thisMonthFinished = isoDate(monthRelativeDate(now, 0));
  const lastMonthFinished = isoDate(monthRelativeDate(now, -1));
  const createdAt = now.toISOString();

  return [
    {
      id: "starter-reading-the-stranger-max-frei",
      title: "The Stranger",
      author: "Max Frei",
      publicationYear: 1996,
      format: "print",
      category: "fiction",
      isReading: true,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-steve-jobs-walter-isaacson",
      title: "Steve Jobs",
      author: "Walter Isaacson",
      publicationYear: 2011,
      format: "print",
      category: "non-fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-the-da-vinci-code-dan-brown",
      title: "The Da Vinci Code",
      author: "Dan Brown",
      publicationYear: 2003,
      format: "print",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-next-1984-george-orwell",
      title: "1984",
      author: "George Orwell",
      publicationYear: 1949,
      format: "print",
      category: "fiction",
      isReading: false,
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-finished-master-and-margarita-bulgakov",
      title: "The Master and Margarita",
      author: "Mikhail Bulgakov",
      publicationYear: 1966,
      format: "print",
      category: "fiction",
      isReading: false,
      dateFinished: thisMonthFinished,
      rating: "loved",
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "starter-finished-martin-eden-jack-london",
      title: "Martin Eden",
      author: "Jack London",
      publicationYear: 1908,
      format: "print",
      category: "fiction",
      isReading: false,
      dateFinished: lastMonthFinished,
      rating: "liked",
      thumbnailDataUrl: null,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}
