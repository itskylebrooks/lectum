import LibraryPage from '@/features/library';
import { useBookStore } from '@/shared/store/books';
import { useLibraryUiStore } from '@/shared/store/libraryUi';
import { usePreferencesStore } from '@/shared/store/preferences';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LibraryPage', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ dateFormat: 'DMY' });
    useLibraryUiStore.setState({ filtersOpen: false });
    useBookStore.setState({
      books: [
        {
          id: 'finished-1',
          title: 'Finished Book',
          author: 'Ursula Le Guin',
          publicationYear: 1974,
          format: 'print',
          category: 'fiction',
          isReading: false,
          dateFinished: '2026-04-15',
          rating: 'loved',
          createdAt: '2026-04-01T12:00:00.000Z',
          updatedAt: '2026-04-15T12:00:00.000Z',
          thumbnailDataUrl: null,
        },
      ],
      loading: false,
      initialized: true,
      editorState: { open: false, mode: 'create', initialStatus: 'next' },
      finishBookId: null,
      deleteBookId: null,
      openCreate: vi.fn(),
      openEdit: vi.fn(),
      closeEditor: vi.fn(),
      openFinish: vi.fn(),
      closeFinish: vi.fn(),
      openDelete: vi.fn(),
      closeDelete: vi.fn(),
      saveBook: vi.fn(),
      finishBook: vi.fn(),
      startBook: vi.fn(),
      reopenBook: vi.fn(),
      deleteBook: vi.fn(),
      initialize: vi.fn(),
      refresh: vi.fn(),
      importBooks: vi.fn(),
    });
  });

  it('keeps filters hidden until requested and reveals manage actions on demand', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<LibraryPage />);

    expect(screen.queryByDisplayValue('All ratings')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();

    useLibraryUiStore.setState({ filtersOpen: true });
    rerender(<LibraryPage />);
    expect(screen.getByDisplayValue('All ratings')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Manage' })[0]!);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
