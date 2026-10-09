"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, Logo, SearchIcon, UserIcon } from "./icons";
import { useUser } from "@/context/UserContext";
import { useUnreadMessages } from "@/lib/messaging";

const ChatIcon = ({ className = "h-7 w-7" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
);
const HomeIcon = ({ className = "h-7 w-7" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden><path d="M3 11 12 4l9 7M5.5 9.5V20h13V9.5M10 20v-5h4v5" /></svg>
);

/** Phone tab bar, like Airbnb's app: Explore, Wishlists, Trips, Messages, Profile (+ Hosting for hosts). */
export default function BottomNav() {
  const path = usePathname();
  const { user } = useUser();
  const unread = useUnreadMessages();
  if (path.startsWith("/listings/") || path.startsWith("/checkout") || path.startsWith("/become-a-host")) return null;
  const items = [
    { href: "/", label: "Explore", icon: <SearchIcon className="h-6 w-6" /> },
    { href: "/wishlist", label: "Wishlists", icon: <HeartIcon className="h-6 w-6" /> },
    ...(user ? [
      { href: "/trips", label: "Trips", icon: <Logo className="h-6 w-6" /> },
      { href: "/messages", label: "Messages", icon: <ChatIcon className="h-6 w-6" />, badge: unread },
    ] : []),
    ...(user?.role === "host" ? [{ href: "/host", label: "Hosting", icon: <HomeIcon className="h-6 w-6" /> }] : []),
    { href: "/login", label: user ? "Profile" : "Log in", icon: <UserIcon className="h-6 w-6" /> },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-hairline bg-surface pb-3 pt-2 md:hidden">
      {items.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 text-[11px] ${active ? "font-semibold text-rausch" : "text-muted"}`}>
            {i.icon}
            {"badge" in i && (i.badge ?? 0) > 0 && <span className="absolute right-[calc(50%-18px)] top-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-rausch" aria-label={`${i.badge} unread`} />}
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
