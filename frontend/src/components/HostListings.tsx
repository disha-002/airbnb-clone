"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { useHostData } from "@/lib/hosting";
import { useHostDraft } from "@/lib/hostWizard";
import type { HostListing } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { StarIcon } from "./icons";
import Modal from "./Modal";
import { StructureIcon } from "./become-a-host/WizardIcons";

/* eslint-disable @next/next/no-img-element */
export default function HostListings() {
  const toast = useToast();
  const { listings, reload } = useHostData();
  const [removing, setRemoving] = useState<HostListing | null>(null);
  const [busy, setBusy] = useState(false);
  const { draft } = useHostDraft();
  const inProgress = draft && (draft.structure || draft.address || draft.photo_urls.length > 0);

  const askRemove = (l: HostListing) => {
    if (l.upcoming_bookings > 0) {
      // Same rule as Airbnb (and the API): reservations must be cancelled or completed first.
      toast(`This listing has ${l.upcoming_bookings} upcoming reservation${l.upcoming_bookings > 1 ? "s" : ""}, so it can’t be removed yet`);
      return;
    }
    setRemoving(l);
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await api(`/host/listings/${removing.id}`, { method: "DELETE" });
      toast("Listing removed");
      setRemoving(null);
      reload();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-8 md:px-10 md:pt-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold tracking-tight">Your listings</h1>
        <Link href="/host/new" aria-label="Create a new listing"
          className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-surface hover:opacity-90">
          <span className="text-lg leading-none">+</span> Create listing
        </Link>
      </div>

      {inProgress && (
        <Link href={`/become-a-host/${draft.step}`} className="mb-8 flex items-center gap-4 rounded-2xl border border-hairline p-4 transition hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
          {draft.photo_urls[0]
            ? <img src={draft.photo_urls[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-soft"><StructureIcon name={draft.structure} className="h-8 w-8" /></span>}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-xs font-semibold text-muted"><span className="h-2 w-2 rounded-full bg-[#e07912]" />In progress</span>
            <span className="mt-1 block truncate text-base font-semibold">{draft.title || `Your ${(draft.structure || "listing").toLowerCase()}${draft.city ? ` in ${draft.city}` : ""}`}</span>
          </span>
          <span className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface">Continue</span>
        </Link>
      )}

      {listings === null && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="aspect-[1.05/1] animate-pulse rounded-2xl bg-soft" />)}</div>
      )}

      {listings?.length === 0 && (
        <div className="rounded-2xl bg-soft px-6 py-16 text-center">
          <p className="text-lg font-semibold">You haven’t listed anything yet</p>
          <p className="mt-1 text-muted">Create your first listing and start welcoming guests.</p>
          <Link href="/host/new" className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-surface">Create listing</Link>
        </div>
      )}

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {listings?.map((l) => (
          <article key={l.id}>
            <Link href={`/host/${l.id}/edit`} className="relative block">
              <img src={l.cover_url} alt="" className="aspect-[1.05/1] w-full rounded-2xl object-cover" />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#222]">
                <span className="h-2 w-2 rounded-full bg-[#008A05]" />Listed
              </span>
              {l.discount_pct > 0 && <span className="absolute right-3 top-3 rounded-full bg-rausch px-3 py-1 text-xs font-semibold text-white">{l.discount_pct}% off</span>}
            </Link>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{l.title}</p>
                <p className="text-sm text-muted">{l.property_type} · {l.city}, {l.country}</p>
                <p className="mt-1 flex items-center gap-1 text-sm">
                  {l.discount_pct > 0 && <s className="text-muted">{money(l.price_per_night)}</s>}
                  <span className="font-semibold">{money(l.price_per_night - Math.round((l.price_per_night * l.discount_pct) / 100))}</span> night
                  <span className="text-muted">·</span>
                  {l.rating ? <><StarIcon className="h-3 w-3" /> {l.rating.toFixed(2).replace(/0$/, "")} ({l.review_count})</> : <span className="text-muted">No reviews yet</span>}
                </p>
                {l.upcoming_bookings > 0 && (
                  <p className="mt-1 text-xs font-semibold text-[#1E7F4F]">{l.upcoming_bookings} upcoming reservation{l.upcoming_bookings > 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-sm font-semibold">
              <Link href={`/host/${l.id}/edit`} className="rounded-lg border border-hairline px-3.5 py-2 hover:border-ink">Edit</Link>
              <Link href={`/listings/${l.id}`} className="rounded-lg border border-hairline px-3.5 py-2 hover:border-ink">Preview</Link>
              <button onClick={() => askRemove(l)} title={l.upcoming_bookings ? "Reservations must be cancelled or completed first" : undefined}
                className={`rounded-lg border border-hairline px-3.5 py-2 ${l.upcoming_bookings ? "cursor-not-allowed text-muted" : "text-rausch hover:border-rausch"}`}>Remove</button>
            </div>
          </article>
        ))}
      </div>

      <Modal open={!!removing} onClose={() => !busy && setRemoving(null)} title="Remove listing"
        footer={<>
          <button className="font-semibold underline" onClick={() => setRemoving(null)}>Keep listing</button>
          <button onClick={confirmRemove} disabled={busy} className="rounded-lg bg-rausch px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Removing…" : "Remove"}</button>
        </>}>
        <p className="text-base leading-6">“{removing?.title}” will disappear from search. Past trips and reviews are kept.</p>
      </Modal>
    </div>
  );
}
