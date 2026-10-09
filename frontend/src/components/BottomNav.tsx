"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, SearchIcon, UserIcon } from "./icons";
import { useUser } from "@/context/UserContext";

export default function BottomNav() {
  const path = usePathname();
  const { user } = useUser();
  if (path.startsWith("/listings/") || path.startsWith("/checkout")) return null;
  const items = [
    { href: "/", label: "Explore", icon: <SearchIcon className="h-7 w-7" /> },
    { href: "/wishlist", label: "Wishlists", icon: <HeartIcon className="h-7 w-7" /> },
    ...(user ? [{ href: "/trips", label: "Trips", icon: <span className="text-2xl leading-7">🧳</span> }] : []),
    ...(user?.role === "host" ? [{ href: "/host", label: "Hosting", icon: <span className="text-2xl leading-7">🏠</span> }] : []),
    { href: "/login", label: user ? "Profile" : "Log in", icon: <UserIcon className="h-7 w-7" /> },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-hairline bg-white pb-3 pt-2 md:hidden">
      {items.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`flex min-w-[72px] flex-col items-center gap-1 text-xs ${active ? "font-semibold text-rausch" : "text-muted"}`}>
            {i.icon}
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
