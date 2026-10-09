import { Suspense } from "react";
import ListingView from "@/components/ListingView";

export default function ListingPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <ListingView />
    </Suspense>
  );
}
