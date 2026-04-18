import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: LucideIcon;
}

export default function StatCard({ label, value, note, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{label}</span>
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>
      <p className="mt-1 text-2xl font-semibold text-strong">{value}</p>
      {note ? <div className="mt-2 text-sm text-muted">{note}</div> : null}
    </div>
  );
}
