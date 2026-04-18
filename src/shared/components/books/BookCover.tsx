interface BookCoverProps {
  title: string;
  author: string;
  thumbnailDataUrl?: string | null;
  className?: string;
}

export default function BookCover({
  title,
  author,
  thumbnailDataUrl,
  className = "",
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
      className={`flex h-28 w-20 shrink-0 flex-col justify-center gap-1 rounded-2xl border border-subtle bg-tile p-3 ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="text-center text-[13px] font-semibold uppercase leading-tight tracking-wide text-strong">
        {title}
      </span>
      <span className="text-center text-[11px] uppercase leading-tight tracking-wide text-soft">
        {author}
      </span>
    </div>
  );
}
