"use client";
import { useToast } from "@/context/ToastContext";
import { money } from "@/lib/format";
import type { Offer } from "@/lib/offers";
import { CARD_W } from "./Carousel";
import { HeartIcon, StarIcon } from "./icons";

/** Airbnb Originals badge mark (a small gold quill). */
const Quill = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
    <path d="M14 2C8 2.5 4.5 6 3 11l-1 3 1 .3.9-2.4C9 11.5 13 8 14 2Z" fill="#C9A227" />
    <path d="M3.5 12.5C6 9 8.5 6.5 12 4" stroke="#8A6D12" strokeWidth=".8" fill="none" />
  </svg>
);

/**
 * Experience / service card. Booking either is a "coming soon" placeholder,
 * so clicking the card (or its heart) only shows a toast.
 */
export default function OfferCard({ offer, kind }: { offer: Offer; kind: "experiences" | "services" }) {
  const toast = useToast();
  const soon = () => toast(`Booking ${kind} is coming soon`);
  const save = (e: React.MouseEvent) => { e.stopPropagation(); toast(`Saving ${kind} is coming soon`); };

  return (
    <div role="button" tabIndex={0} onClick={soon} onKeyDown={(e) => e.key === "Enter" && soon()} className={`${CARD_W} cursor-pointer text-left`}>
      <div className="relative aspect-[1.05/1] overflow-hidden rounded-card bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offer.photo} alt={offer.title} loading="lazy" className="h-full w-full object-cover" />
        {offer.badge && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-[14px] bg-white/85 px-2.5 py-1.5 text-[11px] font-heavy leading-[13px] text-[#222] backdrop-blur-sm">
            {offer.badge === "Original" && <Quill />}{offer.badge}
          </span>
        )}
        <button onClick={save} aria-label="Save" className="absolute right-3 top-3 text-white">
          <HeartIcon className="h-6 w-6 drop-shadow" fill="rgba(0,0,0,0.5)" />
        </button>
      </div>
      <p className="mt-2 line-clamp-2 px-0.5 text-[13px] font-medium leading-4">{offer.title}</p>
      {offer.location && <p className="mt-0.5 px-0.5 text-xs text-muted">{offer.location}</p>}
      <p className="mt-0.5 flex items-center gap-1 px-0.5 text-xs text-muted">
        <span>From {money(offer.price)} / {offer.per}</span>
        {offer.rating && (
          <>
            <span aria-hidden className="font-bold text-ink/25">·</span>
            <StarIcon className="h-2.5 w-2.5" />
            <span>{Number.isInteger(offer.rating) ? offer.rating.toFixed(1) : offer.rating}</span>
          </>
        )}
      </p>
    </div>
  );
}
