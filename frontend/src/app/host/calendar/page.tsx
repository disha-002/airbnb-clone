"use client";
import HostCalendar from "@/components/HostCalendar";
import HostGuard from "@/components/HostGuard";

export default function HostCalendarPage() {
  return <HostGuard>{() => <HostCalendar />}</HostGuard>;
}
