import {
  createBook,
  finishBook,
  reopenBook,
  startBook,
  updateBook,
  type BookDomainDependencies,
} from "@/domain/books";
import { describe, expect, it } from "vitest";

const dependencies: BookDomainDependencies = {
  createId: () => "generated-id",
  now: () => new Date("2026-08-09T12:00:00.000Z"),
};

describe("book domain", () => {
  it("creates and updates normalized books", () => {
    const created = createBook(
      {
        title: "  Piranesi ",
        author: " Susanna Clarke  ",
        publicationYear: 2020,
        format: "digital",
        category: "fiction",
        isReading: false,
        thumbnailDataUrl: null,
      },
      dependencies,
    );

    expect(created).toMatchObject({
      id: "generated-id",
      title: "Piranesi",
      author: "Susanna Clarke",
      isReading: false,
      createdAt: "2026-08-09T12:00:00.000Z",
    });

    expect(
      updateBook(
        created,
        {
          title: "Piranesi",
          author: "Susanna Clarke",
          publicationYear: 2020,
          format: "print",
          category: "fiction",
          isReading: true,
          thumbnailDataUrl: null,
        },
        dependencies,
      ),
    ).toMatchObject({ format: "print", isReading: true });
  });

  it("owns the reading lifecycle transitions", () => {
    const queued = createBook(
      {
        title: "A Book",
        author: "An Author",
        publicationYear: 2024,
        format: "print",
        category: "fiction",
        isReading: false,
        thumbnailDataUrl: null,
      },
      dependencies,
    );
    const reading = startBook(queued, dependencies);
    expect(reading?.isReading).toBe(true);

    const finished = finishBook(
      reading!,
      { dateFinished: "2026-08-09", rating: "loved" },
      dependencies,
    );
    expect(finished).toMatchObject({
      isReading: false,
      dateFinished: "2026-08-09",
      rating: "loved",
    });
    expect(startBook(finished, dependencies)).toBeNull();

    const reopened = reopenBook(finished, dependencies);
    expect(reopened.isReading).toBe(true);
    expect(reopened.dateFinished).toBeUndefined();
    expect(reopened.rating).toBeUndefined();
  });
});
