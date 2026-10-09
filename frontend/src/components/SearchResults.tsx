"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingCardData, ListingPage } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { nightsBetween } from "@/lib/dates";
import ListingCard from "./ListingCard";
import CategoryBar from "./CategoryBar";
import FiltersModal, { FILTER_KEYS } from "./FiltersModal";

const PAGE_SIZE = 12;

// Leaflet touches `window`, so the map only ever renders in the browser.
const SearchMap = dynamic(() => import("./SearchMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-soft" />,
});

export default function SearchResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user, ready } = useUser();
  const key = sp.toString();

  const [items, setItems] = useState<ListingCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false); // phones: list or map, like Airbnb's floating toggle
  const latestKey = useRef(key);

  const fetchPage = useCallback(async (p: number) => {
    const qs = new URLSearchParams(key);
    qs.set("page", String(p));
    qs.set("page_size", String(PAGE_SIZE));
    return api<ListingPage>(`/listings?${qs.toString()}`);
  }, [key]);

  // New search / filters / user -> reset to page 1.
  useEffect(() => {
    if (!ready) return;
    latestKey.current = key;
    setLoading(true);
    setError(null);
    fetchPage(1)
      .then((r) => {
        if (latestKey.current !== key) return; // stale response
        setItems(r.items); setTotal(r.total); setPage(1); setHasMore(r.has_more);
      })
      .catch((e) => setError(e.message ?? "Something went wrong"))
      .finally(() => setLoading(false));
  }, [key, ready, user?.id, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    fetchPage(page + 1)
      .then((r) => {
        if (latestKey.current !== key) return;
        setItems((prev) => [...prev, ...r.items]); setPage(page + 1); setHasMore(r.has_more);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loading, hasMore, fetchPage, page, key]);

  // Infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const push = (next: URLSearchParams) => { next.delete("page"); router.push(`/search?${next.toString()}`); };
  const setCategory = (c: string | null) => {
    const next = new URLSearchParams(sp.toString());
    c ? next.set("category", c) : next.delete("category");
    push(next);
  };

  const filterCount = FILTER_KEYS.filter((k) => sp.has(k)).length;
  const ci = sp.get("check_in"), co = sp.get("check_out");
  const nights = ci && co ? Math.max(1, nightsBetween(ci, co)) : 1;
  const q = sp.get("q");

  return (
    <>
      <CategoryBar active={sp.get("category")} onSelect={setCategory} filterCount={filterCount} onOpenFilters={() => setFiltersOpen(true)} />

      <div className="px-5 pt-6 md:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-6">
      <div className={showMap ? "hidden lg:block" : ""}>
        <h1 className="mb-5 text-lg font-semibold">
          {loading && items.length === 0 ? "Searching…" : `${total} place${total === 1 ? "" : "s"}${q ? ` in ${q}` : ""}`}
        </h1>

        {error && <p className="py-10 text-center text-muted">{error}</p>}

        {!error && !loading && items.length === 0 && (
          <div className="py-20 text-center">
            <h2 className="text-xl font-semibold">No exact matches</h2>
            <p className="mt-1 text-muted">Try changing or removing some of your filters or dates.</p>
            <button onClick={() => router.push("/search")} className="mt-5 rounded-lg border border-ink px-5 py-2.5 font-semibold">Remove all filters</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((l) => (
            <div key={l.id} onMouseEnter={() => setHoveredId(l.id)} onMouseLeave={() => setHoveredId(null)}>
              <ListingCard listing={l} nights={nights} />
            </div>
          ))}
          {loading && Array.from({ length: items.length ? 0 : 8 }).map((_, i) => (
            <div key={i} className="aspect-[1.05/1] animate-pulse rounded-card bg-soft" />
          ))}
        </div>

        <div ref={sentinel} className="h-10" />
        {loading && items.length > 0 && <p className="pb-6 text-center text-sm text-muted">Loading more…</p>}
        {!hasMore && items.length > 0 && <p className="pb-6 text-center text-sm text-muted">You’ve seen all {total} places</p>}
      </div>

      {/* Desktop: sticky map beside the list. Phones: full-height map when toggled. */}
      <div className={`${showMap ? "block" : "hidden"} h-[calc(100vh-230px)] lg:sticky lg:top-[190px] lg:block lg:h-[calc(100vh-210px)]`}>
        <SearchMap listings={items} nights={nights} hoveredId={hoveredId} />
      </div>
      </div>

      <button onClick={() => { setShowMap(!showMap); window.scrollTo({ top: 0 }); }}
        className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-surface shadow-lg active:scale-95 md:bottom-8 lg:hidden">
        {showMap ? "Show list" : "Show map"}
        {showMap
          ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"><path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z M9 4v13.5 M15 6.5V20" /></svg>}
      </button>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} query={key} onApply={push} />
    </>
  );
}
