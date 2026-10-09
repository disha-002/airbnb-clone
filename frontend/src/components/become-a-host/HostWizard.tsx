"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { STEPS, blockingIssue, draftToListing, phaseProgress, useHostDraft, type StepSlug } from "@/lib/hostWizard";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { Logo } from "../icons";
import Modal from "../Modal";
import {
  Amenities, Description, Discount, FloorPlan, Intro, Location, Photos, PreciseLocation, Price, PrivacyType,
  Receipt, Structure, Title, type StepProps,
} from "./Steps";

const SCREENS: Record<StepSlug, (p: StepProps) => React.ReactNode> = {
  "about-your-place": () => <Intro slug="about-your-place" />,
  structure: Structure,
  "privacy-type": PrivacyType,
  location: Location,
  "precise-location": PreciseLocation,
  "floor-plan": FloorPlan,
  "stand-out": () => <Intro slug="stand-out" />,
  amenities: Amenities,
  photos: Photos,
  title: Title,
  description: Description,
  "finish-setup": () => <Intro slug="finish-setup" />,
  price: Price,
  discount: Discount,
  receipt: Receipt,
};

const FAQ = [
  ["Can I change things after publishing?", "Yes. Everything you enter here (photos, price, amenities, offers) can be edited from Listings → your listing at any time."],
  ["Is my address shown to guests?", "Only the city appears on your listing. Turn off “Show precise location” and guests see an approximate area on the map until they book."],
  ["What if I stop halfway?", "Use “Save & exit”. Your answers stay saved in this browser and you can continue from Listings or Become a host."],
  ["How much do I earn?", "You keep your nightly price and cleaning fee. Guests pay a 14% service fee on top."],
];

let shownProgress = [0, 0, 0]; // where the bars were on the previous step, so they animate forward

/** Full-screen Airbnb listing wizard; one step per URL (/become-a-host/<slug>). */
export default function HostWizard({ slug }: { slug: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user, becomeHost } = useUser();
  const { draft, update, clear } = useHostDraft();
  const index = STEPS.findIndex((s) => s.slug === slug);
  const [busy, setBusy] = useState(false); // uploads in flight
  const [publishing, setPublishing] = useState(false);
  const [faq, setFaq] = useState(false);
  const [bars, setBars] = useState(shownProgress);

  useEffect(() => { if (index < 0) router.replace(`/become-a-host/${STEPS[0].slug}`); }, [index, router]);
  useEffect(() => {
    if (index < 0) return;
    document.title = `${STEPS[index].title} - Airbnb`;
    // effects run after paint, so the bars first render at the old width and then transition to the new one
    shownProgress = phaseProgress(index);
    setBars(shownProgress);
  }, [index]);
  // remember the last step for "Save & exit" -> continue
  // (not after publishing: the draft was just cleared and must stay empty)
  useEffect(() => {
    if (draft && index >= 0 && !publishing && draft.step !== slug) update({ step: STEPS[index].slug });
  }, [draft, index, slug, update, publishing]);

  if (index < 0 || !draft) return <div className="fixed inset-0 z-40 bg-surface" />;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const issue = blockingIssue(draft, step.slug);
  const go = (i: number) => router.push(`/become-a-host/${STEPS[i].slug}`, { scroll: false }); // <main> scrolls, not the window

  const publish = async () => {
    const firstGap = STEPS.findIndex((s) => blockingIssue(draft, s.slug));
    if (firstGap >= 0) { toast(blockingIssue(draft, STEPS[firstGap].slug)!); go(firstGap); return; }
    setPublishing(true);
    try {
      await api("/host/listings", { method: "POST", body: JSON.stringify(draftToListing(draft)) });
      clear();
      becomeHost(); // a guest's first listing makes them a host (the API did the same)
      shownProgress = [0, 0, 0];
      toast("Congratulations! Your listing is published");
      router.push("/host/listings");
    } catch (e) {
      toast((e as Error).message);
      setPublishing(false);
    }
  };

  const saveAndExit = () => {
    toast("Your progress is saved");
    // hosts see the draft on Listings; guests resume from the Become a host page
    router.push(user?.role === "host" ? "/host/listings" : "/become-a-host");
  };

  const Screen = SCREENS[step.slug];
  const pill = "rounded-full border border-hairline px-4 py-2 text-sm font-semibold hover:border-ink md:px-5 md:text-base";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      <header className="flex h-[72px] shrink-0 items-center justify-between px-6 md:h-[88px] md:px-12">
        <Logo className="h-8 w-8 text-ink" />
        <div className="flex gap-3">
          <button type="button" onClick={() => setFaq(true)} className={pill}>Questions?</button>
          <button type="button" onClick={saveAndExit} className={pill}>Save &amp; exit</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div key={step.slug} className="min-h-full animate-[rise_.4s_ease-out]">
          <Screen draft={draft} update={update} setBusy={setBusy} />
        </div>
      </main>

      <footer className="shrink-0 bg-surface">
        <div className="flex gap-2" aria-hidden>
          {bars.map((p, i) => (
            <div key={i} className="h-1.5 flex-1 bg-hairline">
              <div className="h-full bg-ink transition-[width] duration-700 ease-out" style={{ width: `${p * 100}%` }} />
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">Your progress: step {index + 1} out of {STEPS.length}.</p>
        <div className="flex h-[80px] items-center justify-between px-6 md:h-[88px] md:px-12">
          {index > 0
            ? <button type="button" onClick={() => go(index - 1)} className="-ml-3 rounded-lg px-3 py-2.5 text-base font-semibold underline hover:bg-soft">Back</button>
            : <span />}
          {last ? (
            <button type="button" onClick={publish} disabled={publishing}
              className="rounded-lg bg-gradient-to-r from-[#e61e4d] via-[#e31c5f] to-[#d70466] px-8 py-3.5 text-base font-semibold text-white disabled:opacity-60 md:px-10">
              {publishing ? "Publishing…" : "Publish"}
            </button>
          ) : (
            <button type="button" onClick={() => go(index + 1)} disabled={!!issue || busy} title={issue ?? undefined}
              className="rounded-lg bg-ink px-8 py-3.5 text-base font-semibold text-surface transition disabled:cursor-not-allowed disabled:bg-soft disabled:text-ink/30 md:px-12">
              Next
            </button>
          )}
        </div>
      </footer>

      <Modal open={faq} onClose={() => setFaq(false)} title="Questions?">
        <div className="space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <p className="text-base font-semibold">{q}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{a}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
