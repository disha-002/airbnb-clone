import { Suspense } from "react";
import TripDetail from "@/components/TripDetail";

export default function TripDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-[1100px] animate-pulse rounded-2xl bg-soft" />}>
      <TripDetail />
    </Suspense>
  );
}
