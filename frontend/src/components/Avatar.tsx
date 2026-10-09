/* eslint-disable @next/next/no-img-element */
import type { User } from "@/lib/types";

/**
 * A user's photo, or (until they add one) the first letter of their name on Airbnb's pink
 * circle. `className` sets the size and any ring; the letter scales with `text-*` in it.
 */
export default function Avatar({ user, className = "h-10 w-10" }: { user: Pick<User, "name" | "avatar_url">; className?: string }) {
  if (user.avatar_url) return <img src={user.avatar_url} alt="" className={`shrink-0 rounded-full bg-soft object-cover ${className}`} />;
  return (
    <span aria-hidden className={`flex shrink-0 select-none items-center justify-center rounded-full bg-[#f8e4f1] font-semibold text-[#8a1f6e] ${className}`}>
      {user.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
