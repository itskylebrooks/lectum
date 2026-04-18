import FinishBookModal from '@/shared/components/books/FinishBookModal';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('FinishBookModal', () => {
  it('uses the slider selection when saving a finished book', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <FinishBookModal
        open
        book={{
          id: 'book-1',
          title: 'The Left Hand of Darkness',
          author: 'Ursula Le Guin',
          publicationYear: 1969,
          format: 'print',
          category: 'fiction',
          isReading: true,
          createdAt: '2026-04-01T12:00:00.000Z',
          updatedAt: '2026-04-01T12:00:00.000Z',
          thumbnailDataUrl: null,
        }}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    expect(screen.getAllByText('Liked').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Abandoned' }));
    await user.click(screen.getByRole('button', { name: /save completion/i }));

    expect(onSave).toHaveBeenCalledWith({
      dateFinished: expect.any(String),
      rating: 'abandoned',
    });
    expect(onClose).toHaveBeenCalled();
  });
});
