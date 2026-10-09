"use client";
import HostGuard from "@/components/HostGuard";
import HostListings from "@/components/HostListings";

export default function HostListingsPage() {
  return <HostGuard>{() => <HostListings />}</HostGuard>;
}
