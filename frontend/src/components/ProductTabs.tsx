"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Airbnb's own 3D tab icons (saved under public/icons).
export const PRODUCT_TABS = [
  { label: "All", icon: "/icons/all.png", href: "/" },
  { label: "Homes", icon: "/icons/homes.png", href: "/homes" },
  { label: "Experiences", icon: "/icons/experiences.png", href: "/experiences" },
  { label: "Services", icon: "/icons/services.png", href: "/services" },
] as const;

export type ProductTab = (typeof PRODUCT_TABS)[number]["label"];

export function useActiveTab(): ProductTab {
  const path = usePathname();
  return PRODUCT_TABS.find((t) => t.href !== "/" && path.startsWith(t.href))?.label ?? "All";
}

export default function ProductTabs() {
  const active = useActiveTab();
  return (
    <div className="no-scrollbar flex justify-around gap-2 overflow-x-auto px-4 pt-1 md:justify-center">
      {PRODUCT_TABS.map((t) => (
        <Link key={t.label} href={t.href}
          className={`group flex shrink-0 flex-col items-center gap-1 border-b-2 pb-2 text-xs ${
            t.label === active ? "border-ink font-semibold text-ink" : "border-transparent text-muted"
          }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.icon} alt="" className="h-9 w-auto transition-transform duration-200 group-active:scale-90" />
          {t.label}
        </Link>
      ))}
    </div>
  );
}
