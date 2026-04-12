interface BookCoverProps {
  title: string;
  author: string;
  thumbnailDataUrl?: string | null;
  className?: string;
}

function authorFallback(title: string) {
  return title.slice(0, 2).toUpperCase();
}

function initialsFromTitle(title: string) {
  const letters = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return letters || authorFallback(title);
}

export default function BookCover({
  title,
  author,
  thumbnailDataUrl,
  className = '',
}: BookCoverProps) {
  if (thumbnailDataUrl) {
    return (
      <img
        src={thumbnailDataUrl}
        alt={`Cover for ${title} by ${author}`}
        className={`h-28 w-20 rounded-2xl border border-subtle object-cover bg-subtle ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`flex h-28 w-20 shrink-0 flex-col justify-between rounded-2xl border border-subtle bg-tile p-3 ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="text-xs uppercase tracking-[0.24em] text-soft">Lectum</span>
      <span className="text-xl font-semibold text-strong">{initialsFromTitle(title)}</span>
    </div>
  );
}
