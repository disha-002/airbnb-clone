"use client";
import HostGuard from "@/components/HostGuard";
import HostToday from "@/components/HostToday";

export default function HostPage() {
  return <HostGuard>{() => <HostToday />}</HostGuard>;
}
