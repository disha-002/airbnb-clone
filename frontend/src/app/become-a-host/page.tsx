"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useAuthModal } from "@/context/AuthModalContext";

export default function BecomeAHostPage() {
  const { user, ready } = useUser();
  const { openHostChoice } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace("/login?redirect=%2Fbecome-a-host"); return; }
    router.replace("/");
    openHostChoice();
  }, [ready, user, router, openHostChoice]);

  return <p className="px-5 py-20 text-center text-muted">Loading…</p>;
}
