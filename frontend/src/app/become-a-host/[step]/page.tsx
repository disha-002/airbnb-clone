"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import HostWizard from "@/components/become-a-host/HostWizard";

/** One wizard step. Guests can list too (publishing makes them a host), so this only needs a login. */
export default function BecomeAHostStepPage() {
  const { step } = useParams<{ step: string }>();
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?redirect=${encodeURIComponent(`/become-a-host/${step}`)}`);
  }, [ready, user, step, router]);

  if (!user) return <div className="fixed inset-0 z-40 bg-surface" />;
  return <HostWizard slug={step} />;
}
