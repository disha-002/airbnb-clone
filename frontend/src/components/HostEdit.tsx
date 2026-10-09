"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";
import ListingForm, { ListingFormValues } from "./ListingForm";

export default function HostEdit({ hostId }: { hostId: number }) {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<ListingFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ListingDetail>(`/listings/${id}`)
      .then((l) => {
        if (l.host.id !== hostId) return setError("You can only edit your own listings.");
        setInitial({
          title: l.title, description: l.description, property_type: l.property_type, category: l.category,
          city: l.city, country: l.country, lat: String(l.lat), lng: String(l.lng),
          price_per_night: String(l.price_per_night), cleaning_fee: String(l.cleaning_fee),
          max_guests: l.max_guests, bedrooms: l.bedrooms, beds: l.beds, bathrooms: l.bathrooms,
          photo_urls: l.photos.map((p) => p.url), amenity_ids: l.amenities.map((a) => a.id),
        });
      })
      .catch((e) => setError(e.message));
  }, [id, hostId]);

  if (error) return <p className="px-5 py-20 text-center text-muted">{error}</p>;
  if (!initial) return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-2xl bg-soft" />;
  return <ListingForm initial={initial} listingId={Number(id)} />;
}
