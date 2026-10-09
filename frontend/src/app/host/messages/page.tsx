"use client";
import { Suspense } from "react";
import HostGuard from "@/components/HostGuard";
import Inbox from "@/components/Inbox";

export default function HostMessagesPage() {
  return <HostGuard>{() => <Suspense><Inbox /></Suspense>}</HostGuard>;
}
