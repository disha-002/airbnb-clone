"use client";
import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/hostWizard";
import { PinIcon } from "./WizardIcons";
import { SearchIcon } from "../icons";

/**
 * Address box with search-as-you-type suggestions (debounced, stale requests aborted).
 * Arrow keys + Enter pick a suggestion; Enter with nothing highlighted picks the first one.
 */
export default function AddressSearch({
  value, onPick, variant = "landing", autoFocus = false,
}: {
  value: string; onPick: (p: Place) => void; variant?: "landing" | "map"; autoFocus?: boolean;
}) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef(false); // don't search for the prefilled value until the user types

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    if (!touched.current || q.trim().length < 3) { setResults([]); setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchPlaces(q.trim(), ctrl.signal)
        .then((r) => { setResults(r); setActive(-1); setError(null); setLoading(false); })
        .catch((e) => { if (e.name !== "AbortError") { setError(e.message); setLoading(false); } });
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const pick = (p: Place) => {
    touched.current = false;
    setQ(p.label); setOpen(false); setResults([]);
    onPick(p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results.length) { e.preventDefault(); pick(results[Math.max(active, 0)]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const showList = open && q.trim().length >= 3 && touched.current;
  const box = variant === "landing"
    ? "h-[58px] rounded-full border border-ink/60 bg-surface px-5 focus-within:border-2 focus-within:border-ink"
    : "h-16 rounded-full bg-surface px-6 shadow-[0_6px_20px_rgba(0,0,0,0.12)]";

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 ${box} ${showList ? "rounded-b-none rounded-t-[29px]" : ""}`}>
        {variant === "landing" ? <SearchIcon className="h-5 w-5 shrink-0" /> : <PinIcon className="h-6 w-6 shrink-0" />}
        <input
          value={q} autoFocus={autoFocus} placeholder="Enter your address" aria-label="Enter your address"
          role="combobox" aria-expanded={showList} aria-autocomplete="list" aria-controls="address-suggestions"
          onChange={(e) => { touched.current = true; setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
          className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted"
        />
        {loading && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hairline border-t-ink" aria-label="Searching" />}
      </div>
      {showList && (
        <ul id="address-suggestions" role="listbox"
          className="absolute inset-x-0 top-full z-[1000] overflow-hidden rounded-b-[29px] border-x border-b border-hairline bg-surface pb-2 shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
          {error && <li className="px-6 py-3 text-sm text-rausch">{error}</li>}
          {!error && !loading && results.length === 0 && <li className="px-6 py-3 text-sm text-muted">No matching addresses. Try a street or area name.</li>}
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)} onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-4 px-5 py-3 text-left ${i === active ? "bg-soft" : ""}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft"><PinIcon className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-base">{r.main}</span>
                  {r.secondary && <span className="block truncate text-sm text-muted">{r.secondary}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
