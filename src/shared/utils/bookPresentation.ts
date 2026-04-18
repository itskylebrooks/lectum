import type { BookCategory, BookFormat, BookRating } from '@/shared/types';

export const RATING_ORDER: BookRating[] = ['loved', 'liked', 'mixed', 'disliked', 'abandoned'];

export const RATING_META: Record<
  BookRating,
  {
    label: string;
    shortLabel: string;
    description: string;
    tone: 'loved' | 'liked' | 'mixed' | 'disliked' | 'abandoned';
  }
> = {
  loved: {
    label: 'Loved',
    shortLabel: 'Loved',
    description: "Stayed with me; I'd reread or recommend it.",
    tone: 'loved',
  },
  liked: {
    label: 'Liked',
    shortLabel: 'Liked',
    description: 'Enjoyed it and I am glad I read it.',
    tone: 'liked',
  },
  mixed: {
    label: 'Mixed',
    shortLabel: 'Mixed',
    description: 'Some parts worked, some did not.',
    tone: 'mixed',
  },
  disliked: {
    label: 'Disliked',
    shortLabel: 'Disliked',
    description: 'I struggled with it or lost interest.',
    tone: 'disliked',
  },
  abandoned: {
    label: 'Abandoned',
    shortLabel: 'Abandoned',
    description: 'I chose to stop and move on.',
    tone: 'abandoned',
  },
};

export function formatBookFormatLabel(format: BookFormat) {
  switch (format) {
    case 'print':
      return 'Print';
    case 'digital':
      return 'Digital';
    case 'audiobook':
      return 'Audiobook';
    default:
      return format;
  }
}

export function formatBookCategoryLabel(category: BookCategory) {
  return category === 'non-fiction' ? 'Non-fiction' : 'Fiction';
}

export function formatBookRatingLabel(rating: BookRating) {
  return RATING_META[rating].label;
}

export function getBookRatingFromIndex(index: number): BookRating {
  return RATING_ORDER[Math.max(0, Math.min(RATING_ORDER.length - 1, index))]!;
}

export function getBookRatingIndex(rating: BookRating) {
  return RATING_ORDER.indexOf(rating);
}
