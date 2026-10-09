"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";

const CHOICES = [
  { key: "home", label: "Home", icon: "/icons/homes.png" },
  { key: "experience", label: "Experience", icon: "/icons/experiences.png" },
  { key: "service", label: "Service", icon: "/icons/services.png" },
] as const;

/** "What would you like to host?" - shown when a logged-in user clicks "Become a host". */
export default function HostChoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useUser();
  const toast = useToast();
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setChoice(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const next = () => {
    if (choice === "experience" || choice === "service") {
      toast(`Hosting ${choice === "experience" ? "experiences" : "services"} is coming soon`);
      return;
    }
    onClose();
    // Anyone can start listing a home; publishing the first listing turns a guest into a host.
    router.push(user ? "/become-a-host" : "/login?redirect=%2Fbecome-a-host");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-label="What would you like to host?"
        className="relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl md:max-w-[1000px] md:rounded-3xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-2xl hover:bg-soft">×</button>
        <h2 className="px-6 pb-6 pt-14 text-center text-[26px] font-semibold tracking-tight md:pb-10 md:pt-10 md:text-[32px]">
          What would you like to host?
        </h2>

        <div className="grid gap-3 overflow-y-auto px-6 pb-8 md:grid-cols-3 md:gap-5 md:px-7">
          {CHOICES.map((c) => (
            <button key={c.key} onClick={() => setChoice(c.key)} aria-pressed={choice === c.key}
              className={`flex items-center gap-5 rounded-3xl border px-6 py-5 text-left transition md:h-[320px] md:flex-col md:justify-center md:gap-8 md:py-0 md:text-center
                ${choice === c.key ? "border-2 border-ink bg-soft" : "border-hairline hover:border-ink/50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.icon} alt="" className="h-14 w-auto md:h-28" />
              <span className="text-lg font-semibold md:text-[22px]">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end border-t border-hairline px-6 py-5 md:px-7">
          <button onClick={next} disabled={!choice}
            className="rounded-xl bg-ink px-9 py-3.5 text-base font-semibold text-surface disabled:bg-soft disabled:text-ink/30">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
