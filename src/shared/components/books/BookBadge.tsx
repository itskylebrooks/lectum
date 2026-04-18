import type { ReactNode } from 'react';

interface BookBadgeProps {
  children: ReactNode;
  tone?:
    | 'neutral'
    | 'soft'
    | 'loved'
    | 'liked'
    | 'mixed'
    | 'disliked'
    | 'abandoned';
}

const toneClasses: Record<NonNullable<BookBadgeProps['tone']>, string> = {
  neutral: 'border-subtle bg-control text-strong',
  soft: 'border-subtle bg-surface-alt text-muted',
  loved:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  liked:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  mixed:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  disliked:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300',
  abandoned:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
};

export default function BookBadge({ children, tone = 'neutral' }: BookBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
