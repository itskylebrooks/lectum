import App from '@/App';
import { useBookStore } from '@/shared/store/books';
import { usePreferencesStore } from '@/shared/store/preferences';
import { resetStoredBooksForTests, saveStoredBook } from '@/shared/utils/booksDb';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

describe('App flow', () => {
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
    usePreferencesStore.setState({ dateFormat: 'DMY' });
  });

  it('moves a backlog book through reading into the library', async () => {
    await saveStoredBook({
      id: 'queued',
      title: 'Queued Book',
      author: 'Ada Lovelace',
      publicationYear: 2024,
      format: 'print',
      category: 'fiction',
      isReading: false,
      thumbnailDataUrl: null,
      createdAt: '2026-04-10T12:00:00.000Z',
      updatedAt: '2026-04-10T12:00:00.000Z',
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText('Queued Book');
    await user.click(screen.getByRole('button', { name: 'Manage' }));
    await user.click(screen.getByRole('button', { name: /start reading/i }));
    await user.click(screen.getAllByRole('link', { name: /home/i })[0]!);

    await screen.findByRole('button', { name: 'Manage' });
    await user.click(screen.getByRole('button', { name: 'Manage' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));
    await user.click(screen.getByRole('button', { name: /loved/i }));
    await user.click(screen.getByRole('button', { name: /save completion/i }));

    await user.click(screen.getAllByRole('link', { name: /library/i })[0]!);
    await screen.findByText('Queued Book');
    expect(screen.getAllByText('Loved').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Print').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fiction').length).toBeGreaterThan(0);
  });
});
