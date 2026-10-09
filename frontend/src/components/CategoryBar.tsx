"use client";

// Line icons in the style of Airbnb's category bar (24px outlines).
const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);

export const CATEGORIES = [
  { label: "Trending", icon: icon(<path d="M12 3c.5 3.5 4.5 5 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3-.5-3 0-5.5.5-8.5Z" />) },
  { label: "Beachfront", icon: icon(<><path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" /><path d="M8 17 12.5 5M5 9.5a8 8 0 0 1 15 2.5L5 9.5Z" /></>) },
  { label: "Cabins", icon: icon(<><path d="M3 11 12 4l9 7M5 9.5V20h14V9.5" /><path d="M5 13h14M5 16.5h14M10 20v-4h4v4" /></>) },
  { label: "Amazing views", icon: icon(<><path d="m3 19 6-9 4 5 2.5-3L21 19H3Z" /><circle cx="16.5" cy="6.5" r="1.8" /></>) },
  { label: "Design", icon: icon(<><path d="M4 20h16M6 20V9M10 20V9M14 20V9M18 20V9M3 9h18L12 4 3 9Z" /></>) },
  { label: "Tropical", icon: icon(<><path d="M12 21c0-5 .5-9 1.5-12" /><path d="M13.5 9C11 6 7 6 4.5 8c3-.3 5.5.4 9 1ZM13.5 9c2-3 6-3.5 8-1.5-3-.5-5 .3-8 1.5ZM13.5 9c-.5-3 1-5.5 3.5-6.5-1.5 2-2.5 4-3.5 6.5Z" /><path d="M8 21h10" /></>) },
  { label: "Iconic cities", icon: icon(<><path d="M3 21h18M5 21V10h4v11M9 21V5h6v16M15 21v-8h4v8" /><path d="M11 8h2M11 11h2M11 14h2" /></>) },
];

const SlidersIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M2 4.5h7M13 4.5h1M2 11.5h1M7 11.5h7" /><circle cx="11" cy="4.5" r="2" /><circle cx="5" cy="11.5" r="2" />
  </svg>
);

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
              {c.icon}
              {c.label}
            </button>
          );
        })}
      </div>
      <button onClick={onOpenFilters} className="mb-1 flex shrink-0 items-center gap-2 rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold hover:border-ink">
        <SlidersIcon /> Filters
        {filterCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-surface">{filterCount}</span>}
      </button>
    </div>
  );
}
