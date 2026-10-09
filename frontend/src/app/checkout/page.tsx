import { Suspense } from "react";
import CheckoutView from "@/components/CheckoutView";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <CheckoutView />
    </Suspense>
  );
}
