import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface DropdownSelectOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownSelectProps<T extends string> {
  label: string;
  value: T;
  options: Array<DropdownSelectOption<T>>;
  onChange: (value: T) => void;
}

export default function DropdownSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? options[0]!;
  }, [options, value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="space-y-2">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-soft">
        {label}
      </p>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-subtle bg-transparent px-3 text-left text-sm font-medium text-strong outline-none transition-colors duration-150 hover-nonaccent focus:border-contrast"
        >
          <span className="truncate">{selectedOption.label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-soft" />
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-subtle bg-surface-elevated shadow-elevated">
            <div
              className="max-h-64 overflow-y-auto p-2"
              role="listbox"
              aria-label={label}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors duration-150 ${isSelected ? "bg-accent text-inverse shadow-elevated" : "text-strong hover-nonaccent"}`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
