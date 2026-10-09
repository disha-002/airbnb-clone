import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <SearchResults />
    </Suspense>
  );
}
