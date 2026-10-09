import { Suspense } from "react";
import TripsView from "@/components/TripsView";

export default function TripsPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <TripsView />
    </Suspense>
  );
}
