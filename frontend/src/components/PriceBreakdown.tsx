import { money } from "@/lib/format";
import type { Quote } from "@/lib/types";

export default function PriceBreakdown({ q }: { q: Quote }) {
  const row = (label: string, v: number) => (
    <div className="flex justify-between"><span className="underline decoration-dotted">{label}</span><span>{money(v)}</span></div>
  );
  return (
    <div className="space-y-3 text-[15px]">
      {row(`${money(q.nightly_rate)} × ${q.nights} night${q.nights > 1 ? "s" : ""}`, q.subtotal)}
      {q.cleaning_fee > 0 && row("Cleaning fee", q.cleaning_fee)}
      {row("Airbnb service fee", q.service_fee)}
      <div className="flex justify-between border-t border-hairline pt-4 text-base font-semibold">
        <span>Total</span><span>{money(q.total)}</span>
      </div>
    </div>
  );
}
