import StatCard from "@/shared/components/layout/StatCard";
import { useBookStore } from "@/shared/store/books";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
  formatBookRatingLabel,
} from "@/shared/utils/bookPresentation";
import { formatMonthLabel, formatYearLabel } from "@/shared/utils/date";
import { buildFinishedBookStats } from "@/shared/utils/stats";
import { BookOpen, CalendarDays, Users } from "lucide-react";

function BarList({
  items,
  formatLabel = (label: string) => label,
  compact = false,
}: {
  items: { label: string; count: number }[];
  formatLabel?: (label: string) => string;
  compact?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm text-muted">
            <span>{formatLabel(item.label)}</span>
            <span>{item.count}</span>
          </div>
          <div
            className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-progress-track`}
          >
            <div
              className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-progress`}
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
        <p className="text-lg font-medium text-strong">
          Stats appear once you finish books.
        </p>
        <p className="mt-2 text-sm text-muted">
          Lectum keeps the stats honest by only counting books with a finish
          date and rating.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Finished books"
          value={stats.finished.length}
          icon={BookOpen}
        />
        <StatCard
          label="Finished this year"
          value={
            stats.perYear.find(
              (item) => item.label === String(new Date().getFullYear()),
            )?.count ?? 0
          }
          icon={CalendarDays}
        />
        <StatCard
          label="Top author"
          value={stats.topAuthors[0]?.author ?? "—"}
          icon={Users}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Books per month</h2>
          <div className="mt-4">
            <BarList
              items={stats.perMonth}
              formatLabel={formatMonthLabel}
              compact
            />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Books per year</h2>
          <div className="mt-4">
            <BarList
              items={stats.perYear}
              formatLabel={formatYearLabel}
              compact
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Ratings</h2>
          <div className="mt-4">
            <BarList
              items={Object.entries(stats.ratingDistribution).map(
                ([label, count]) => ({
                  label,
                  count,
                }),
              )}
              formatLabel={(label) =>
                formatBookRatingLabel(
                  label as Parameters<typeof formatBookRatingLabel>[0],
                )
              }
              compact
            />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Categories</h2>
          <div className="mt-4">
            <BarList
              items={Object.entries(stats.categoryBreakdown).map(
                ([label, count]) => ({
                  label,
                  count,
                }),
              )}
              formatLabel={(label) =>
                formatBookCategoryLabel(
                  label as Parameters<typeof formatBookCategoryLabel>[0],
                )
              }
              compact
            />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">Formats</h2>
          <div className="mt-4">
            <BarList
              items={Object.entries(stats.formatBreakdown).map(
                ([label, count]) => ({
                  label,
                  count,
                }),
              )}
              formatLabel={(label) =>
                formatBookFormatLabel(
                  label as Parameters<typeof formatBookFormatLabel>[0],
                )
              }
              compact
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">
            Most-read authors
          </h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {stats.topAuthors.map((author) => (
              <div
                key={author.author}
                className="flex items-center justify-between border-b border-subtle/70 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-strong">{author.author}</span>
                <span>{author.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">
            Publication decades
          </h2>
          <div className="mt-4">
            <BarList items={stats.decadeSpread} compact />
          </div>
        </div>
      </section>
    </div>
  );
}
