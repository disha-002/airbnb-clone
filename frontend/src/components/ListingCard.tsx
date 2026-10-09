"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money, offerPrice } from "@/lib/format";
import type { ListingCardData } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { HeartIcon, StarIcon } from "./icons";

const fmtRating = (r: number) => r.toFixed(2).replace(/0$/, "");

export default function ListingCard({
  listing,
  nights = 1,
  className = "",
  compact = false,
}: {
  listing: ListingCardData;
  nights?: number;
  className?: string;
  /** Home-page rows use Airbnb's smaller card text (13px title, 12px details). */
  compact?: boolean;
}) {
  const { user } = useUser();
  const toast = useToast();
  const router = useRouter();
  const [wished, setWished] = useState(listing.wishlisted);
  useEffect(() => setWished(listing.wishlisted), [listing.wishlisted]);

  const toggleWish = async (e: React.MouseEvent) => {
    e.preventDefault(); // heart sits inside the card link
    if (!user) {
      toast("Log in to save places to your wishlist");
      router.push("/login");
      return;
    }
    const next = !wished;
    setWished(next); // optimistic
    try {
      await api(`/wishlist/${listing.id}`, { method: next ? "POST" : "DELETE" });
      toast(next ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      setWished(!next);
      toast("Something went wrong. Try again.");
    }
  };

  const favourite = listing.is_superhost || (listing.rating ?? 0) >= 4.85;

  return (
    <Link href={`/listings/${listing.id}`} className={`block ${className}`}>
      <div className="relative aspect-[1.05/1] overflow-hidden rounded-card bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.cover_url} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
        {favourite && (
          <span className="absolute left-3 top-3 rounded-[14px] bg-white/85 px-2.5 py-1.5 text-[11px] font-heavy leading-[13px] text-[#222] backdrop-blur-sm">
            Guest favourite
          </span>
        )}
        <button
          onClick={toggleWish}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 text-white transition-transform active:scale-90"
        >
          <HeartIcon
            className={`${compact ? "h-6 w-6" : "h-7 w-7"} drop-shadow`}
            fill={wished ? "#FF385C" : "rgba(0,0,0,0.5)"}
          />
        </button>
      </div>
      <div className={compact ? "px-0.5 pt-2" : "px-1 pt-2.5"}>
        <h3 className={`truncate font-medium ${compact ? "text-[13px] leading-4" : "text-[15px] leading-5"}`}>
          {listing.room_type === "room" ? "Room" : listing.room_type === "shared" ? "Shared room" : listing.property_type} in {listing.city}
        </h3>
        {/* Inline (not flex) so a discounted price wraps like normal text instead of squeezing the rating. */}
        <p className={`mt-0.5 text-muted ${compact ? "text-xs leading-4" : "text-[14px]"}`}>
          {listing.discount_pct > 0 && <s className="mr-1">{money(listing.price_per_night * nights)}</s>}
          <span className={listing.discount_pct > 0 ? "text-ink" : ""}>{money(offerPrice(listing, nights))}</span> for {nights} night{nights > 1 ? "s" : ""}
          {" · "}
          {listing.rating ? (
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <StarIcon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} /> {fmtRating(listing.rating)}
            </span>
          ) : "New"}
        </p>
      </div>
    </Link>
  );
}
