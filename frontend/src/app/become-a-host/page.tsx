"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import HostLanding from "@/components/become-a-host/HostLanding";

/** "Set up your Airbnb listing". Open to every logged-in user; visitors log in first and come back here. */
export default function BecomeAHostPage() {
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=%2Fbecome-a-host");
  }, [ready, user, router]);

  if (user) return <HostLanding />;
  return <p className="px-5 py-20 text-center text-muted">Loading…</p>;
}
