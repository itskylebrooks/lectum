import StatCard from "@/shared/components/layout/StatCard";
import { useBookStore } from "@/shared/store/books";
import {
  formatBookCategoryLabel,
  formatBookFormatLabel,
  formatBookRatingLabel,
} from "@/shared/utils/bookPresentation";
import { formatMonthLabel } from "@/shared/utils/date";
import { buildFinishedBookStats } from "@/shared/utils/stats";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MONTH_KEYS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

function BarList({
  items,
  formatLabel = (label: string) => label,
  compact = false,
  showBars = true,
}: {
  items: { label: string; count: number }[];
  formatLabel?: (label: string) => string;
  compact?: boolean;
  showBars?: boolean;
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
          {showBars ? (
            <div
              className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-progress-track`}
            >
              <div
                className={`${compact ? "h-1.5" : "h-2"} rounded-full bg-progress`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MonthColumnChart({
  items,
}: {
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="grid grid-cols-12 gap-2">
      {items.map((item) => {
        const monthLabel = formatMonthLabel(item.label).split(" ")[0];
        const heightPercent =
          item.count === 0 ? 0 : Math.max((item.count / max) * 100, 8);

        return (
          <div
            key={item.label}
            className="flex min-w-0 flex-col items-center gap-1"
          >
            <div className="relative h-36 w-full">
              {item.count > 0 ? (
                <>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 tabular-nums text-[11px] leading-none text-muted"
                    style={{ bottom: `calc(${heightPercent}% + 4px)` }}
                  >
                    {item.count}
                  </span>
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-md bg-progress"
                    style={{ height: `${heightPercent}%` }}
                  />
                </>
              ) : (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 tabular-nums text-[11px] leading-none text-muted">
                  0
                </span>
              )}
            </div>
            <span className="text-xs text-muted">{monthLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function DecadeColumnChart({
  items,
}: {
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="grid grid-cols-5 gap-2 lg:grid-cols-10">
      {items.map((item) => {
        const heightPercent =
          item.count === 0 ? 0 : Math.max((item.count / max) * 100, 8);

        return (
          <div
            key={item.label}
            className="flex min-w-0 flex-col items-center gap-1"
          >
            <div className="relative h-36 w-full">
              {item.count > 0 ? (
                <>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 tabular-nums text-[11px] leading-none text-muted"
                    style={{ bottom: `calc(${heightPercent}% + 4px)` }}
                  >
                    {item.count}
                  </span>
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-md bg-progress"
                    style={{ height: `${heightPercent}%` }}
                  />
                </>
              ) : (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 tabular-nums text-[11px] leading-none text-muted">
                  0
                </span>
              )}
            </div>
            <span className="text-xs text-muted">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage() {
  const books = useBookStore((state) => state.books);
  const stats = buildFinishedBookStats(books);

  const availableYears = useMemo(
    () => stats.perYear.map((item) => Number(item.label)).sort((a, b) => a - b),
    [stats.perYear],
  );
  const latestYear =
    availableYears[availableYears.length - 1] ?? new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(latestYear);

  useEffect(() => {
    setSelectedYear(latestYear);
  }, [latestYear]);

  const monthCountByLabel = useMemo(
    () => new Map(stats.perMonth.map((item) => [item.label, item.count])),
    [stats.perMonth],
  );

  const monthsForSelectedYear = useMemo(() => {
    return MONTH_KEYS.map((monthKey) => {
      const label = `${selectedYear}-${monthKey}`;
      return {
        label,
        count: monthCountByLabel.get(label) ?? 0,
      };
    });
  }, [monthCountByLabel, selectedYear]);

  const selectedYearTotal =
    stats.perYear.find((item) => Number(item.label) === selectedYear)?.count ??
    0;
  const selectedYearIndex = availableYears.indexOf(selectedYear);
  const currentYear = new Date().getFullYear();
  const finishedThisYear =
    stats.perYear.find((item) => Number(item.label) === currentYear)?.count ??
    0;

  const centuryGroups = useMemo(() => {
    const groups = new Map<number, { label: string; count: number }[]>();

    for (const item of stats.decadeSpread) {
      const decade = Number.parseInt(item.label, 10);
      if (Number.isNaN(decade)) continue;
      const century = Math.floor(decade / 100) * 100;
      const existing = groups.get(century) ?? [];
      existing.push(item);
      groups.set(century, existing);
    }

    return [...groups.entries()]
      .map(([century, items]) => ({
        century,
        items: items.sort((left, right) =>
          left.label.localeCompare(right.label),
        ),
      }))
      .sort((left, right) => left.century - right.century);
  }, [stats.decadeSpread]);

  const availableCenturies = centuryGroups.map((group) => group.century);
  const latestCentury =
    availableCenturies[availableCenturies.length - 1] ??
    Math.floor(new Date().getFullYear() / 100) * 100;
  const [selectedCentury, setSelectedCentury] = useState<number>(latestCentury);

  useEffect(() => {
    setSelectedCentury(latestCentury);
  }, [latestCentury]);

  const selectedCenturyIndex = availableCenturies.indexOf(selectedCentury);
  const selectedCenturyItems =
    centuryGroups.find((group) => group.century === selectedCentury)?.items ??
    [];
  const selectedCenturyTotal = selectedCenturyItems.reduce(
    (sum, item) => sum + item.count,
    0,
  );

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
          label={`Finished in ${currentYear}`}
          value={finishedThisYear}
          icon={CalendarDays}
        />
        <StatCard
          label="Top author"
          value={stats.topAuthors[0]?.author ?? "—"}
          icon={Users}
        />
      </section>

      <section className="grid gap-4">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-strong">
              Books per month (Total: {selectedYearTotal})
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => {
                  if (selectedYearIndex > 0)
                    setSelectedYear(availableYears[selectedYearIndex - 1]);
                }}
                disabled={selectedYearIndex <= 0}
                className="rounded-xl border border-subtle p-1 hover-nonaccent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums text-strong">{selectedYear}</span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => {
                  if (selectedYearIndex < availableYears.length - 1)
                    setSelectedYear(availableYears[selectedYearIndex + 1]);
                }}
                disabled={
                  selectedYearIndex < 0 ||
                  selectedYearIndex >= availableYears.length - 1
                }
                className="rounded-xl border border-subtle p-1 hover-nonaccent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 sm:hidden">
            <BarList
              items={monthsForSelectedYear}
              formatLabel={formatMonthLabel}
              compact
              showBars={false}
            />
          </div>
          <div className="mt-7 hidden sm:block">
            <MonthColumnChart items={monthsForSelectedYear} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
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

      <section className="grid gap-4">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <h2 className="text-lg font-semibold text-strong">
            Most-read authors
          </h2>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {stats.topAuthors.map((author) => (
              <div
                key={author.author}
                className="flex items-center justify-between"
              >
                <span className="text-strong">{author.author}</span>
                <span>{author.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="rounded-[1.75rem] border border-subtle bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-strong">
              Publication decades (Total: {selectedCenturyTotal})
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted">
              <button
                type="button"
                aria-label="Previous hundred years"
                onClick={() => {
                  if (selectedCenturyIndex > 0)
                    setSelectedCentury(
                      availableCenturies[selectedCenturyIndex - 1],
                    );
                }}
                disabled={selectedCenturyIndex <= 0}
                className="rounded-xl border border-subtle p-1 hover-nonaccent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums text-strong">
                {selectedCentury}
              </span>
              <button
                type="button"
                aria-label="Next hundred years"
                onClick={() => {
                  if (selectedCenturyIndex < availableCenturies.length - 1)
                    setSelectedCentury(
                      availableCenturies[selectedCenturyIndex + 1],
                    );
                }}
                disabled={
                  selectedCenturyIndex < 0 ||
                  selectedCenturyIndex >= availableCenturies.length - 1
                }
                className="rounded-xl border border-subtle p-1 hover-nonaccent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 sm:hidden">
            <BarList items={selectedCenturyItems} compact />
          </div>
          <div className="mt-7 hidden sm:block">
            <DecadeColumnChart items={selectedCenturyItems} />
          </div>
        </div>
      </section>
    </div>
  );
}
