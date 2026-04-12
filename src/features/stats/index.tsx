import StatCard from '@/shared/components/layout/StatCard';
import { buildFinishedBookStats } from '@/shared/utils/stats';
import { formatMonthLabel, formatYearLabel } from '@/shared/utils/date';
import { useBookStore } from '@/shared/store/books';

function BarList({
  items,
  formatLabel = (label: string) => label,
}: {
  items: { label: string; count: number }[];
  formatLabel?: (label: string) => string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm text-muted">
            <span>{formatLabel(item.label)}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-progress-track">
            <div
              className="h-2 rounded-full bg-progress"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const books = useBookStore((state) => state.books);
  const stats = buildFinishedBookStats(books);

  if (stats.finished.length === 0) {
    return (
      <div className="mt-4 rounded-[1.75rem] border border-subtle bg-surface p-8 text-center">
        <p className="text-lg font-medium text-strong">Stats appear once you finish books.</p>
        <p className="mt-2 text-sm text-muted">
          Lectum keeps the stats honest by only counting books with a finish date and rating.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Finished books" value={stats.finished.length} />
        <StatCard
          label="Top author"
          value={stats.topAuthors[0]?.author ?? '—'}
          note={stats.topAuthors[0] ? `${stats.topAuthors[0].count} books finished` : '—'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Books per month</h2>
          <div className="mt-4">
            <BarList items={stats.perMonth} formatLabel={formatMonthLabel} />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Books per year</h2>
          <div className="mt-4">
            <BarList items={stats.perYear} formatLabel={formatYearLabel} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Rating distribution</h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {Object.entries(stats.ratingDistribution).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-subtle px-4 py-3">
                <span className="capitalize">{label}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Category split</h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {Object.entries(stats.categoryBreakdown).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-subtle px-4 py-3">
                <span className="capitalize">{label}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Format breakdown</h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {Object.entries(stats.formatBreakdown).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-subtle px-4 py-3">
                <span className="capitalize">{label}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Publication decades</h2>
          <div className="mt-4">
            <BarList items={stats.decadeSpread} />
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-subtle bg-surface p-5">
        <h2 className="text-lg font-semibold text-strong">Most-read authors</h2>
        <div className="mt-4 space-y-3 text-sm text-muted">
          {stats.topAuthors.map((author) => (
            <div key={author.author} className="flex items-center justify-between rounded-2xl border border-subtle px-4 py-3">
              <span>{author.author}</span>
              <span>{author.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
