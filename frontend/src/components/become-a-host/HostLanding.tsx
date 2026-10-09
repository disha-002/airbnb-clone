"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { placeLabel } from "@/lib/format";
import { useHostDraft } from "@/lib/hostWizard";
import { useUser } from "@/context/UserContext";
import type { ListingDetail, ListingPage } from "@/lib/types";
import { Logo } from "../icons";
import AddressSearch from "./AddressSearch";

interface Slide { photo: string; title: string; host: string; avatar: string }

/** Real listings from the API, shown as the "Entire home in …" card that cycles on the right. */
function useSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  useEffect(() => {
    api<ListingPage>("/listings?page=1")
      .then((p) => Promise.all(p.items.slice(0, 6).map((l) => api<ListingDetail>(`/listings/${l.id}`))))
      .then((ls) => setSlides(ls.map((l) => ({
        photo: l.photos[0]?.url ?? l.cover_url,
        title: `${placeLabel(l.property_type, l.room_type)} in ${l.city}, ${l.country}`,
        host: l.host.name, avatar: l.host.avatar_url,
      }))))
      .catch(() => {});
  }, []);
  return slides;
}

/* eslint-disable @next/next/no-img-element */
function Slideshow() {
  const slides = useSlides();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i];

  return (
    <div className="relative flex h-[520px] items-end justify-center overflow-hidden rounded-[40px] bg-gradient-to-b from-rausch/[0.07] to-rausch/[0.03] md:h-[min(78vh,720px)]">
      <div className="w-[300px] translate-y-6 rounded-t-[36px] bg-surface p-6 pb-10 shadow-[0_10px_40px_rgba(0,0,0,0.10)] md:w-[340px]">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-soft">
          {slides.map((sl, j) => (
            <img key={sl.photo + j} src={sl.photo} alt="" aria-hidden={j !== i}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${j === i ? "scale-100 opacity-100" : "scale-105 opacity-0"}`} />
          ))}
        </div>
        <p key={`t${i}`} className="mt-6 min-h-[64px] animate-[fade-in_.6s_ease-out] text-[26px] font-semibold leading-8 tracking-tight">{s?.title ?? " "}</p>
        <div className="mt-5 flex items-center justify-between border-t border-hairline pt-5">
          <p key={`h${i}`} className="animate-[fade-in_.6s_ease-out] text-base font-semibold">{s ? `Hosted by ${s.host}` : " "}</p>
          {s && <img key={`a${i}`} src={s.avatar} alt="" className="h-10 w-10 animate-[fade-in_.6s_ease-out] rounded-full object-cover" />}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, j) => <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? "w-4 bg-ink/70" : "w-1.5 bg-ink/25"}`} />)}
        </div>
      )}
    </div>
  );
}

/** /become-a-host for hosts: "Set up your Airbnb listing – let's start with your address." */
export default function HostLanding() {
  const router = useRouter();
  const { user } = useUser();
  const isHost = user?.role === "host";
  const { draft, update, clear } = useHostDraft();
  useEffect(() => { document.title = "Add your address - Airbnb"; }, []);
  // only drafts that got past the address (picking an address here shouldn't flash this card)
  const inProgress = draft && (draft.structure || draft.photo_urls.length > 0);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-surface">
      <header className="flex h-[88px] items-center justify-between px-6 md:px-12">
        <Link href={isHost ? "/host" : "/"} aria-label={isHost ? "Back to hosting" : "Airbnb home"}><Logo className="h-8 w-8 text-rausch" /></Link>
        <Link href={isHost ? "/host/listings" : "/"} className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold hover:border-ink md:text-base">Exit</Link>
      </header>
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 pb-12 md:grid-cols-2 md:px-12 md:pb-16">
        <div className="mx-auto w-full max-w-[460px] animate-[rise_.5s_ease-out] text-center">
          <h1 className="text-[44px] font-heavy leading-[46px] tracking-[-0.04em] md:text-[64px] md:leading-[66px]">Set up your Airbnb listing</h1>
          <p className="mx-auto mt-6 max-w-[380px] text-lg leading-6 text-muted">It’s easy to create a great listing – let’s start with your address.</p>
          <div className="mt-10 text-left">
            <AddressSearch value="" autoFocus onPick={(p) => {
              update({ address: p.label, city: p.city, country: p.country, lat: p.lat, lng: p.lng });
              router.push("/become-a-host/about-your-place");
            }} />
          </div>
          {inProgress && (
            <div className="mt-10 rounded-2xl border border-hairline p-5 text-left">
              <p className="text-base font-semibold">You have a listing in progress</p>
              <p className="mt-1 text-sm text-muted">{draft.title || [draft.structure, draft.city].filter(Boolean).join(" in ") || "Started earlier"}</p>
              <div className="mt-4 flex gap-3">
                <Link href={`/become-a-host/${draft.step}`} className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface">Continue</Link>
                <button type="button" onClick={clear} className="rounded-lg px-3 py-2.5 text-sm font-semibold underline hover:bg-soft">Start over</button>
              </div>
            </div>
          )}
        </div>
        <Slideshow />
      </div>
    </div>
  );
}
