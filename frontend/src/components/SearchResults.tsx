"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingCardData, ListingPage } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { nightsBetween } from "@/lib/dates";
import ListingCard from "./ListingCard";
import CategoryBar from "./CategoryBar";
import FiltersModal, { FILTER_KEYS } from "./FiltersModal";

const PAGE_SIZE = 12;

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

      <div className="px-5 pt-6 md:px-10">
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

        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((l) => <ListingCard key={l.id} listing={l} nights={nights} />)}
          {loading && Array.from({ length: items.length ? 0 : 8 }).map((_, i) => (
            <div key={i} className="aspect-[1.05/1] animate-pulse rounded-card bg-soft" />
          ))}
        </div>

        <div ref={sentinel} className="h-10" />
        {loading && items.length > 0 && <p className="pb-6 text-center text-sm text-muted">Loading more…</p>}
        {!hasMore && items.length > 0 && <p className="pb-6 text-center text-sm text-muted">You’ve seen all {total} places</p>}
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} query={key} onApply={push} />
    </>
  );
}
