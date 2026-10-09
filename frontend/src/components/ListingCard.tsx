"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import type { ListingCardData } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { HeartIcon, StarIcon } from "./icons";

const fmtRating = (r: number) => r.toFixed(2).replace(/0$/, "");

export default function ListingCard({
  listing,
  nights = 1,
  className = "",
}: {
  listing: ListingCardData;
  nights?: number;
  className?: string;
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
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-semibold shadow-sm">
            Guest favourite
          </span>
        )}
        <button
          onClick={toggleWish}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 text-white transition-transform active:scale-90"
        >
          <HeartIcon
            className="h-7 w-7 drop-shadow"
            fill={wished ? "#FF385C" : "rgba(0,0,0,0.5)"}
          />
        </button>
      </div>
      <div className="px-1 pt-2.5">
        <h3 className="truncate text-[15px] font-medium leading-5">
          {listing.property_type} in {listing.city}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-[14px] text-muted">
          <span>
            {money(listing.price_per_night * nights)} for {nights} night{nights > 1 ? "s" : ""}
          </span>
          <span>·</span>
          {listing.rating ? (
            <span className="flex items-center gap-0.5">
              <StarIcon /> {fmtRating(listing.rating)}
            </span>
          ) : (
            <span>New</span>
          )}
        </p>
      </div>
    </Link>
  );
}
