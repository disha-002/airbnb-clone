"use client";

export const CATEGORIES = [
  { label: "Trending", icon: "🔥" },
  { label: "Beachfront", icon: "🏖️" },
  { label: "Cabins", icon: "🛖" },
  { label: "Amazing views", icon: "🏔️" },
  { label: "Design", icon: "🏛️" },
  { label: "Tropical", icon: "🌴" },
  { label: "Iconic cities", icon: "🌆" },
];

export default function CategoryBar({
  active, onSelect, filterCount, onOpenFilters,
}: {
  active: string | null; onSelect: (c: string | null) => void;
  filterCount: number; onOpenFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-hairline px-5 md:px-10">
      <div className="no-scrollbar flex flex-1 gap-8 overflow-x-auto">
        {CATEGORIES.map((c) => {
          const on = active === c.label;
          return (
            <button
              key={c.label}
              onClick={() => onSelect(on ? null : c.label)}
              className={`flex shrink-0 flex-col items-center gap-1 border-b-2 pb-3 pt-2 text-xs font-medium ${on ? "border-ink text-ink" : "border-transparent text-muted hover:border-hairline hover:text-ink"}`}
            >
              <span className="text-2xl">{c.icon}</span>
              {c.label}
            </button>
          );
        })}
      </div>
      <button onClick={onOpenFilters} className="mb-1 flex shrink-0 items-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold hover:border-ink">
        ⚙︎ Filters
        {filterCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-white">{filterCount}</span>}
      </button>
    </div>
  );
}
