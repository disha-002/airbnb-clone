"use client";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

/** Renders children only for a logged-in host. */
export default function HostGuard({ children }: { children: (hostId: number) => React.ReactNode }) {
  const { user, ready } = useUser();
  if (!ready) return <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-2xl bg-soft" />;
  if (!user || user.role !== "host")
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">{user ? "Hosting is for host accounts" : "Log in to start hosting"}</h1>
        <p className="mt-2 text-muted">Switch to one of the demo host accounts to manage listings.</p>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Go to login</Link>
      </div>
    );
  return <>{children(user.id)}</>;
}
