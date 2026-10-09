"use client";
import { Suspense } from "react";
import Inbox from "@/components/Inbox";
import { useAuthModal } from "@/context/AuthModalContext";
import { useUser } from "@/context/UserContext";

/** Guest (and any logged-in) inbox. Hosts use the same component under /host/messages. */
export default function MessagesPage() {
  const { user, ready } = useUser();
  const { openLogin } = useAuthModal();

  if (ready && !user)
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16 text-center">
        <h1 className="text-[26px] font-semibold">Messages</h1>
        <p className="mt-2 text-muted">Log in to see your messages.</p>
        <button onClick={openLogin} className="mt-6 rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 py-3 font-semibold text-white">Log in</button>
      </div>
    );
  if (!ready) return <div className="mx-auto h-64 max-w-[1120px] animate-pulse rounded-2xl bg-soft" />;
  return <Suspense><Inbox /></Suspense>;
}
