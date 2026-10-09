"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "./Modal";
import DateRangePicker from "./DateRangePicker";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { fmtShort } from "@/lib/dates";

const CITIES = ["Goa","Manali","Shimla","Mumbai","New Delhi","Jaipur","Udaipur","Rishikesh","Munnar","Bengaluru","Mussoorie","Chandigarh"];
const OWN_PARAMS = ["q", "check_in", "check_out", "guests"];

function Section({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-hairline p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{label}</h3>
        <span className="text-sm text-muted">{value}</span>
      </div>
      {children}
    </section>
  );
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const sp = useSearchParams();
  const desktop = useIsDesktop();

  const [where, setWhere] = useState("");
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);

  // Re-seed from the URL each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setWhere(sp.get("q") ?? "");
    setStart(sp.get("check_in"));
    setEnd(sp.get("check_out"));
    setGuests(Number(sp.get("guests") ?? 1) || 1);
  }, [open, sp]);

  const submit = () => {
    const next = new URLSearchParams(sp.toString()); // keep existing filters
    OWN_PARAMS.forEach((k) => next.delete(k));
    if (where.trim()) next.set("q", where.trim());
    if (start && end) { next.set("check_in", start); next.set("check_out", end); }
    if (guests > 1) next.set("guests", String(guests));
    next.delete("page");
    onClose();
    router.push(`/search?${next.toString()}`);
  };

  const matches = CITIES.filter((c) => c.toLowerCase().includes(where.trim().toLowerCase()));

  return (
    <Modal
      open={open} onClose={onClose} title="Search" wide
      footer={
        <>
          <button className="font-semibold underline" onClick={() => { setWhere(""); setStart(null); setEnd(null); setGuests(1); }}>Clear all</button>
          <button onClick={submit} className="rounded-lg bg-rausch px-8 py-3 font-semibold text-white active:scale-95">Search</button>
        </>
      }
    >
      <Section label="Where" value={where || "Anywhere"}>
        <input
          value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Search destinations"
          className="w-full rounded-xl border border-hairline px-4 py-3 outline-none focus:border-ink"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {matches.map((c) => (
            <button key={c} onClick={() => setWhere(c)} className="rounded-full border border-hairline px-4 py-1.5 text-sm hover:border-ink">{c}</button>
          ))}
        </div>
      </Section>

      <Section label="When" value={start && end ? `${fmtShort(start)} – ${fmtShort(end)}` : start ? `${fmtShort(start)} – ?` : "Add dates"}>
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} months={desktop ? 2 : 1} />
      </Section>

      <Section label="Who" value={`${guests} guest${guests > 1 ? "s" : ""}`}>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Guests</p><p className="text-sm text-muted">Ages 13 or above, and children</p></div>
          <div className="flex items-center gap-4">
            <button disabled={guests <= 1} onClick={() => setGuests(guests - 1)} className="h-8 w-8 rounded-full border border-muted text-lg disabled:opacity-30">−</button>
            <span className="w-4 text-center">{guests}</span>
            <button disabled={guests >= 16} onClick={() => setGuests(guests + 1)} className="h-8 w-8 rounded-full border border-muted text-lg disabled:opacity-30">+</button>
          </div>
        </div>
      </Section>
    </Modal>
  );
}
