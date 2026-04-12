import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="rounded-[1.6rem] border border-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-soft">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-strong">{value}</p>
      {note ? <div className="mt-2 text-sm text-muted">{note}</div> : null}
    </div>
  );
}
