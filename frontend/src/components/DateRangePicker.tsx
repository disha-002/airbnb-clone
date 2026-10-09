"use client";
import { useMemo, useState } from "react";
import { BookedRange, iso, parseISO, todayISO } from "@/lib/dates";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Range picker with availability rules:
 *  - past days and already-booked nights can't be a check-in
 *  - a check-out can't be chosen if any night in between is booked
 *  - the check-out day itself may be someone else's check-in day
 */
export default function DateRangePicker({
  start, end, onChange, booked = [], months = 1,
}: {
  start: string | null; end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  booked?: BookedRange[]; months?: number;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = start ? parseISO(start) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = todayISO();

  const isBookedNight = (d: string) => booked.some((r) => d >= r.check_in && d < r.check_out);
  const rangeFree = (a: string, b: string) => !booked.some((r) => a < r.check_out && r.check_in < b);

  const pickingEnd = !!start && !end;
  const isDisabled = (d: string) =>
    d < today ||
    (!pickingEnd && isBookedNight(d)) ||
    (pickingEnd && d > start! && !rangeFree(start!, d));

  const click = (d: string) => {
    if (d < today) return;
    if (!pickingEnd) {
      if (!isBookedNight(d)) onChange(d, null);
    } else if (d <= start!) {
      if (!isBookedNight(d)) onChange(d, null);
    } else if (rangeFree(start!, d)) {
      onChange(start, d);
    }
  };

  const grids = useMemo(
    () =>
      Array.from({ length: months }, (_, i) => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth() + i, 1);
        const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        const cells: (string | null)[] = Array(first.getDay()).fill(null);
        for (let day = 1; day <= count; day++) cells.push(iso(new Date(first.getFullYear(), first.getMonth(), day)));
        return { first, cells };
      }),
    [cursor, months]
  );

  const canGoBack = cursor > new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <div className="select-none">
      <div className="relative flex gap-8">
        <button type="button" disabled={!canGoBack} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="absolute left-0 top-0 z-10 h-8 w-8 rounded-full text-lg hover:bg-soft disabled:opacity-20" aria-label="Previous month">‹</button>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="absolute right-0 top-0 z-10 h-8 w-8 rounded-full text-lg hover:bg-soft" aria-label="Next month">›</button>

        {grids.map(({ first, cells }) => (
          <div key={first.toISOString()} className="flex-1">
            <p className="mb-3 text-center font-semibold">
              {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 text-center text-xs text-muted">
              {WEEK.map((w, i) => <span key={i} className="py-2">{w}</span>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const disabled = isDisabled(d);
                const isStart = d === start;
                const isEnd = d === end;
                const inRange = !!start && !!end && d > start && d < end;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => click(d)}
                    className={`mx-auto my-0.5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium
                      ${isStart || isEnd ? "bg-ink text-white" : inRange ? "rounded-none bg-soft" : "hover:border hover:border-ink"}
                      ${disabled ? "cursor-not-allowed text-black/25 line-through hover:border-0" : ""}
                      ${d === today && !isStart && !isEnd ? "font-bold" : ""}`}
                  >
                    {Number(d.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
