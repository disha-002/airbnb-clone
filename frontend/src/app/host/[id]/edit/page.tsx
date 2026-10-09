"use client";
import HostGuard from "@/components/HostGuard";
import HostEdit from "@/components/HostEdit";

export default function EditListingPage() {
  return <HostGuard>{(hostId) => <HostEdit hostId={hostId} />}</HostGuard>;
}
