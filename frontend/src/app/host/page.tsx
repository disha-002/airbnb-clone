"use client";
import HostGuard from "@/components/HostGuard";
import HostDashboard from "@/components/HostDashboard";

export default function HostPage() {
  return <HostGuard>{() => <HostDashboard />}</HostGuard>;
}
