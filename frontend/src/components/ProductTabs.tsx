"use client";
import { useToast } from "@/context/ToastContext";

const TABS = [
  { label: "All", icon: "🌍", soon: false },
  { label: "Homes", icon: "🏠", soon: false },
  { label: "Experiences", icon: "🎈", soon: true },
  { label: "Services", icon: "🛎️", soon: true },
];

export default function ProductTabs({ active = "All" }: { active?: string }) {
  const toast = useToast();
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3 pt-1 md:justify-center">
      {TABS.map((t) => (
        <button
          key={t.label}
          onClick={() => t.soon && toast(`${t.label} are coming soon`)}
          className={`flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[17px] shadow-tab ring-1 ring-black/5 ${
            t.label === active ? "font-semibold ring-black/15" : ""
          }`}
        >
          <span className="text-2xl leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
