import { useBookStore } from '@/shared/store/books';
import { resetStoredBooksForTests } from '@/shared/utils/booksDb';
import { beforeEach, describe, expect, it } from 'vitest';

describe('book store', () => {
  beforeEach(() => {
    resetStoredBooksForTests();
    useBookStore.setState({
      books: [],
      loading: false,
      initialized: false,
      editorState: { open: false, mode: 'create', initialStatus: 'next' },
      finishBookId: null,
      deleteBookId: null,
    });
  });

  it('moves a book through next, reading, and finished states', async () => {
    await useBookStore.getState().saveBook({
      title: 'Lectum',
      author: 'Kyle Brooks',
      publicationYear: 2026,
      format: 'print',
      category: 'non-fiction',
      isReading: false,
      thumbnailDataUrl: null,
    });

    const created = useBookStore.getState().books[0];
    expect(created?.isReading).toBe(false);
    expect(created?.dateFinished).toBeUndefined();

    await useBookStore.getState().startBook(created!.id);
    expect(useBookStore.getState().books[0]?.isReading).toBe(true);

    await useBookStore.getState().finishBook(created!.id, {
      dateFinished: '2026-04-12',
      rating: 'liked',
    });

    const finished = useBookStore.getState().books[0];
    expect(finished?.isReading).toBe(false);
    expect(finished?.rating).toBe('liked');

    await useBookStore.getState().reopenBook(created!.id);
    const reopened = useBookStore.getState().books[0];
    expect(reopened?.isReading).toBe(true);
    expect(reopened?.dateFinished).toBeUndefined();
  });
});
