"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ListingCardData } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import ListingCard from "@/components/ListingCard";

export default function WishlistPage() {
  const { user, ready } = useUser();
  const [items, setItems] = useState<ListingCardData[] | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    api<ListingCardData[]>("/wishlist").then(setItems).catch(() => setItems([]));
  }, [ready, user]);

  if (ready && !user)
    return (
      <div className="px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold">Log in to see your wishlists</h1>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );

  return (
    <div className="px-5 md:px-10">
      <h1 className="mb-6 text-[28px] font-semibold">Wishlists</h1>
      {items?.length === 0 && <p className="text-muted">Nothing saved yet. Tap the heart on any place to save it.</p>}
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items?.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </div>
  );
}
