"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** "Create listing" buttons land here; listings are created with the step-by-step wizard. */
export default function NewListingPage() {
  const router = useRouter();
  useEffect(() => router.replace("/become-a-host"), [router]);
  return null;
}
